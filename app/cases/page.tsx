import Link from 'next/link'
import Footer from '@/app/components/Footer'
import { CASES, type CaseSlug } from '@/app/cases/caseData'
import styles from '@/app/cases/cases-index.module.css'

const ORDER: CaseSlug[] = [
  'hair-by-kim',
  'falcon-ink',
  'hal-xiii',
  'beautysalon-glow',
]

const CasesIndex = () => (
  <div className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.label}>
        <span className={styles.labelDot} aria-hidden="true" />
        Cases
      </p>
      <h1 className={styles.title}>
        <em>W</em>erk dat ik trots
        <br />
        op deelt
      </h1>
      <p className={styles.subtitle}>
        Een selectie van merken die ik mocht helpen — van strategie tot
        wekelijkse contentstroom. Elke case laat zien hoe een eigen ritme
        het verschil maakt.
      </p>
    </header>

    <section className={styles.grid}>
      {ORDER.map((slug) => {
        const c = CASES[slug]
        return (
          <Link key={slug} href={`/cases/${slug}`} className={styles.card}>
            <figure className={styles.cardFigure}>
              <img
                src={`https://picsum.photos/seed/${c.heroImageSeed}/1200/900`}
                alt={`${c.name} — case`}
                className={styles.cardImage}
                loading="lazy"
              />
            </figure>
            <div className={styles.cardMeta}>
              <p className={styles.cardName}>{c.name}</p>
              <p className={styles.cardYear}>{c.year}</p>
            </div>
            <h2 className={styles.cardTitle}>
              <em>{c.heroTitle.script}</em>
              {c.heroTitle.rest.split('\n')[0]}
            </h2>
            <ul className={styles.cardTags}>
              {c.heroTags.slice(0, 3).map((tag) => (
                <li key={tag} className={styles.cardTag}>
                  {tag}
                </li>
              ))}
            </ul>
          </Link>
        )
      })}
    </section>

    <Footer />
  </div>
)

export default CasesIndex
