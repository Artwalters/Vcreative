'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from '@/app/components/Header.module.css'

const navItems = [
  { label: 'home', href: '/' },
  { label: 'cases', href: '/cases' },
  { label: 'over mij', href: '/over-mij' },
]

const Header = () => {
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Link href="/" className={styles.logo}>
        <img src="/logo/logomain.svg" alt="V-Creative" className={styles.logoImg} />
      </Link>

      <Link href="/contact" className={styles.ctaButton}>
        Start nu
        <span className={styles.ctaDot} />
      </Link>

      <span className={styles.yearLeft}>2026</span>
    </header>
  )
}

export default Header
