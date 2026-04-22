'use client'

import { useEffect } from 'react'
import { setLenisInstance } from '@/app/lib/lenis'

/* Lenis smooth scroll, driven by the GSAP ticker. This is the
   canonical Lenis ↔ ScrollTrigger integration:
     - GSAP's ticker pumps Lenis's RAF so timing stays synced
     - Lenis forwards its scroll events to ScrollTrigger.update
   Without the forward, ScrollTrigger only gets native scroll events,
   which can lag behind the eased scroll position and make scrubbed
   animations feel sluggish or skipped after client-side navigation. */
const LenisScroll = () => {
  useEffect(() => {
    let lenis: any
    let tickerFn: ((time: number) => void) | undefined
    let scrollTriggerUpdate: (() => void) | undefined
    let gsapRef: typeof import('gsap')['default'] | undefined

    const init = async () => {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return
      }

      const [{ default: Lenis }, gsapMod, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      const gsap = gsapMod.default
      gsap.registerPlugin(ScrollTrigger)
      gsapRef = gsap

      lenis = new Lenis({
        // iOS Safari: disable touch smoothing to avoid address-bar flicker
        syncTouch: false,
      })
      setLenisInstance(lenis)

      // Feed Lenis scroll events straight into ScrollTrigger
      scrollTriggerUpdate = () => ScrollTrigger.update()
      lenis.on('scroll', scrollTriggerUpdate)

      // Drive Lenis from the GSAP ticker (seconds → milliseconds)
      tickerFn = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tickerFn)
      gsap.ticker.lagSmoothing(0)
    }

    init()

    return () => {
      if (tickerFn && gsapRef) gsapRef.ticker.remove(tickerFn)
      if (lenis && scrollTriggerUpdate) lenis.off('scroll', scrollTriggerUpdate)
      if (lenis) {
        lenis.destroy()
        setLenisInstance(null)
      }
    }
  }, [])

  return null
}

export default LenisScroll
