'use client'

import { useEffect } from 'react'
import { setLenisInstance } from '@/app/lib/lenis'

const LenisScroll = () => {
  useEffect(() => {
    let lenis: any
    let raf: number

    const init = async () => {
      const Lenis = (await import('lenis')).default
      lenis = new Lenis()
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
