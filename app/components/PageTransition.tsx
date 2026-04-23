'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import styles from '@/app/components/PageTransition.module.css'

/* Simple cream fade page-transition.
   - Intercept internal link clicks, fade the overlay in, push the
     route, then fade out once the new pathname lands.
   - While covered: stop Lenis, reset scroll to 0, kill leftover
     ScrollTriggers from the old page, then refresh once the new
     page has mounted — without this the next page either opens
     mid-scroll or shows triggers firing seconds later. */
type LenisLike = {
  stop?: () => void
  start?: () => void
  scrollTo?: (target: number, opts?: {immediate?: boolean; force?: boolean}) => void
  resize?: () => void
}

const PageTransition = () => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const firstPathRef = useRef(pathname)
  const [active, setActive] = useState(false)
  const navigatingRef = useRef(false)

  /* Fade OUT after pathname change — also does the scroll/trigger
     reset while the cream still covers the viewport. */
  useEffect(() => {
    if (firstPathRef.current === pathname) return
    firstPathRef.current = pathname

    let cancelled = false

    ;(async () => {
      const [gsapMod, stMod, lenisMod] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('@/app/lib/lenis'),
      ])
      if (cancelled) return

      const gsap = gsapMod.default
      const {ScrollTrigger} = stMod
      const lenis = lenisMod.getLenisInstance() as LenisLike | null

      /* Entire reset sequence happens while the overlay is at full
         opacity, BEFORE we start fading out. Anything visible during
         the fade-out is therefore the final, settled layout. */

      /* 1. Force scroll to the top. Both Lenis and the window need to
            agree — Lenis drives animated scroll, but ScrollTrigger
            reads window.scrollY as a fallback and Next's default
            scroll-restoration writes to it too. */
      if (lenis?.scrollTo) {
        lenis.scrollTo(0, {immediate: true, force: true})
      }
      window.scrollTo(0, 0)

      /* 2. Give the new page two frames to paint its initial layout
            so ScrollTrigger measures post-mount positions, not the
            old page's DOM. */
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      if (cancelled) return

      /* 3. Re-measure every ScrollTrigger now that layout + scroll
            are stable. GSAP otherwise only refreshes on the window
            load event (which doesn't re-fire on SPA nav). */
      lenis?.resize?.()
      ScrollTrigger.refresh()

      /* 4. Stabilisation pause — useWebGLEffects init is async
            (awaits fonts + image textures) and registers its triggers
            slightly later. Holding the cream cover for a beat lets
            those land so the *second* refresh below catches them
            before the reveal starts. */
      await new Promise<void>((r) => setTimeout(r, 280))
      if (cancelled) return

      lenis?.resize?.()
      ScrollTrigger.refresh()
      lenis?.start?.()

      const overlay = overlayRef.current
      if (!overlay) {
        navigatingRef.current = false
        setActive(false)
        return
      }

      /* 5. Smooth reveal. Longer duration + gentler ease so it reads
            as a deliberate transition rather than a quick swap. */
      gsap.to(overlay, {
        autoAlpha: 0,
        duration: 0.95,
        ease: 'power2.inOut',
        onComplete: () => {
          navigatingRef.current = false
          setActive(false)
        },
      })
    })()

    return () => {
      cancelled = true
    }
  }, [pathname])

  /* Fade IN on internal link click, then push the route. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.defaultPrevented) return

      const anchor = (e.target as HTMLElement | null)?.closest('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href) return
      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) return

      const url = new URL(anchor.href, window.location.origin)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return

      e.preventDefault()

      if (navigatingRef.current) return
      navigatingRef.current = true
      setActive(true)

      const dest = url.pathname + url.search + url.hash

      ;(async () => {
        const [gsapMod, lenisMod] = await Promise.all([
          import('gsap'),
          import('@/app/lib/lenis'),
        ])
        const gsap = gsapMod.default
        const lenis = lenisMod.getLenisInstance() as LenisLike | null

        /* Freeze the current scroll so wheel/touch input during the
           fade can't scroll the outgoing page behind the overlay. */
        lenis?.stop?.()

        const overlay = overlayRef.current
        if (!overlay) {
          router.push(dest)
          return
        }
        gsap.to(overlay, {
          autoAlpha: 1,
          duration: 0.85,
          ease: 'power2.inOut',
          onComplete: () => {
            router.push(dest)
          },
        })
      })()
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [router])

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      data-active={active}
      aria-hidden="true"
    />
  )
}

export default PageTransition
