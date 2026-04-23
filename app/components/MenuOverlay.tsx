'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import styles from '@/app/components/MenuOverlay.module.css'

/* Menu items — keep this short + clean per the brief. */
const ITEMS = [
  { script: 'H', rest: 'ome', href: '/' },
  { script: 'P', rest: 'rojecten', href: '/cases' },
  { script: 'O', rest: 'ver', href: '/over-mij' },
  { script: 'C', rest: 'ontact', href: '/contact' },
] as const

/* Same oil-spill noise-mask as the site's text reveals. Scaled coarser
   (uv * aspect * 3.0) so the blobs read as large spreading blobs across
   the full viewport instead of tight per-letter noise. */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  uniform float uTime;
  uniform vec3 uColorBase;
  uniform vec3 uColorEdge;
  uniform vec2 uAspect;
  uniform sampler2D uNoiseTex;
  varying vec2 vUv;

  void main() {
    /* p = aspect-corrected vector from top-left corner. The corner
       sits at the origin and aspect is baked in, so the radial field
       reads as circular in screen space rather than stretched. */
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * vec2(uAspect.x, 1.0);
    float dist = length(p);

    /* reach = how far the ink has spread from the corner.
       Rest sits at -0.15 — just below the visibility threshold with
       a small safety margin for peak noise — so the tendrils don't
       have to travel a long invisible distance before they appear.
         uReveal = 1    -> reach = -0.15  (mask fully zero)
         uReveal = 0.9  -> reach ~ 0.12   (small corner blob)
         uReveal = 0    -> reach = 2.5    (covers the diagonal) */
    float reach = mix(-0.15, 2.5, 1.0 - uReveal);

    /* Early reject: pixels well outside the max possible reach skip
       the expensive noise chain entirely. Keeps the rAF loop cheap. */
    if (dist > reach + 0.85) discard;

    /* Slow time drift for organic self-animation. Tiny amplitude so
       the blob feels alive without anyone noticing it moves. */
    vec2 tDrift = vec2(sin(uTime * 0.18), cos(uTime * 0.14)) * 0.22;

    /* ── Domain-warped FBM ──
       Two warping passes + four octaves. Warping breaks the tile
       grid into curved, eddying flows (the trick fluid sims use).
       Time drift is mixed into the warps so the whole field slowly
       churns instead of any one octave visibly panning. */
    vec2 q = p * 1.0 + tDrift * 0.5;
    vec2 w1 = vec2(
      texture2D(uNoiseTex, q).r,
      texture2D(uNoiseTex, q + vec2(5.2, 1.3)).r
    ) - 0.5;

    vec2 r = p * 1.8 + w1 * 0.8 + tDrift;
    vec2 w2 = vec2(
      texture2D(uNoiseTex, r + vec2(1.7, 9.2)).r,
      texture2D(uNoiseTex, r + vec2(8.3, 2.8)).r
    ) - 0.5;

    /* Four octaves — extra high-frequency layer adds fine wispy
       grain at the tendril tips so it no longer reads as noise. */
    float n1 = texture2D(uNoiseTex, p * 1.5 + w2 * 0.7).r;
    float n2 = texture2D(uNoiseTex, p * 3.5 + w1 * 0.4 + tDrift * 0.5).r;
    float n3 = texture2D(uNoiseTex, p * 8.0 + w2 * 0.2).r;
    float n4 = texture2D(uNoiseTex, p * 18.0 + tDrift).r;
    float noise = n1 * 0.4 + n2 * 0.3 + n3 * 0.2 + n4 * 0.1;

    /* Noise amplitude grows strongly with reach. Small blob stays
       tight; big blob gets long, reaching tendrils. Clamped so the
       hover state can't shoot fingers across the viewport. */
    float noiseAmp = clamp(0.1 + reach * 0.45, 0.12, 1.1);

    float distorted = dist - (noise - 0.5) * noiseAmp;

    /* Narrow feather for a crisp liquid edge. */
    float mask = smoothstep(reach + 0.05, reach - 0.05, distorted);
    if (mask < 0.01) discard;

    /* ── Depth / vignette shading ──
       Dark core near the corner, lighter toward the body edge. The
       power curve <1 biases more of the blob toward the lighter
       tone so the vignette reads clearly even at small reaches. */
    float depthRaw = clamp(dist / max(reach + 0.3, 0.25), 0.0, 1.0);
    float depth = pow(depthRaw, 0.65);
    vec3 colorMix = mix(uColorBase, uColorEdge, depth);

    /* Rim highlight: the semi-transparent feather zone (tendril tips,
       wisps) gets a lighter tone, giving that oil-sheen edge where
       the ink thins out against the paper. */
    float rim = 1.0 - smoothstep(0.25, 0.9, mask);
    colorMix = mix(colorMix, uColorEdge, rim * 0.8);

    gl_FragColor = vec4(colorMix, mask);
  }
