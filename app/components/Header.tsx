import styles from '@/app/components/Header.module.css'

const Header = () => {
  return (
    <header className={styles.header}>
      <button className={styles.menuButton}>Menu</button>
    </header>
  )
}

export default Header
