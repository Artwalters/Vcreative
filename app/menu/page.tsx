import Link from 'next/link'
import Footer from '@/app/components/Footer'
import styles from '@/app/menu/menu.module.css'

const NAV = [
  { label: 'Home', script: 'H', rest: 'ome', href: '/' },
  { label: 'Over mij', script: 'O', rest: 'ver mij', href: '/over-mij' },
  { label: 'Cases', script: 'C', rest: 'ases', href: '/cases' },
  { label: 'Contact', script: 'C', rest: 'ontact', href: '/contact' },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'TikTok', href: 'https://tiktok.com/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/' },
  { label: 'Pinterest', href: 'https://pinterest.com/' },
]

const Menu = () => (
  <div className={styles.page}>
    <div className={styles.shell}>
      <div className={styles.intro}>
        <p className={styles.label}>
          <span className={styles.labelDot} aria-hidden="true" />
          Menu
        </p>
        <p className={styles.tagline}>
          <em>L</em>aat je merk leven
          <br />
          met content die klopt
        </p>
        <div className={styles.contactBlock}>
          <p className={styles.contactLabel}>Direct contact</p>
          <ul className={styles.contactList}>
            <li>
              <a href="mailto:hallo@v-creative.nl">hallo@v-creative.nl</a>
            </li>
            <li>
              <a href="tel:+31612345678">+31 (0) 6 12 34 56 78</a>
            </li>
          </ul>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Hoofdnavigatie">
        {NAV.map((item, i) => (
          <Link key={item.label} href={item.href} className={styles.navLink}>
            <span className={styles.navIndex} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <em>{item.script}</em>
            {item.rest}
          </Link>
        ))}
        <ul className={styles.socials}>
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>

    <Footer />
  </div>
)

export default Menu
