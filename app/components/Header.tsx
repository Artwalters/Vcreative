'use client'

import Link from 'next/link'
import { useState } from 'react'
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

  const toggleMenu = () => {
    if (menuOpen) {
      /* About to close — lock out hover until the pointer leaves so
         the ink retreats fully. */
      setHoverLocked(true)
    }
    setMenuOpen((v) => !v)
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
          onMouseEnter={() => setMenuHover(true)}
          onMouseLeave={handleLeave}
          onFocus={() => setMenuHover(true)}
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
          <Logo3D />
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
