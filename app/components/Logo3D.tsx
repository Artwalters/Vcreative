'use client'

import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import styles from '@/app/components/Header.module.css'

type Props = {
  interaction?: 'scroll' | 'mouseTilt' | 'auto'
  className?: string
}

const Logo3D = ({ interaction = 'scroll', className }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const init = async () => {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')

      if (cancelled) return

      const isTouch =
        'ontouchstart' in document.documentElement ||
        navigator.maxTouchPoints > 0
      // touch devices: dial back the supersample so battery / heat stays sane
      const SUPERSAMPLE = isTouch ? 1.25 : 2
      const dpr = Math.min(window.devicePixelRatio * SUPERSAMPLE, isTouch ? 3 : 4)
      const rect = container.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height, false)
      const maxAniso = renderer.capabilities.getMaxAnisotropy()
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.display = 'block'
      container.appendChild(renderer.domElement)

      const scene = new THREE.Scene()

      const aspect = width / height
      const frustum = 1
      const camera = new THREE.OrthographicCamera(
        (-frustum * aspect) / 2,
        (frustum * aspect) / 2,
        frustum / 2,
        -frustum / 2,
        0.1,
        10,
      )
      camera.position.set(0, 0, 3)
      camera.lookAt(0, 0, 0)

      const texLoader = new THREE.TextureLoader()
      const [matcap, iridescence] = await Promise.all([
        texLoader.loadAsync('/icons/3D/project-model-matcap.png'),
        texLoader.loadAsync('/icons/3D/iri-32.png'),
      ])
      matcap.colorSpace = THREE.SRGBColorSpace
      matcap.anisotropy = maxAniso
      matcap.minFilter = THREE.LinearMipmapLinearFilter
      matcap.magFilter = THREE.LinearFilter
      matcap.generateMipmaps = true
      iridescence.colorSpace = THREE.SRGBColorSpace
      iridescence.wrapS = THREE.ClampToEdgeWrapping
      iridescence.wrapT = THREE.ClampToEdgeWrapping
      iridescence.minFilter = THREE.LinearFilter
      iridescence.magFilter = THREE.LinearFilter

      if (cancelled) {
        renderer.dispose()
        return
      }

      const pearlMaterial = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          uMatcap: { value: matcap },
          uIridescence: { value: iridescence },
          uTint: { value: new THREE.Color(1.0, 0.94, 0.86) },
          uIriStrength: { value: 1.4 },
          uRimBoost: { value: 1.1 },
          uSpecBoost: { value: 1.6 },
          uBaseLift: { value: 0.04 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMatcap;
          uniform sampler2D uIridescence;
          uniform vec3 uTint;
          uniform float uIriStrength;
          uniform float uRimBoost;
          uniform float uSpecBoost;
          uniform float uBaseLift;
          varying vec3 vNormal;
          varying vec3 vViewPosition;

          float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

          void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 n = normalize(vNormal);
            // flip normal for back-faces so lighting matches the visible side
            if (!gl_FrontFacing) n = -n;
            vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
            vec3 y = cross(viewDir, x);
            vec2 uv = vec2(dot(x, n), dot(y, n)) * 0.495 + 0.5;
            vec3 mat = texture2D(uMatcap, uv).rgb;

            float fres = 1.0 - clamp(dot(viewDir, n), 0.0, 1.0);

            // two iridescence samples at different bands → richer pearl colour shift
            vec3 iriA = texture2D(uIridescence, vec2(fres * 0.85 + 0.05, 0.5)).rgb;
            vec3 iriB = texture2D(uIridescence, vec2(fres * 0.55 + 0.40, 0.5)).rgb;
            vec3 iri = mix(iriA, iriB, 0.5);

            // base: dark matcap × warm tint, with tiny lift for depth
            vec3 base = mat * uTint + uBaseLift;

            // pearl sheen across most of the surface, biased to rim
            float sheenWeight = mix(0.35, 1.0, smoothstep(0.0, 1.0, fres));
            vec3 sheen = iri * sheenWeight * uIriStrength;

            // screen blend so we add light instead of darkening
            vec3 col = base + sheen - base * sheen;

            // glossy specular: re-use the matcap's own brightness and tint it iridescent
            float spec = smoothstep(0.55, 1.0, luma(mat));
            col += iri * spec * uSpecBoost;

            // sharp rim flash for that wet-pearl gloss
            col += iri * pow(fres, 5.0) * uRimBoost;

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      })

      const draco = new DRACOLoader()
      draco.setDecoderPath('/draco/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)
      const gltf = await loader.loadAsync('/icons/3D/VIENNA_LOGO.glb')

      if (cancelled) {
        renderer.dispose()
        return
      }

      const model = gltf.scene
      const meshes: THREE.Mesh[] = []
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.material = pearlMaterial
          meshes.push(mesh)
        }
      })

      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)
      model.position.sub(center)

      const targetHeight = 0.92
      const fit = targetHeight / Math.max(size.x, size.y, 0.0001)
      model.scale.setScalar(fit)

      scene.add(model)

      let targetRotY = 0
      let targetRotX = 0
      let raf = 0
      let detachInteraction: (() => void) | undefined

      if (interaction === 'scroll') {
        const { getLenisInstance } = await import('@/app/lib/lenis')
        let lenis = getLenisInstance()
        if (!lenis) {
          for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 50))
            if (cancelled) return
            lenis = getLenisInstance()
            if (lenis) break
          }
        }

        const ROTATION_PER_PIXEL = 0.003
        const updateScrollTarget = () => {
          const s = lenis ? lenis.animatedScroll : window.scrollY
          const dh = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            1,
          )
          const progress = Math.min(Math.max(s / dh, 0), 1)
          const envelope = Math.sin(progress * Math.PI)
          targetRotY = s * ROTATION_PER_PIXEL * envelope
        }
        updateScrollTarget()
        model.rotation.y = targetRotY

        const onScroll = () => updateScrollTarget()
        if (lenis) {
          lenis.on('scroll', onScroll)
          detachInteraction = () => lenis!.off('scroll', onScroll)
        } else {
          window.addEventListener('scroll', onScroll, { passive: true })
          detachInteraction = () =>
            window.removeEventListener('scroll', onScroll)
        }
      } else if (interaction === 'auto') {
        /* Dual-axis rotation with non-harmonic frequencies so the motion
           never repeats identically — reads like a coin tumbling in
           zero-g rather than a metronome.
           - Y is the primary spin (continuous)
           - X does the "coin flip" tumble, slightly faster than Y
           - Each axis gets an extra sinusoidal wobble at a different
             period, pushing/pulling the speed irregularly */
        const start = performance.now()
        let autoRaf = 0
        const tick = () => {
          const t = (performance.now() - start) / 1000
          targetRotY = t * 0.95 + Math.sin(t * 0.43) * 0.5
          targetRotX = t * 1.35 + Math.sin(t * 0.61 + 1.7) * 0.55
          autoRaf = requestAnimationFrame(tick)
        }
        tick()
        detachInteraction = () => cancelAnimationFrame(autoRaf)
      } else if (isTouch) {
        // touch: subtle continuous wobble — no mouse to follow
        const start = performance.now()
        let wobbleRaf = 0
        const wobble = () => {
          const t = (performance.now() - start) / 1000
          targetRotY = Math.sin(t * 0.5) * 0.18
          targetRotX = Math.sin(t * 0.35 + 1.2) * 0.08
          wobbleRaf = requestAnimationFrame(wobble)
        }
        wobble()
        detachInteraction = () => cancelAnimationFrame(wobbleRaf)
      } else {
        // mouseTilt: bind to nearest <footer>, fall back to window
        const tiltZone =
          (container.closest('footer') as HTMLElement | null) ?? null
        const TILT = 0.22
        const onMove = (e: MouseEvent) => {
          const rect = (tiltZone ?? document.documentElement).getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const nx = (e.clientX - cx) / (rect.width / 2)
          const ny = (e.clientY - cy) / (rect.height / 2)
          targetRotY = Math.max(Math.min(nx, 1), -1) * TILT
          targetRotX = Math.max(Math.min(ny, 1), -1) * TILT * 0.6
        }
        const onLeave = () => {
          targetRotY = 0
          targetRotX = 0
        }
        const zone = tiltZone ?? window
        zone.addEventListener('mousemove', onMove as EventListener)
        zone.addEventListener('mouseleave', onLeave as EventListener)
        detachInteraction = () => {
          zone.removeEventListener('mousemove', onMove as EventListener)
          zone.removeEventListener('mouseleave', onLeave as EventListener)
        }
      }

      const animate = () => {
        model.rotation.y += (targetRotY - model.rotation.y) * 0.12
        model.rotation.x += (targetRotX - model.rotation.x) * 0.12
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
      }
      animate()

      const handleResize = () => {
        const r = container.getBoundingClientRect()
        const w = Math.max(r.width, 1)
        const h = Math.max(r.height, 1)
        const a = w / h
        camera.left = (-frustum * a) / 2
        camera.right = (frustum * a) / 2
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
      }
      window.addEventListener('resize', handleResize)

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', handleResize)
        detachInteraction?.()
        meshes.forEach((m) => m.geometry?.dispose())
        pearlMaterial.dispose()
        matcap.dispose()
        iridescence.dispose()
        draco.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className ?? styles.logoMark}
      aria-hidden="true"
    />
  )
}

export default Logo3D
