'use client'

import { useEffect, useState } from 'react'
import styles from '@/app/styles/text-demo.module.css'
import Footer from '@/app/components/Footer'
import type * as THREE from 'three'

/* ── Text Overlay Shader (background-colored mask that dissolves to reveal DOM text) ── */

const textVertShader = /* glsl */ `
precision highp float;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const textFragShader = /* glsl */ `
precision highp float;
uniform float uReveal;
uniform vec3 uColor;
uniform vec2 uAspect;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return value;
}

void main() {
  /* Aspect-corrected UV so noise isn't stretched */
  vec2 uv = vUv * uAspect * 8.0;

  /* First warp: swirly base */
  float n1 = fbm(uv);
  float n1b = fbm(uv + vec2(5.2, 1.3));
  vec2 warped = uv + vec2(n1, n1b) * 0.4;

  /* Second warp: more complexity */
  float n2 = fbm(warped + vec2(1.7, 9.2));
  float n2b = fbm(warped + vec2(8.3, 2.8));
  vec2 warped2 = warped + vec2(n2, n2b) * 0.4;

  float n3 = fbm(warped2);

  /* Fine grain on top */
  float fine = fbm(vUv * 28.0 + vec2(n2, n3) * 0.2);

  float n = n3 * 0.55 + fine * 0.45;

  float progress = uReveal * 1.5 - 0.25;
  float mask = smoothstep(progress - 0.15, progress + 0.15, n);
  if (mask < 0.01) discard;
  gl_FragColor = vec4(uColor, mask);
}
`

/* ── Image Shaders ── */

const imgVertShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec2 ssCoords;

uniform vec2 uTextureSize;
uniform vec2 uQuadSize;
uniform float u_progress;
uniform bool u_enableBend;

void main() {
  vec3 pos = position;

  mat4 MVPM = projectionMatrix * modelViewMatrix;
  vec4 originalPosition = MVPM * vec4(position, 1.0);
  ssCoords = vec2(originalPosition.xy / originalPosition.w);

  if (u_enableBend) {
    float startAt = uv.y - 0.5;
    float finishAt = uv.y;
    float bend = smoothstep(startAt, finishAt, 1.0 - u_progress);
    pos.x *= 1.0 + (bend * 0.04) * abs(ssCoords.x);
    pos.z += bend * 7.0;
  }

  vUv = uv;
  gl_Position = MVPM * vec4(pos, 1.0);
}
`

const imgFragShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uQuadSize;
uniform float u_opacity;
uniform float u_innerScale;
uniform float u_innerY;
uniform float u_edgeFade;

varying vec2 vUv;
varying vec2 ssCoords;

