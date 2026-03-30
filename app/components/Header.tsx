'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from '@/app/components/Header.module.css'

const Header = () => {
  const logoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const onScroll = () => {
      if (!logoRef.current) return
      const opacity = Math.max(0, 1 - window.scrollY / 200)
      logoRef.current.style.opacity = String(opacity)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} ref={logoRef}>
        <Image
          src="/logo/logomain.svg"
          alt="V-Creative"
          width={200}
          height={60}
          priority
        />
      </Link>
      <button className={styles.menuButton}>Menu</button>
    </header>
  )
}

export default Header
