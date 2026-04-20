'use client'

import Link from 'next/link'
import styles from '@/app/components/Header.module.css'

const Header = () => {
  return (
    <header className={styles.header}>
      <Link href="/menu" className={styles.menuLink}>
        <span className={styles.menuDot} />
        menu
      </Link>

      <Link href="/" className={styles.logo} aria-label="V-Creative">
        <span className={styles.logoImg} role="img" aria-hidden="true" />
      </Link>

      <Link href="/contact" className={styles.contactLink}>
        contact
      </Link>
    </header>
  )
}

export default Header
