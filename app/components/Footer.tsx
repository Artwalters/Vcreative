import Image from 'next/image'
import Link from 'next/link'
import styles from '@/app/components/Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <h2 className={styles.heading}>
        Ik ontzorg jouw hele bedrijf en neem jouw sociale media over.
      </h2>
      <Link href="/contact" className={styles.avatar}>
        <div className={styles.avatarPlaceholder} />
      </Link>
      <div className={styles.logo}>
        <Image
          src="/logo/logomain.svg"
          alt="V-Creative"
          width={150}
          height={45}
        />
      </div>
    </footer>
  )
}

export default Footer
