'use client'

import { useEffect } from 'react'
import { setLenisInstance } from '@/app/lib/lenis'

const LenisScroll = () => {
  useEffect(() => {
    let lenis: any
    let raf: number

    const init = async () => {
      // Skip smooth scroll if user prefers reduced motion
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return
      }

      const Lenis = (await import('lenis')).default
      lenis = new Lenis({
        // iOS Safari: disable touch smoothing to avoid address-bar flicker / jank
        syncTouch: false,
      })
      setLenisInstance(lenis)

      const animate = (time: number) => {
        lenis.raf(time)
        raf = requestAnimationFrame(animate)
      }

      raf = requestAnimationFrame(animate)
    }

    init()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (lenis) {
        lenis.destroy()
        setLenisInstance(null)
      }
    }
  }, [])

  return null
}

export default LenisScroll
