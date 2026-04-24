'use client'

import { useEffect, useRef } from 'react'
import styles from '@/app/components/ScrollProgress.module.css'

/* Page-scroll indicator — a thin ring in the bottom-right corner that
   fills clockwise as the page scrolls. Reads window.scrollY directly:
   Lenis updates the native scroll position while smoothing it, so the
   standard scroll event is both accurate and already rAF-throttled by
   the browser, no Lenis subscription needed.

   The dashoffset is mutated via ref instead of React state so the ring
   tracks the scroll without triggering a re-render on every frame. */

const RADIUS = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ScrollProgress = () => {
  const progressRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const el = progressRef.current
    if (!el) return

    const update = () => {
      const scrollTop = window.scrollY
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight
      const p =
        scrollable > 0
          ? Math.max(0, Math.min(1, scrollTop / scrollable))
          : 0
      el.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - p))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    /* ScrollTrigger refreshes (pin spacers, route changes) can change
       the max-scroll height. Poll once on load so the ring is correct
       after the layout has settled. */
    const settleTimer = window.setTimeout(update, 400)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.clearTimeout(settleTimer)
    }
  }, [])

  return (
    <div className={styles.root} aria-hidden data-chrome="br">
      <svg className={styles.svg} viewBox="0 0 40 40">
        <circle
          className={styles.track}
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
        />
        <circle
          ref={progressRef}
          className={styles.progress}
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
    </div>
  )
}

export default ScrollProgress
