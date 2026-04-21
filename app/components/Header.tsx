'use client'

import Link from 'next/link'
import styles from '@/app/components/Header.module.css'
import Logo3D from '@/app/components/Logo3D'

const Header = () => {
  return (
    <header className={styles.header}>
      <Link href="/menu" className={styles.menuLink}>
        <span className={styles.menuDot} />
        menu
      </Link>

      <Link href="/" className={styles.logo} aria-label="V-Creative">
        <Logo3D />
      </Link>

      <Link href="/contact" className={styles.contactLink}>
        contact
      </Link>
    </header>
  )
}

export default Header
