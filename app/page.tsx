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
  float n = fbm(vUv * 6.0);
  float expandedReveal = uReveal * 1.6 - 0.3;
  float mask = smoothstep(expandedReveal - 0.3, expandedReveal + 0.3, n);
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


const TextDemo = () => {
  const [webglEnabled, setWebglEnabled] = useState(true)

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

      /* ── Text overlays (background mask that dissolves to reveal DOM text) ── */

      const textElements = document.querySelectorAll<HTMLElement>(
        '[data-animation="webgl-text"]',
      )
      const texts: TextEntry[] = []
      const bgColor = new THREE.Vector3(0xf2 / 255, 0xeb / 255, 0xd9 / 255)

      textElements.forEach((element) => {
        const bounds = element.getBoundingClientRect()
        const y = bounds.top + getScrollRaw()

        const material = new THREE.ShaderMaterial({
          fragmentShader: textFragShader,
          vertexShader: textVertShader,
          transparent: true,
          uniforms: {
            uReveal: new THREE.Uniform(0),
            uColor: {value: bgColor},
          },
        })

        const mesh = new THREE.Mesh(textGeometry, material)
        mesh.scale.set(bounds.width, bounds.height, 1)
        scene.add(mesh)

        texts.push({mesh, element, material, bounds, y, isVisible: false})
      })

      /* ── Noise reveal animations ── */

      texts.forEach((t) => {
        t.isVisible = true
        const isInHero = t.element.closest(`.${styles.hero}`)

        if (isInHero) {
          gsap.to(t.material.uniforms.uReveal, {
            value: 1,
            duration: 4,
            delay: 0.3,
            ease: 'power2.inOut',
            onUpdate: () => { needsRender = true },
          })
        } else {
          gsap.to(t.material.uniforms.uReveal, {
            value: 1,
            ease: 'power2.inOut',
            onUpdate: () => { needsRender = true },
            scrollTrigger: {
              trigger: t.element,
              start: 'top bottom+=500',
              end: 'top 20%',
              scrub: 1,
            },
          })
        }
      })

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
            u_innerScale: {value: 1.0},
            u_innerY: {value: hasParallax ? -0.04 : 0.0},
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

        if (effect === 'parallax') {
          gsap.fromTo(
            img.material.uniforms.u_innerY,
            {value: -0.04},
            {
              value: 0.04,
              ease: 'none',
              scrollTrigger: {
                trigger: img.element,
                scrub: true,
                start: 'top bottom',
                end: 'bottom top',
              },
            },
          )
          gsap.fromTo(
            img.material.uniforms.u_innerScale,
            {value: 1.03},
            {
              value: 1.0,
              ease: 'none',
              scrollTrigger: {
                trigger: img.element,
                scrub: true,
                start: 'top bottom',
                end: 'bottom top',
              },
            },
          )
        }

        if (effect === 'distort') {
          gsap.fromTo(
            img.material.uniforms.u_innerScale,
            {value: 1.03},
            {
              value: 1.0,
              ease: 'none',
              scrollTrigger: {
                trigger: img.element,
                scrub: true,
                start: 'top bottom',
                end: 'bottom top',
              },
            },
          )
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
              const rect = t.element.getBoundingClientRect()
              t.mesh.position.x = rect.left + rect.width / 2 - vw / 2
              t.mesh.position.y = -(rect.top + rect.height / 2) + vh / 2
              t.mesh.scale.set(rect.width, rect.height, 1)
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
        el.style.setProperty(prop, val)
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
        <h2 data-animation="webgl-text" className={styles.heroText}>
          Social media content creatie voor ondernemers die zichtbaar willen zijn, professioneel, persoonlijk en zonder gedoe.
        </h2>
      </section>
      <section className={styles.imageGrid}>
        <figure className={styles.figure}>
          <img
            data-webgl-media
            data-webgl-effect="bend"
            src="/images/face-mist-sunlight.webp"
            alt="Face Mist in zonlicht"
            className={styles.gridImage}
          />
        </figure>
        <section className={styles.dienstenSection}>
          <div className={styles.dienstenLeft}>
            <h2 className={styles.dienstenHeading}>MIJN DIENSTEN</h2>
            <p className={styles.dienstenBody}>
              Ik sta voor sterke, persoonlijke content. Al meer dan 3 jaar werk ik aan mooie projecten voor o.a Hair by Kim, Falcon Ink, Hal XIII en andere toffe merken. Met liefde voor het vak en een creatieve blik maak ik ideeën en doelen werkelijk. Let&apos;s boost your brand!
            </p>
          </div>
          <div className={styles.dienstenRight}>
            <h2 className={styles.skillsHeading}>SKILLS</h2>
            <ul className={styles.skillsList}>
              <li>Content</li>
              <li>videografie</li>
              <li>editing</li>
              <li>contact</li>
              <li>trends</li>
            </ul>
          </div>
        </section>

        <section className={styles.klantenSection}>
          <h2 className={styles.klantenHeading}>MIJN KLANTEN</h2>
          <div className={styles.klantenGrid}>
            <div className={styles.klantenLogo} />
            <div className={styles.klantenLogo} />
            <div className={styles.klantenLogo} />
            <div className={styles.klantenLogo} />
            <div className={styles.klantenLogo} />
          </div>
        </section>
        <section className={styles.aanpakSection}>
          <p data-animation="webgl-text" className={styles.aanpakBody}>
            Het begint met luisteren. Vanuit jouw merk bouw ik een strategie, maak ik de content en zorg ik dat alles op het juiste moment live staat.
          </p>
          <a href="/cases" className={styles.aanpakLink}>Lees hoe ik dit toepas</a>
        </section>

        <section className={styles.projectenSection}>
          <div className={`${styles.projectItem} ${styles.projectLeft}`}>
            <figure className={styles.projectFigure}>
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="/images/body-oil-dramatic.webp"
                alt="Hair by Kim — Social Media Beheer"
                className={styles.projectImage}
              />
            </figure>
            <p className={styles.projectCaption}>
              Social media beheer voor Hair by Kim.<br />
              Strategie, fotografie en contentcreatie<br />
              die het merk laat groeien.
            </p>
          </div>

          <div className={`${styles.projectItem} ${styles.projectRight}`}>
            <figure className={styles.projectFigure}>
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="/images/body-oil-dark-mood.webp"
                alt="Falcon Ink — Content Creatie"
                className={styles.projectImage}
              />
            </figure>
            <p className={styles.projectCaption}>
              Content creatie voor Falcon Ink.<br />
              Van concept tot publicatie,<br />
              altijd in de juiste sfeer.
            </p>
          </div>

          <div className={`${styles.projectItem} ${styles.projectLeft}`}>
            <figure className={styles.projectFigure}>
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="/images/face-mist-duo-marble.webp"
                alt="Hal XIII — Social Media Beheer"
                className={styles.projectImage}
              />
            </figure>
            <p className={styles.projectCaption}>
              Maandelijks beheer voor Hal XIII.<br />
              Energie en kracht vertaald<br />
              naar beeld en video.
            </p>
          </div>

          <div className={`${styles.projectItem} ${styles.projectCenter}`}>
            <figure className={styles.projectFigure}>
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="/images/face-mist-sunlight.webp"
                alt="Beautysalon Glow — Contentdag"
                className={styles.projectImage}
              />
            </figure>
            <p className={styles.projectCaption}>
              Eenmalige contentdag voor Beautysalon Glow.<br />
              Een dag shooten, een maand<br />
              aan content.
            </p>
          </div>
        </section>

        <section className={styles.overSection}>
          <p data-animation="webgl-text" className={styles.overText}>
            Ik ben Viënna, het gezicht achter V-Creative. Al van jongs af aan was ik die ene vriendin met de camera zonder dat het toen al werk was. Wat begon als een hobby groeide uit tot iets veel groters.
          </p>
          <div className={styles.overGrid}>
            <div className={styles.overLogoWrap}>
              <img data-webgl-media data-webgl-effect="none" data-webgl-depth="-30" src="/logo/logopatch.png" alt="V-Creative logo" className={styles.overLogo} />
            </div>
            <div className={styles.overRow}>
              <div className={styles.overImgWrap}>
                <img data-webgl-media data-webgl-effect="none" data-webgl-depth="25" src="/images/vienna-portrait-chair.webp" alt="Viënna portret zittend op stoel" className={styles.overImg} />
              </div>
              <div className={styles.overImgWrap}>
                <img data-webgl-media data-webgl-effect="none" data-webgl-depth="-40" src="/images/vienna-photographer-camera-stairs.webp" alt="Viënna met camera op trap" className={styles.overImg} />
              </div>
              <div className={styles.overImgWrap}>
                <img data-webgl-media data-webgl-effect="none" data-webgl-depth="35" src="/images/vienna-working-desk.webp" alt="Viënna aan het werk achter bureau" className={styles.overImg} />
              </div>
            </div>
            <div className={styles.overRowBottom}>
              <div className={styles.overImgWrap}>
                <img data-webgl-media data-webgl-effect="none" data-webgl-depth="-55" src="/images/vienna-editing-photos-laptop.webp" alt="Viënna bewerkt foto's op laptop" className={styles.overImg} />
              </div>
              <div className={`${styles.overImgWrap} ${styles.overImgLarge}`}>
                <img data-webgl-media data-webgl-effect="none" data-webgl-depth="40" src="/images/vienna-photographer-portrait.webp" alt="Viënna portret met camera" className={styles.overImg} />
              </div>
            </div>
          </div>
        </section>

        <figure className={styles.figure}>
          <img
            data-webgl-media
            data-webgl-effect="bend"
            src="/images/body-oil-tilted-closeup.webp"
            alt="V-Creative behind the scenes"
            className={styles.gridImage}
          />
        </figure>
      </section>
      <Footer />
    </div>
  )
}

export default TextDemo
