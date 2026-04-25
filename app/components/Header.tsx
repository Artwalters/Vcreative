'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from '@/app/components/Header.module.css'
import Logo3D from '@/app/components/Logo3D'
import MenuOverlay from '@/app/components/MenuOverlay'

const Header = () => {
  /* State lives here so the menu button and the overlay stay in sync.
     Header is rendered once in the root layout, so this survives
     client-side navigation. */
  const [menuOpen, setMenuOpen] = useState(false)
  /* Hover triggers a subtle partial reveal — a little ink bleeds into
     the top-left corner as a "teaser". Clicking commits the rest of
     the animation. Pointer-based; doesn't activate on touch. */
  const [menuHover, setMenuHover] = useState(false)
  /* When the user clicks 'sluit' while still hovering the button we
     need the close animation to run all the way back to `uReveal=1`
     and NOT snap back into the hover-teaser state just because the
     cursor happens to still be over the button. This lock suppresses
     the hover state until the cursor physically leaves the button. */
  const [hoverLocked, setHoverLocked] = useState(false)

  /* Close the menu whenever the route changes. The MenuOverlay's own
     items already close themselves on click, but the Header's own
     links (logo, contact) and any external nav (browser back) leave
     the menu open behind the page transition without this. The menu's
     own ink dissolve serves as the page cover (PageTransition skips
     its cream fade while the menu is up — see body[data-menu-open]). */
  const pathname = usePathname()
  useEffect(() => {
    setMenuOpen(false)
    setMenuHover(false)
    setHoverLocked(false)
  }, [pathname])

  /* Mirror open state onto <body> so PageTransition can detect it
     (it's outside Header's React tree). When the menu is open it
     becomes the page cover itself, so PageTransition skips its cream
     fade and lets the ink dissolve reveal the incoming page. */
  useEffect(() => {
    document.body.dataset.menuOpen = menuOpen ? 'true' : 'false'
  }, [menuOpen])

  /* PageTransition dispatches this when the user clicks a link
     pointing to the current page while the menu is open — pathname
     doesn't change so the route effect above doesn't fire, and we
     need an explicit signal to close the overlay. */
  useEffect(() => {
    const onCloseRequest = () => {
      setMenuOpen(false)
      setMenuHover(false)
      setHoverLocked(false)
    }
    document.addEventListener('vienna:close-menu', onCloseRequest)
    return () =>
      document.removeEventListener('vienna:close-menu', onCloseRequest)
  }, [])

  const toggleMenu = () => {
    if (menuOpen) {
      /* About to close — lock out hover until the pointer leaves so
         the ink retreats fully. */
      setHoverLocked(true)
    }
    setMenuOpen((v) => !v)
  }

  /* Touch devices fire synthesised mouseenter + focus events on tap,
     which used to flash the hover-teaser ink before the tap-to-toggle
     registered. Gate hover on a real pointing device via matchMedia —
     this is the same check the DynamicCursor uses, so the two stay
     consistent. Server-render is a no-op (no window); on client first
     paint the check runs before hover ever fires, no hydration risk. */
  const canHover = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const handleEnter = () => {
    if (!canHover()) return
    setMenuHover(true)
  }

  const handleLeave = () => {
    setMenuHover(false)
    setHoverLocked(false)
  }

  /* Hover is only "effective" when it shouldn't be suppressed by the
     close-lock. Drives both the ink teaser and the button label/colour. */
  const effectiveHover = menuHover && !hoverLocked
  const label = menuOpen ? 'close' : effectiveHover ? 'open' : 'menu'

  return (
    <>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuLink}
          onClick={toggleMenu}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocus={handleEnter}
          onBlur={handleLeave}
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          data-open={menuOpen}
          data-hover={effectiveHover && !menuOpen}
          data-chrome="tl"
        >
          <span className={styles.menuDot} />
          {label}
        </button>

        <Link
          href="/"
          className={styles.logo}
          aria-label="V-Creative"
          data-menu-open={menuOpen}
        >
          <Logo3D interaction="mouseTilt" />
        </Link>

        <Link
          href="/contact"
          className={styles.contactLink}
          data-menu-open={menuOpen}
          data-chrome="tr"
        >
          contact
        </Link>
      </header>

      <MenuOverlay
        open={menuOpen}
        hover={menuHover && !hoverLocked}
        onClose={() => setMenuOpen(false)}
      />
    </>
  )
}

export default Header
