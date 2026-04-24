'use client'

import { useEffect, useRef } from 'react'
import styles from '@/app/components/DynamicCursor.module.css'

/* Dynamic text cursor — a pill that follows the mouse and reveals a
   contextual CTA whenever the pointer is over an element marked with
   [data-cursor-hover]. The hover text comes from [data-cursor-text]
   on the same element.

   Notes on integration with the rest of the app:
   - pointer-events: none on the cursor so elementFromPoint never hits
     the bubble itself.
   - The WebGL canvas overlay (z-index:10, pointer-events:none) doesn't
     block hit testing — elementFromPoint still finds the underlying
     DOM targets.
   - Lenis updates window.scrollY natively, so the standard 'scroll'
     event is enough to re-check the hover target on scroll. */

const DynamicCursor = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const cursor = rootRef.current
    const textEl = textRef.current
    if (!cursor || !textEl) return

    // Skip on touch/coarse pointers — the pill is hidden via CSS anyway,
    // but we also skip the listeners + gsap import to stay light.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return
    }

    let cancelled = false
    let cleanup: (() => void) | undefined

    ;(async () => {
      const gsap = (await import('gsap')).default
      if (cancelled) return

      let mouseX = 0
      let mouseY = 0
      let hasMouseMoved = false
      let rafPending = false
      let currentText = ''

      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3.out' })
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3.out' })

      const update = () => {
        rafPending = false
        const hit = document
          .elementFromPoint(mouseX, mouseY)
          ?.closest<HTMLElement>('[data-cursor-hover]')

        const rect = cursor.getBoundingClientRect()
        const isHovering = !!hit
        const isEdge = rect.right >= window.innerWidth

        const next = isHovering ? (isEdge ? 'active-edge' : 'active') : ''
        if (cursor.getAttribute('data-cursor') !== next) {
          cursor.setAttribute('data-cursor', next)
        }

        if (hit) {
          const text = hit.getAttribute('data-cursor-text') ?? ''
          if (text && text !== currentText) {
            textEl.textContent = text
            currentText = text
          }
        }
      }

      const schedule = () => {
        if (rafPending) return
        rafPending = true
        requestAnimationFrame(update)
      }

      const onMove = (e: MouseEvent) => {
        mouseX = e.clientX
        mouseY = e.clientY
        hasMouseMoved = true
        xTo(mouseX)
        yTo(mouseY)
        schedule()
      }

      const onScroll = () => {
        if (!hasMouseMoved) return
        schedule()
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('scroll', onScroll, { passive: true })

      cleanup = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('scroll', onScroll)
      }
    })()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div ref={rootRef} className={styles.cursor} aria-hidden="true" data-cursor="">
      <div className={styles.bubble}>
        <span ref={textRef} className={styles.text}>
          Bekijk case
        </span>
      </div>
    </div>
  )
}

export default DynamicCursor