vec2 getCoverUv(vec2 uv, vec2 textureSize, vec2 quadSize) {
  vec2 ratio = vec2(
    min((quadSize.x / quadSize.y) / (textureSize.x / textureSize.y), 1.0),
    min((quadSize.y / quadSize.x) / (textureSize.y / textureSize.x), 1.0)
  );
  return vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  vec2 uv = getCoverUv(vUv, uTextureSize, uQuadSize);

  vec2 scaleOrigin = vec2(0.5);
  uv = (uv - scaleOrigin) / u_innerScale + scaleOrigin;
  uv.y += u_innerY;

  vec4 color = texture2D(uTexture, uv);

  float thresholdLeft = smoothstep(-0.85, -1.0, ssCoords.x) * u_edgeFade;
  float thresholdRight = smoothstep(0.85, 1.0, ssCoords.x) * u_edgeFade;
  float thresholdTop = smoothstep(0.85, 1.0, ssCoords.y) * u_edgeFade;
  float thresholdBottom = smoothstep(-0.85, -1.0, ssCoords.y) * u_edgeFade;
  float threshold = thresholdLeft + thresholdRight + thresholdBottom + thresholdTop;

  float colorShiftR = texture2D(uTexture, uv + vec2(0.0, 0.003)).r;
  float colorShiftG = texture2D(uTexture, uv - vec2(0.0, 0.003)).g;
  color.r = mix(color.r, colorShiftR, threshold);
  color.g = mix(color.g, colorShiftG, threshold);

  gl_FragColor = vec4(color.rgb, color.a * u_opacity);
}
`

/* ── Types ── */

interface TextEntry {
  mesh: THREE.Mesh
  element: HTMLElement
  material: THREE.ShaderMaterial
  bounds: DOMRect
  y: number
  isVisible: boolean
}

interface ImageEntry {
  mesh: THREE.Mesh
  element: HTMLImageElement
  material: THREE.ShaderMaterial
  effect: string
  width: number
  height: number
  top: number
  left: number
  depth: number
}


const REVIEWS = [
  {
    logo: 'https://placehold.co/240x80/faf8f2/332f29/png?text=hair+by+kim&font=playfair',
    quote:
      'Wat Viënna voor ons heeft neergezet is zoveel meer dan foto\u2019s en reels — ze heeft ons merk echt op de kaart gezet. Onze salon voelt nu ook online als onze salon.',
    author: 'Kim van Dijk',
    role: 'Eigenaar Hair by Kim',
    caseHref: '/cases/hair-by-kim',
  },
  {
    logo: 'https://placehold.co/240x80/faf8f2/332f29/png?text=falcon+ink&font=playfair',
    quote:
      'Één contentdag met Viënna leverde meer op dan maandenlang losse posts. De sfeer, de ruwheid, de energie — alles klopt met wie we zijn als studio.',
    author: 'Mark Jansen',
    role: 'Founder Falcon Ink',
    caseHref: '/cases/falcon-ink',
  },
  {
    logo: 'https://placehold.co/240x80/faf8f2/332f29/png?text=hal+xiii&font=playfair',
    quote:
      'Viënna begrijpt wat een merk nodig heeft om écht zichtbaar te worden. Geen standaard content, maar beeld dat kracht uitstraalt en ons publiek raakt.',
    author: 'Daan Vermeer',
    role: 'Owner Hal XIII',
    caseHref: '/cases/hal-xiii',
  },
] as const

const WERKWIJZE_STEPS = [
  {
    title: 'Je neemt contact op, ik leer jouw merk kennen.',
    description:
      'We gaan in gesprek — telefonisch, video of bij je op locatie. Ik wil jouw merk, doelgroep en ambities echt begrijpen voordat we beginnen.',
  },
  {
    title: 'Jij beoordeelt de offerte op mijn plan van aanpak.',
    description:
      'Je ontvangt binnen een week een heldere offerte met concrete deliverables, tijdlijn en investering. Geen verrassingen onderweg.',
  },
  {
    title: 'Zijn we een match? We gaan aan de slag!',
    description:
      'Zodra we beide tekenen plannen we de eerste contentdag in. Ik zorg voor de voorbereiding — jij hoeft alleen zelf op te komen dagen.',
  },
  {
    title: 'Ik vertaal jouw merk in content die bij je past.',
    description:
      'Van conceptuele creatie tot strategische timing — ik maak content die jouw merk versterkt en jouw publiek raakt.',
  },
  {
    title: 'We brengen het live en blijven evalueren.',
    description:
      'Na publicatie kijken we regelmatig terug: wat werkt, wat kan beter, waar groeien we door? Zo blijft jouw content scherp.',
  },
] as const

const TextDemo = () => {
  const [webglEnabled, setWebglEnabled] = useState(true)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [reviewIndex, setReviewIndex] = useState(0)

  const toggleStep = (i: number) => {
    setActiveStep((cur) => (cur === i ? null : i))
  }

  const prevReview = () => setReviewIndex((i) => (i - 1 + REVIEWS.length) % REVIEWS.length)
  const nextReview = () => setReviewIndex((i) => (i + 1) % REVIEWS.length)
  const currentReview = REVIEWS[reviewIndex]

  /* ── Studio scale-in scroll animation ── */
  useEffect(() => {
    let ctx: ReturnType<typeof import('gsap')['default']['context']> | undefined
    let cancelled = false

    ;(async () => {
      const gsap = (await import('gsap')).default
      const {ScrollTrigger} = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      if (cancelled) return

      ctx = gsap.context(() => {
        const hero = document.querySelector(`.${styles.studioHero}`) as HTMLElement | null
        const card = document.querySelector(`.${styles.studioCard}`) as HTMLElement | null
        const bg = document.querySelector(`.${styles.studioBg}`) as HTMLElement | null
        if (!hero || !card || !bg) return

        gsap.set(card, {scale: 0.35, transformOrigin: 'center center'})
        gsap.set(bg, {opacity: 1})

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: '+=180%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        tl.to(bg, {opacity: 0, ease: 'none', duration: 0.3}, 0)
        tl.to(card, {scale: 1, ease: 'none', duration: 0.5}, 0)
        tl.to({}, {duration: 0.5}, 0.5)
      })
    })()

    return () => {
      cancelled = true
      if (ctx) ctx.revert()
    }
  }, [])

  useEffect(() => {
    if (!webglEnabled) {
      document.body.classList.remove('webgl-active')
      return
    }

    document.body.classList.add('webgl-active')

    let animationId: number
    let resizeHandler: (() => void) | undefined
    let scrollHandler: (() => void) | undefined
    let canvas: HTMLCanvasElement | undefined
    let cancelled = false
    let needsRender = true

    const restoreElements: Array<{el: HTMLElement, prop: string, val: string}> = []

    const init = async () => {
      await document.fonts.ready

      const THREE = await import('three')
      const {getLenisInstance} = await import('@/app/lib/lenis')
      const gsap = (await import('gsap')).default
      const {ScrollTrigger} = await import('gsap/ScrollTrigger')
      const {EffectComposer} = await import('three/examples/jsm/postprocessing/EffectComposer.js')
      const {RenderPass} = await import('three/examples/jsm/postprocessing/RenderPass.js')
      const {ShaderPass} = await import('three/examples/jsm/postprocessing/ShaderPass.js')

      gsap.registerPlugin(ScrollTrigger)

      if (cancelled) return

      /* Scroll: use Lenis if available, fallback to native */
      let lenis = getLenisInstance()
      if (!lenis) {
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 50))
          if (cancelled) return
          lenis = getLenisInstance()
          if (lenis) break
        }
      }

      const getScroll = () => lenis ? lenis.animatedScroll : window.scrollY
      const getScrollRaw = () => lenis ? lenis.actualScroll : window.scrollY

      scrollHandler = () => { needsRender = true }
      if (lenis) {
        lenis.on('scroll', scrollHandler)
      } else {
        window.addEventListener('scroll', scrollHandler, { passive: true })
      }

      const screen = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      const DIST = 500

      const fov =
        2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI)

      const camera = new THREE.PerspectiveCamera(
        fov,
        screen.width / screen.height,
        10,
        1000,
      )
      camera.position.z = DIST

      /* ── Renderer (antialias off, stencil off — lighter on GPU) ── */

      const isTouch = 'ontouchstart' in document.documentElement
      const dpr = Math.min(window.devicePixelRatio, 2)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        stencil: false,
        powerPreference: 'high-performance',
      })
      renderer.setSize(screen.width, screen.height)
      renderer.setPixelRatio(dpr)
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace

      canvas = renderer.domElement
      canvas.style.cssText =
        'position:fixed;top:0;left:0;pointer-events:none;z-index:10;'
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      document.body.appendChild(canvas)

      /* ── Scene ── */

      const scene = new THREE.Scene()
      const textGeometry = new THREE.PlaneGeometry(1, 1)

      /* ── Text overlays ── */

      const textElements = document.querySelectorAll<HTMLElement>(
        '[data-animation="webgl-text"]',
      )
      const texts: TextEntry[] = []

      if (isTouch) {
        /* ── Mobile: per-element WebGL canvas (scrolls with DOM, no jitter) ── */
        textElements.forEach((element) => {
          element.style.position = 'relative'
          restoreElements.push({el: element, prop: 'position', val: ''})

          const bounds = element.getBoundingClientRect()
          const elDpr = Math.min(window.devicePixelRatio, 1.5)

          /* Create a small WebGL renderer per text element */
          const elRenderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: 'low-power',
          })
          elRenderer.setSize(bounds.width, bounds.height)
          elRenderer.setPixelRatio(elDpr)
          elRenderer.outputColorSpace = THREE.LinearSRGBColorSpace

          const elCanvas = elRenderer.domElement
          elCanvas.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;width:100%;height:100%;'
          element.appendChild(elCanvas)
          restoreElements.push({el: elCanvas, prop: '__remove', val: ''})

          /* Ortho camera for flat 2D overlay */
          const elCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
          elCamera.position.z = 1

          const elScene = new THREE.Scene()
          const bgColor = new THREE.Vector3(0xfa / 255, 0xf8 / 255, 0xf2 / 255)

          const aspect = bounds.width / bounds.height
          const elMaterial = new THREE.ShaderMaterial({
            fragmentShader: textFragShader,
            vertexShader: textVertShader,
            transparent: true,
            uniforms: {
              uReveal: new THREE.Uniform(0),
              uColor: {value: bgColor},
              uAspect: {value: new THREE.Vector2(aspect, 1.0)},
            },
          })

          const elMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), elMaterial)
          elScene.add(elMesh)

          /* Initial render (fully covered) */
          elRenderer.render(elScene, elCamera)

          const isInHero = element.closest(`.${styles.hero}`)

          const renderEl = () => {
            elRenderer.render(elScene, elCamera)
          }

          if (isInHero) {
            gsap.to(elMaterial.uniforms.uReveal, {
              value: 1,
              duration: 6,
              delay: 0.3,
              ease: 'power2.inOut',
              onUpdate: renderEl,
              onComplete: () => elCanvas.remove(),
            })
          } else {
            gsap.to(elMaterial.uniforms.uReveal, {
              value: 1,
              ease: 'none',
              onUpdate: renderEl,
              onComplete: () => {
                elCanvas.remove()
                elRenderer.dispose()
                elMaterial.dispose()
              },
              scrollTrigger: {
                trigger: element,
                start: 'top 85%',
                end: 'top 25%',
                scrub: 0.5,
              },
            })
          }
        })
      } else {
        /* ── Desktop: WebGL overlay (smooth with Lenis) ── */
        const bgColor = new THREE.Vector3(0xfa / 255, 0xf8 / 255, 0xf2 / 255)

        textElements.forEach((element) => {
          const bounds = element.getBoundingClientRect()
          const y = bounds.top + getScrollRaw()

          const aspect = bounds.width / bounds.height
          const material = new THREE.ShaderMaterial({
            fragmentShader: textFragShader,
            vertexShader: textVertShader,
            transparent: true,
            uniforms: {
              uReveal: new THREE.Uniform(0),
              uColor: {value: bgColor},
              uAspect: {value: new THREE.Vector2(aspect, 1.0)},
            },
          })

          const mesh = new THREE.Mesh(textGeometry, material)
          mesh.scale.set(bounds.width, bounds.height, 1)
          scene.add(mesh)

          texts.push({mesh, element, material, bounds, y, isVisible: false})
        })

        /* Noise reveal animations */
        texts.forEach((t) => {
          t.isVisible = true
          const isInHero = t.element.closest(`.${styles.hero}`)

          if (isInHero) {
            gsap.to(t.material.uniforms.uReveal, {
              value: 1,
              duration: 6,
              delay: 0.3,
              ease: 'power2.inOut',
              onUpdate: () => { needsRender = true },
            })
          } else {
            gsap.to(t.material.uniforms.uReveal, {
              value: 1,
              ease: 'none',
              onUpdate: () => { needsRender = true },
              scrollTrigger: {
                trigger: t.element,
                start: 'top 85%',
                end: 'top 25%',
                scrub: 0.5,
              },
            })
          }
        })
      }

      /* ── WebGL images (desktop only — too heavy for mobile GPU) ── */

      const mediaElements = isTouch
        ? []
        : Array.from(document.querySelectorAll<HTMLImageElement>('[data-webgl-media]'))
      const images: ImageEntry[] = []
      const imageGeometry = new THREE.PlaneGeometry(1, 1, 32, 32)
      const textureLoader = new THREE.TextureLoader()

      await Promise.all(
        mediaElements.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve()
              } else {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }
            }),
        ),
      )

      if (cancelled) return

      for (const img of mediaElements) {
        const texture = await textureLoader.loadAsync(img.src)
        const bounds = img.getBoundingClientRect()
        const effect = img.dataset.webglEffect || 'none'
        const depth = parseFloat(img.dataset.webglDepth || '0')

        const hasBend = effect === 'bend' || effect === 'distort'
        const hasParallax = effect === 'parallax'
        const hasDistort = effect === 'distort'

        const imgMaterial = new THREE.ShaderMaterial({
          vertexShader: imgVertShader,
          fragmentShader: imgFragShader,
          transparent: true,
          uniforms: {
            uTexture: {value: texture},
            uTextureSize: {
              value: new THREE.Vector2(
                texture.image.width,
                texture.image.height,
              ),
            },
            uQuadSize: {
              value: new THREE.Vector2(bounds.width, bounds.height),
            },
            u_progress: {value: 0},
            u_enableBend: {value: hasBend},
            /* Static slight zoom so the Y-pan stays within texture bounds */
            u_innerScale: {value: 1.05},
            u_innerY: {value: -0.025},
            u_opacity: {value: 1},
            u_edgeFade: {value: hasDistort ? 1.0 : 0.0},
          },
        })

        const imgMesh = new THREE.Mesh(imageGeometry, imgMaterial)
        imgMesh.scale.set(bounds.width, bounds.height, 1)
        scene.add(imgMesh)

        img.style.visibility = 'hidden'
        restoreElements.push({el: img, prop: 'visibility', val: ''})

        images.push({
          mesh: imgMesh,
          element: img,
          material: imgMaterial,
          effect,
          width: bounds.width,
          height: bounds.height,
          top: bounds.top + getScrollRaw(),
          left: bounds.left,
          depth,
        })
      }

      /* ── ScrollTrigger animations per image ── */

      images.forEach((img) => {
        const {effect} = img

        /* Every WebGL image: subtle Y parallax pan */
        gsap.fromTo(
          img.material.uniforms.u_innerY,
          {value: -0.025},
          {
            value: 0.025,
            ease: 'none',
            scrollTrigger: {
              trigger: img.element,
              scrub: true,
              start: 'top bottom',
              end: 'bottom top',
            },
          },
        )

        /* Every WebGL image: start zoomed-in (closer), settle at normal around viewport center */
        gsap.fromTo(
          img.material.uniforms.u_innerScale,
          {value: 1.12},
          {
            value: 1.05,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: img.element,
              scrub: true,
              start: 'top bottom',
              end: 'center center',
            },
          },
        )

        /* Bend/distort add the scroll-linked curl on top of the pan */
        if (effect === 'bend' || effect === 'distort') {
          gsap.to(img.material.uniforms.u_progress, {
            value: 1.5,
            ease: 'sine.out',
            scrollTrigger: {
              trigger: img.element,
              scrub: true,
              start: 'top bottom',
              end: 'bottom 70%',
            },
          })
        }
      })

      /* ── Barrel distortion post-processing ── */

      const barrelShader = {
        uniforms: {
          tDiffuse: {value: null},
          u_bendAmount: {value: -0.03},
          u_maxDistort: {value: 0.1},
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform sampler2D tDiffuse;
          uniform float u_bendAmount;
          uniform float u_maxDistort;
          varying vec2 vUv;

          vec2 barrelDistort(vec2 coord, float amt) {
            vec2 cc = coord - 0.5;
            float dist = dot(cc, cc);
            return coord + cc * dist * amt;
          }

          void main() {
            vec2 uv = vUv;
            float rDist = u_maxDistort * u_bendAmount;
            float gDist = u_maxDistort * u_bendAmount * 0.7;
            float bDist = u_maxDistort * u_bendAmount * 0.4;

            float r = texture2D(tDiffuse, barrelDistort(uv, rDist)).r;
            float g = texture2D(tDiffuse, barrelDistort(uv, gDist)).g;
            float b = texture2D(tDiffuse, barrelDistort(uv, bDist)).b;
            float a = texture2D(tDiffuse, barrelDistort(uv, gDist)).a;

            gl_FragColor = vec4(r, g, b, a);
          }
        `,
      }

      let composer: InstanceType<typeof EffectComposer> | null = null
      if (!isTouch) {
        composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))
        const barrelPass = new ShaderPass(barrelShader)
        barrelPass.renderToScreen = true
        composer.addPass(barrelPass)
      }

      /* ── Adaptive DPR: drop pixel ratio if FPS is too low ── */

      let fpsCheckCount = 0
      let fpsFrames = 0
      let fpsLastTime = performance.now()

      const checkFPS = () => {
        if (fpsCheckCount >= 10) return
        fpsFrames++
        const now = performance.now()
        if (now - fpsLastTime >= 600) {
          const fps = (fpsFrames / (now - fpsLastTime)) * 1000
          fpsFrames = 0
          fpsLastTime = now
          fpsCheckCount++

          if (fps < 30) {
            const currentDpr = renderer.getPixelRatio()
            if (currentDpr > 1.5) {
              renderer.setPixelRatio(1.5)
              if (composer) composer.setPixelRatio(1.5)
            } else if (currentDpr > 1) {
              renderer.setPixelRatio(1)
              if (composer) composer.setPixelRatio(1)
            }
          }
        }
      }

      /* ── Deferred texture uploads via requestIdleCallback ── */

      const uploadTexture = (texture: THREE.Texture) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            texture.needsUpdate = true
            renderer.initTexture(texture)
          }, {timeout: 1000})
        }
      }

      images.forEach((img) => uploadTexture(img.material.uniforms.uTexture.value))

      /* ── Render loop ── */

      const update = () => {
        checkFPS()

        if (needsRender) {
          const scrollY = getScroll()

          /* Update viewport + camera for iOS address bar changes */
          const vw = window.innerWidth
          const vh = window.innerHeight
          if (vh !== screen.height || vw !== screen.width) {
            screen.width = vw
            screen.height = vh
            camera.fov = 2 * Math.atan(vh / 2 / DIST) * (180 / Math.PI)
            camera.aspect = vw / vh
            camera.updateProjectionMatrix()
            renderer.setSize(vw, vh)
            canvas!.style.width = vw + 'px'
            canvas!.style.height = vh + 'px'
          }

          texts.forEach((t) => {
            if (t.isVisible) {
              t.mesh.position.x =
                t.bounds.left - vw / 2 + t.bounds.width / 2
              t.mesh.position.y =
                -t.y + scrollY + vh / 2 - t.bounds.height / 2
            }
          })

          images.forEach((img) => {
            img.mesh.position.x =
              img.left - screen.width / 2 + img.width / 2

            const parallaxFactor = 1 + img.depth * 0.0004
            img.mesh.position.y =
              -img.top +
              scrollY * parallaxFactor +
              screen.height / 2 -
              img.height / 2

            img.mesh.position.z = img.depth

            if (img.depth < 0) {
              const shrink = 1 - DIST / (DIST - img.depth)
              img.mesh.position.y += img.height * shrink * 8.0
            }

            const screenYPos = img.mesh.position.y
            const t = Math.max(0, Math.min(1,
              (screenYPos + screen.height * 0.5) / (screen.height * 1.5)
            ))
            img.material.uniforms.u_innerScale.value = 1.0 + (1 - t) * 0.12

            const depthScale = DIST / (DIST - img.depth)
            img.mesh.scale.set(
              img.width * depthScale,
              img.height * depthScale,
              1,
            )
          })

          if (composer) {
            composer.render()
          } else {
            renderer.render(scene, camera)
          }
          needsRender = false
        }
        animationId = requestAnimationFrame(update)
      }

      update()

      /* ── Resize ── */

      let resizeTimeout: ReturnType<typeof setTimeout>
      resizeHandler = () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          /* iOS address bar: skip resize if only height changed */
          if (isTouch && window.innerWidth === screen.width) return

          screen.width = window.innerWidth
          screen.height = window.innerHeight

          renderer.setSize(screen.width, screen.height)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

          camera.fov =
            2 * Math.atan(screen.height / 2 / DIST) * (180 / Math.PI)
          camera.aspect = screen.width / screen.height
          camera.updateProjectionMatrix()

          texts.forEach((t) => {
            t.bounds = t.element.getBoundingClientRect()
            t.y = t.bounds.top + getScrollRaw()
            t.mesh.scale.set(t.bounds.width, t.bounds.height, 1)
          })

          images.forEach((img) => {
            const bounds = img.element.getBoundingClientRect()
            img.mesh.scale.set(bounds.width, bounds.height, 1)
            img.width = bounds.width
            img.height = bounds.height
            img.top = bounds.top + getScrollRaw()
            img.left = bounds.left
            img.material.uniforms.uQuadSize.value.set(
              bounds.width,
              bounds.height,
            )
          })

          if (composer) composer.setSize(screen.width, screen.height)
          needsRender = true
        }, 150)
      }

      window.addEventListener('resize', resizeHandler)
    }

    init()

    return () => {
      cancelled = true
      if (animationId) cancelAnimationFrame(animationId)
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
      if (canvas) canvas.remove()
      document.body.classList.remove('webgl-active')
      restoreElements.forEach(({el, prop, val}) => {
        if (prop === '__remove') {
          el.remove()
        } else {
          el.style.setProperty(prop, val)
        }
      })
    }
  }, [webglEnabled])

  return (
    <div className={styles.page}>
      <button
        className={styles.toggle}
        onClick={() => setWebglEnabled((v) => !v)}
      >
        <span className={`${styles.toggleDot} ${!webglEnabled ? styles.toggleDotOff : ''}`} />
        {webglEnabled ? 'WebGL on' : 'WebGL off'}
      </button>
      <section className={styles.hero}>
        <h1 data-animation="webgl-text" className={styles.heroText}>
          <em>J</em>ij runt je bedrijf
          <br />
          ik regel je socials
        </h1>
        <p className={styles.heroSubtitle}>
          Sociale media management
          <br />
          by Vienna
        </p>
      </section>
      <figure className={styles.heroFigure}>
        <img
          data-webgl-media
          data-webgl-effect="bend"
          src="https://picsum.photos/seed/vienna-hero/1920/823"
          alt="V-Creative hero"
          className={styles.heroImage}
        />
      </figure>
      <section className={styles.imageGrid}>
        <section className={styles.projectenSection}>
          <header className={styles.projectenHeader}>
            <h2 className={styles.projectenTitle}>
              Zakelijke <em>projecten</em>
              <span className={styles.projectenYears}>2008 — 2026</span>
            </h2>
            <ul className={styles.projectenCategories}>
              <li className={styles.projectenCategory}>Horeca</li>
              <li className={styles.projectenCategory}>Onderwijs</li>
              <li className={styles.projectenCategory}>Recreatie</li>
              <li className={styles.projectenCategory}>Kantoor</li>
              <li className={styles.projectenCategory}>Zorg</li>
            </ul>
          </header>

          <article className={`${styles.projectItem} ${styles.projectFull}`}>
            <figure className={styles.projectFigure}>
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="https://picsum.photos/seed/hair-by-kim/1400/700"
                alt="Hair by Kim"
                className={styles.projectImage}
              />
            </figure>
            <div className={styles.projectContent}>
              <h3 className={styles.projectTitle}>Hair by Kim</h3>
              <p className={styles.projectDescription}>
                Social media beheer voor Hair by Kim. Strategie, fotografie en contentcreatie die het merk laat groeien.
              </p>
              <a href="/cases/hair-by-kim" className={styles.projectLink}>Bekijk case</a>
            </div>
          </article>

          <div className={styles.projectenRow}>
            <article className={`${styles.projectItem} ${styles.projectSmall}`}>
              <figure className={styles.projectFigure}>
                <img
                  data-webgl-media
                  data-webgl-effect="bend"
                  src="https://picsum.photos/seed/falcon-ink/800/600"
                  alt="Falcon Ink"
                  className={styles.projectImage}
                />
              </figure>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Falcon Ink</h3>
                <p className={styles.projectDescription}>
                  Content creatie voor Falcon Ink. Van concept tot publicatie, altijd in de juiste sfeer.
                </p>
                <a href="/cases/falcon-ink" className={styles.projectLink}>Bekijk case</a>
              </div>
            </article>

            <article className={`${styles.projectItem} ${styles.projectLarge}`}>
              <figure className={styles.projectFigure}>
                <img
                  data-webgl-media
                  data-webgl-effect="bend"
                  src="https://picsum.photos/seed/hal-xiii/1280/800"
                  alt="Hal XIII"
                  className={styles.projectImage}
                />
              </figure>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Hal XIII</h3>
                <p className={styles.projectDescription}>
                  Maandelijks beheer voor Hal XIII. Energie en kracht vertaald naar beeld en video.
                </p>
                <a href="/cases/hal-xiii" className={styles.projectLink}>Bekijk case</a>
              </div>
            </article>
          </div>

          <article className={`${styles.projectItem} ${styles.projectFull}`}>
            <figure className={styles.projectFigure}>
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="https://picsum.photos/seed/beautysalon-glow/1400/700"
                alt="Beautysalon Glow"
                className={styles.projectImage}
              />
            </figure>
            <div className={styles.projectContent}>
              <h3 className={styles.projectTitle}>Beautysalon Glow</h3>
              <p className={styles.projectDescription}>
                Eenmalige contentdag voor Beautysalon Glow. Een dag shooten, een maand aan content.
              </p>
              <a href="/cases/beautysalon-glow" className={styles.projectLink}>Bekijk case</a>
            </div>
          </article>

          <a href="/contact" className={styles.projectenCta}>Zet mij aan het werk met jouw merk</a>
        </section>
      </section>

      <section className={styles.studioSection}>
        <div className={styles.studioHero}>
          <div className={styles.studioBg}>
            <img src="https://picsum.photos/seed/studio-bg/1920/1080" alt="" className={styles.studioBgImage} />
          </div>
          <div className={styles.studioCard}>
            <p className={styles.studioLabel}>Over V-Creative</p>
            <span className={styles.studioLogo} aria-hidden="true" />
            <h2 className={styles.studioTagline}>
              Mijn missie is om jouw merk <em>écht zichtbaar</em> te maken.
            </h2>
            <p className={styles.studioScroll}>Blijf scrollen</p>
          </div>
        </div>
        <div className={styles.studioContent}>
          <div className={styles.studioContentInner}>
            <blockquote className={styles.studioQuote}>
              &ldquo;Mijn studio richt zich op het creëren van content die jouw merk écht zichtbaar maakt en de verbinding met je doelgroep versterkt.&rdquo;
            </blockquote>
            <p className={styles.studioBody}>
              Jouw content draagt jouw merk, jouw verhaal, jouw karakter — hoe je wilt dat mensen je zien en voelen. Een strategie met als resultaat beeld en video waar je trots op bent, en waarmee je met vertrouwen en energie je merk naar buiten brengt.
            </p>
            <blockquote className={styles.studioQuote}>
              &ldquo;Content is meer dan een mooie foto. Het bepaalt hoe jouw merk ervaren, herinnerd en vertrouwd wordt.&rdquo;
            </blockquote>
            <p className={styles.studioBody}>
              Concept, fotografie, video, editing. Iedere stap vraagt om aandacht. Kleur, licht, compositie en timing bepalen samen hoe jouw merk online voelt. Alles wordt doordacht en op de juiste manier ingezet — zodat elk beeld een verlengstuk is van wie jij bent.
            </p>
            <p className={styles.studioBody}>
              Ieder project krijgt een eigen aanpak, zowel in strategie als in uitvoering. Ik werk vanuit een hecht netwerk aan creatieve partners en kan je adviseren over welke aanpak bij jouw merk past. Jij houdt de regie, ik zorg dat alles op het juiste moment klopt — van eerste idee tot laatste post.
            </p>
            <a href="/over-mij" className={styles.studioCta}>Het gezicht achter de studio</a>
          </div>
        </div>
      </section>

      <section className={styles.werkwijzeSection}>
        <p className={styles.werkwijzeLabel}>Werkwijze</p>
        <h2 className={styles.werkwijzeTitle}>
          In{' '}
          <span className={styles.werkwijzeCount}>
            {String(WERKWIJZE_STEPS.length).padStart(2, '0')}
          </span>{' '}
          stappen van jouw merk naar <em>content die raakt</em>.
        </h2>

        <ul className={styles.werkwijzeList}>
          {WERKWIJZE_STEPS.map((step, i) => {
            const isActive = activeStep === i
            return (
              <li
                key={i}
                className={styles.werkwijzeItem}
                data-accordion-status={isActive ? 'active' : 'not-active'}
              >
                <button
                  type="button"
                  className={styles.werkwijzeTop}
                  onClick={() => toggleStep(i)}
                  aria-expanded={isActive}
                >
                  <span className={styles.werkwijzeNumber}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className={styles.werkwijzeH3}>{step.title}</h3>
                  <span className={styles.werkwijzeIcon} aria-hidden="true">
                    <span className={styles.werkwijzeIconH} />
                    <span className={styles.werkwijzeIconV} />
                  </span>
                </button>
                <div className={styles.werkwijzeBottom}>
                  <div className={styles.werkwijzeBottomWrap}>
                    <div className={styles.werkwijzeBottomContent}>
                      <p className={styles.werkwijzeP}>{step.description}</p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className={styles.werkwijzeCta}>
          <figure className={styles.werkwijzeCtaFigure}>
            <img
              data-webgl-media
              data-webgl-effect="bend"
              src="https://picsum.photos/seed/vienna-portrait/900/900"
              alt="Viënna"
              className={styles.werkwijzeCtaImage}
            />
          </figure>
          <p className={styles.werkwijzeCtaText}>
            Zet mij aan het werk met <em>jouw unieke merk</em>.
          </p>
          <a href="/contact" className={styles.werkwijzeCtaButton}>
            Start jouw project
          </a>
        </div>
      </section>

      <section className={styles.reviewsSection} aria-roledescription="carousel">
        <button
          type="button"
          className={`${styles.reviewsArrow} ${styles.reviewsArrowLeft}`}
          onClick={prevReview}
          aria-label="Vorige review"
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className={styles.reviewCard} key={reviewIndex}>
          <img
            src={currentReview.logo}
            alt=""
            aria-hidden="true"
            className={styles.reviewLogo}
          />
          <blockquote className={styles.reviewQuote}>
            &ldquo;{currentReview.quote}&rdquo;
          </blockquote>
          <p className={styles.reviewAuthor}>
            <span className={styles.reviewAuthorDot} aria-hidden="true" />
            {currentReview.author}
          </p>
          <p className={styles.reviewRole}>{currentReview.role}</p>
          <div className={styles.reviewStars} aria-label="5 sterren">
            {'★★★★★'}
          </div>
          <a href={currentReview.caseHref} className={styles.reviewLink}>Bekijk case</a>
        </div>

        <button
          type="button"
          className={`${styles.reviewsArrow} ${styles.reviewsArrowRight}`}
          onClick={nextReview}
          aria-label="Volgende review"
        >
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <Footer />
    </div>
  )
}

export default TextDemo