`

type Props = {
  open: boolean
  hover?: boolean
  onClose: () => void
}

const MenuOverlay = ({ open, hover = false, onClose }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  /* Refs into the WebGL pipeline we create async — the open/close
     effect needs to be able to tween the material's uReveal uniform
     and re-render the scene without re-creating it. */
  const materialRef = useRef<{ uniforms: { uReveal: { value: number } } } | null>(null)
  const renderRef = useRef<(() => void) | null>(null)
  const firstItemRef = useRef<HTMLAnchorElement | null>(null)

  /* ── Three.js setup (once on mount) ── */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const init = async () => {
      const THREE = await import('three')
      if (cancelled) return

      const width = window.innerWidth
      const height = window.innerHeight

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height, false)
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace

      const canvas = renderer.domElement
      canvas.className = styles.canvas
      container.appendChild(canvas)

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
      camera.position.z = 1

      /* Load the pre-baked noise texture (same family Immersive-G uses
         for their oil-spill reveals). Repeat wrapping so we can tile it
         freely in the shader. */
      const texLoader = new THREE.TextureLoader()
      const noiseTex = await texLoader.loadAsync('/noises/mask-noise.png')
      if (cancelled) {
        noiseTex.dispose()
        renderer.dispose()
        return
      }
      noiseTex.wrapS = THREE.RepeatWrapping
      noiseTex.wrapT = THREE.RepeatWrapping
      noiseTex.minFilter = THREE.LinearFilter
      noiseTex.magFilter = THREE.LinearFilter

      const material = new THREE.ShaderMaterial({
        transparent: true,
        vertexShader,
        fragmentShader,
        uniforms: {
          /* In this shader uReveal=1 means "mask fully dissolved /
             screen clear", uReveal=0 means "mask fully covering /
             screen fully ink" — same semantics as the site's text
             reveals. At rest the menu is closed, so we start dissolved. */
          uReveal: { value: 1 },
          /* Elapsed seconds — drives the slow domain-warp drift that
             keeps the ink feeling alive even between tweens. */
          uTime: { value: 0 },
          /* Navy (#332f29) — the dark core of the ink. */
          uColorBase: {
            value: new THREE.Vector3(0x33 / 255, 0x2f / 255, 0x29 / 255),
          },
          /* Lifted navy (~#7d7971) — the lighter rim tone so edges
             and tendril tips glow slightly against the core. */
          uColorEdge: {
            value: new THREE.Vector3(0x7d / 255, 0x79 / 255, 0x71 / 255),
          },
          uAspect: { value: new THREE.Vector2(width / height, 1) },
          uNoiseTex: { value: noiseTex },
        },
      })

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
      scene.add(mesh)

      const render = () => renderer.render(scene, camera)
      render()

      materialRef.current = material as unknown as {
        uniforms: { uReveal: { value: number } }
      }
      renderRef.current = render

      /* Continuous rAF loop so the time-drift noise animates on its
         own between tweens. When the blob is fully dissolved
         (uReveal ≈ 1) we skip the draw call — the loop keeps
         updating uTime so it resumes seamlessly on reveal, but the
         GPU stays idle while the menu is closed. */
      const startT = performance.now()
      renderer.setAnimationLoop(() => {
        material.uniforms.uTime.value = (performance.now() - startT) * 0.001
        if ((material.uniforms.uReveal.value as number) < 0.999) {
          renderer.render(scene, camera)
        }
      })

      const onResize = () => {
        const w = window.innerWidth
        const h = window.innerHeight
        renderer.setSize(w, h, false)
        ;(material.uniforms.uAspect.value as THREE.Vector2).set(w / h, 1)
        render()
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        window.removeEventListener('resize', onResize)
        renderer.setAnimationLoop(null)
        material.dispose()
        mesh.geometry.dispose()
        noiseTex.dispose()
        renderer.dispose()
        if (canvas.parentNode === container) container.removeChild(canvas)
        materialRef.current = null
        renderRef.current = null
      }
    }

    init()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  /* ── Tween uReveal when `open` flips ── */
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const gsap = (await import('gsap')).default
      if (cancelled) return

      const material = materialRef.current
      const render = renderRef.current
      if (!material || !render) return

      gsap.killTweensOf(material.uniforms.uReveal)

      /* Three resting states for the mask:
           1    = fully dissolved (screen clear — menu is closed)
           0.9  = small ink blob in the top-left corner (hover teaser)
           0    = fully covered (menu open)
         Durations match the visual weight of each transition. */
      if (open) {
        gsap.to(material.uniforms.uReveal, {
          value: 0,
          duration: 2.0,
          ease: 'power3.inOut',
          onUpdate: render,
        })
      } else if (hover) {
        gsap.to(material.uniforms.uReveal, {
          /* Tiny corner teaser — only a sliver of ink tendrils in the
             very top-left corner. Lower = more spread, higher = smaller
             / tighter to the corner. */
          value: 0.9,
          /* power2.out + short duration so the trails appear quickly
             as the cursor enters the hover zone instead of creeping
             up over a long invisible run. */
          duration: 0.75,
          ease: 'power2.out',
          onUpdate: render,
        })
      } else {
        gsap.to(material.uniforms.uReveal, {
          value: 1,
          duration: 0.55,
          ease: 'power2.inOut',
          onUpdate: render,
        })
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [open, hover])

  /* ── Pause page scroll while the menu is open ── */
  useEffect(() => {
    if (!open) return
    type LenisLike = { stop?: () => void; start?: () => void }
    let lenis: LenisLike | null = null
    let active = true

    ;(async () => {
      const { getLenisInstance } = await import('@/app/lib/lenis')
      if (!active) return
      lenis = getLenisInstance() as LenisLike | null
      lenis?.stop?.()
    })()

    document.body.style.overflow = 'hidden'

    return () => {
      active = false
      document.body.style.overflow = ''
      lenis?.start?.()
    }
  }, [open])

  /* ── ESC to close + focus first item on open ── */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    /* small delay so the focus ring lands after the oil-spill has
       mostly covered the viewport, matching the item fade-in. */
    const t = setTimeout(() => firstItemRef.current?.focus(), 1300)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open, onClose])

  return (
    <div
      ref={containerRef}
      className={styles.root}
      data-open={open}
      aria-hidden={!open}
    >
      <nav id="main-menu" className={styles.menu} aria-label="Hoofdnavigatie">
        {ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.item}
            onClick={onClose}
            ref={i === 0 ? firstItemRef : undefined}
            tabIndex={open ? 0 : -1}
          >
            <em>{item.script}</em>
            {item.rest}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default MenuOverlay
