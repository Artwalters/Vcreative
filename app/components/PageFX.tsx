'use client'

import type { ReactNode } from 'react'
import { useWebGLEffects, useGlobalParallax } from '@/app/lib/useWebGLEffects'

/* Lightweight client boundary that runs the shared scroll/WebGL hooks so
   any page — server- or client-component — gets the noise-mask text
   reveals and the [data-parallax] pan effect just by wrapping its JSX.

   Server pages keep their page.tsx as a server component (for metadata),
   import this, and render <PageFX>…</PageFX> around the body. */
const PageFX = ({ children }: { children: ReactNode }) => {
  useGlobalParallax()
  useWebGLEffects()
  return <>{children}</>
}

export default PageFX
