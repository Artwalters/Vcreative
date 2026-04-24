import styles from '@/app/components/YearStamp.module.css'

/* Server-rendered year stamp in the bottom-left corner. `new Date()`
   evaluates at request/build time, so every deploy stamps the current
   year — no client hydration, no extra bundle cost. */

const YearStamp = () => (
  <span className={styles.root} aria-hidden data-chrome="bl">
    {new Date().getFullYear()}
  </span>
)

export default YearStamp
