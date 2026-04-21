'use client'

import Link from 'next/link'
import styles from '@/app/components/Footer.module.css'
import Logo3D from '@/app/components/Logo3D'

const SOCIALS = [
  {label: 'Instagram', href: 'https://instagram.com/'},
  {label: 'TikTok', href: 'https://tiktok.com/'},
  {label: 'LinkedIn', href: 'https://linkedin.com/'},
  {label: 'Pinterest', href: 'https://pinterest.com/'},
]

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <Link href="/" className={styles.logo} aria-label="V-Creative">
          <Logo3D interaction="mouseTilt" className={styles.logoMark} />
        </Link>

        <div className={styles.main}>
          <h2 className={styles.heading}><em>L</em>aat je jouw merk zien?</h2>
          <Link href="/contact" className={styles.cta}>
            Start jouw project
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.infoCol}>
          <p className={styles.infoLabel}>
            <span className={styles.infoDot} aria-hidden="true" />
            Bel of mail
          </p>
          <ul className={styles.infoList}>
            <li>
              <a href="tel:+31612345678" className={styles.infoLink}>
                +31 (0) 6 12 34 56 78
              </a>
            </li>
            <li>
              <a href="mailto:hallo@v-creative.nl" className={styles.infoLink}>
                hallo@v-creative.nl
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.infoCol}>
          <p className={styles.infoLabel}>
            <span className={styles.infoDot} aria-hidden="true" />
            Volg mijn werk
          </p>
          <ul className={styles.socialGrid}>
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className={styles.infoLink}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>Vienna Wachelder</span>
        <span>Alle rechten voorbehouden</span>
      </div>
    </footer>
  )
}

export default Footer
