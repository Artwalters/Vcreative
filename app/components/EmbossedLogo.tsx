'use client'

import { useEffect, useRef } from 'react'

/* WebGL-embossed logo. The PNG is treated as a height map (via its
   luminance) — in the fragment shader we Sobel the neighbouring texels
   to get a surface normal per pixel, then light that normal with a
   directional light + Phong-style specular. We output the DELTA from
   what flat paper would render, so uniform areas collapse to the exact
   cream colour (invisible against the card) and only the embossed rims
   produce visible highlights/shadows. */

type Props = {
  src: string
  className?: string
  ariaHidden?: boolean
  paperColor?: string        // cream by default
  strength?: number          // height-gradient multiplier, default 8
  azimuth?: number           // light horizontal angle in degrees (0 = right, 90 = top, 180 = left, 270 = bottom)
  elevation?: number         // light vertical angle in degrees (0 = grazing, 90 = top-down)
  specIntensity?: number     // specular brightness, default 0.8
  diffIntensity?: number     // diffuse contribution to the emboss delta, default 0.5
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec3 uPaperColor;
  uniform float uStrength;
  uniform vec3 uLightDir;
  uniform float uSpecIntensity;
  uniform float uDiffIntensity;

  varying vec2 vUv;

  float lum(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 texel = 1.0 / uResolution;

    /* 4-tap height sample → central-difference gradient */
    float hL = lum(texture2D(uTexture, vUv + vec2(-texel.x, 0.0)).rgb);
    float hR = lum(texture2D(uTexture, vUv + vec2( texel.x, 0.0)).rgb);
    float hU = lum(texture2D(uTexture, vUv + vec2(0.0,  texel.y)).rgb);
    float hD = lum(texture2D(uTexture, vUv + vec2(0.0, -texel.y)).rgb);

    float dx = (hR - hL) * uStrength;
    float dy = (hU - hD) * uStrength;

    vec3 N = normalize(vec3(-dx, -dy, 1.0));
    vec3 L = normalize(uLightDir);
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);

    /* Reference: what a perfectly flat pixel (N = +Z) would return. */
    vec3 flatN = vec3(0.0, 0.0, 1.0);
    float flatDiff = max(dot(flatN, L), 0.0);
    float flatSpec = pow(max(dot(flatN, H), 0.0), 48.0);

    float curDiff = max(dot(N, L), 0.0);
    float curSpec = pow(max(dot(N, H), 0.0), 48.0);

    float diffDelta = curDiff - flatDiff;
    float specDelta = curSpec - flatSpec;

    /* Modulate cream by how much more/less light this pixel catches.
       Zero-gradient areas (flat paper) → delta = 0 → color == cream. */
    vec3 color = uPaperColor
               + uPaperColor * diffDelta * uDiffIntensity
               + vec3(1.0)   * specDelta * uSpecIntensity;

    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ]
}

const EmbossedLogo = ({
  src,
  className,
  ariaHidden = true,
  paperColor = '#faf8f2',
  strength = 8,
  azimuth = 135,
  elevation = 45,
  specIntensity = 0.8,
  diffIntensity = 0.5,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const init = async () => {
      const THREE = await import('three')
      if (cancelled) return

      const dpr = Math.min(window.devicePixelRatio, 2)
      /* Use offsetWidth/Height (unaffected by CSS transforms) so that
         a parent-scaled container still renders at the natural
         resolution and stays crisp when the scale grows. */
      const naturalW = Math.max(container.offsetWidth, 1)
      const naturalH = Math.max(container.offsetHeight, 1)

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(dpr)
      renderer.setSize(naturalW, naturalH, false)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.display = 'block'
      container.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -1, 1)

      const loader = new THREE.TextureLoader()
      const texture = await loader.loadAsync(src)
      if (cancelled) {
        renderer.dispose()
        return
      }
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.colorSpace = THREE.SRGBColorSpace

      const azRad = (azimuth * Math.PI) / 180
      const elRad = (elevation * Math.PI) / 180
      const lightDir = new THREE.Vector3(
        Math.cos(azRad) * Math.cos(elRad),
        Math.sin(azRad) * Math.cos(elRad),
        Math.sin(elRad),
      )

      const [pr, pg, pb] = hexToRgb(paperColor)

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uResolution: {
            value: new THREE.Vector2(texture.image.width, texture.image.height),
          },
          uPaperColor: { value: new THREE.Color(pr, pg, pb) },
          uStrength: { value: strength },
          uLightDir: { value: lightDir },
          uSpecIntensity: { value: specIntensity },
          uDiffIntensity: { value: diffIntensity },
        },
        vertexShader,
        fragmentShader,
      })

      const geometry = new THREE.PlaneGeometry(1, 1)
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      const render = () => renderer.render(scene, camera)
      render()

      let resizeTimeout: ReturnType<typeof setTimeout>
      const onResize = () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          const w = Math.max(container.offsetWidth, 1)
          const h = Math.max(container.offsetHeight, 1)
          renderer.setSize(w, h, false)
          render()
        }, 120)
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        window.removeEventListener('resize', onResize)
        clearTimeout(resizeTimeout)
        geometry.dispose()
        material.dispose()
        texture.dispose()
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
  }, [
    src,
    paperColor,
    strength,
    azimuth,
    elevation,
    specIntensity,
    diffIntensity,
  ])

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden={ariaHidden}
    />
  )
}

export default EmbossedLogo
