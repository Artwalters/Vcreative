import type { Metadata } from 'next'
import Footer from '@/app/components/Footer'
import PageFX from '@/app/components/PageFX'
import styles from '@/app/cases/cases-index.module.css'

export const metadata: Metadata = {
  title: 'Cases',
  description:
    'Werk dat ik trots op deelt. Een selectie van merken die ik mocht helpen met content en social media.',
}

/* Mirrors the home's "Creative projecten" block: one full-bleed card,
   a small/large row, and another full-bleed. Keeps the visual rhythm
   consistent between home and /cases rather than switching to a plain
   grid when you click through. */
const CasesIndex = () => (
  <PageFX>
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.label}>
          <span className={styles.labelDot} aria-hidden="true" />
          Cases
        </p>
        <h1
          className={styles.title}
          data-animation="webgl-text"
          data-webgl-text-mode="hero"
        >
          <em>W</em>erk dat ik trots
          <br />
          op deelt
        </h1>
        <p className={styles.subtitle}>
          Een selectie van merken die ik mocht helpen, van strategie tot
          wekelijkse contentstroom. Elke case laat zien hoe een eigen ritme
          het verschil maakt.
        </p>
      </header>

      <section className={styles.cases}>
        <article className={`${styles.projectItem} ${styles.projectFull}`}>
          <a
            href="/cases/hair-by-kim"
            className={styles.projectMediaLink}
            data-cursor-hover
            data-cursor-text="Bekijk case"
            aria-label="Bekijk case Hair by Kim"
          >
            <figure className={styles.projectFigure} data-parallax="trigger">
              <div className={styles.parallaxTarget} data-parallax="target">
                <img
                  data-webgl-media
                  data-webgl-effect="bend"
                  src="https://picsum.photos/seed/hair-by-kim/1400/700"
                  alt="Hair by Kim"
                  className={styles.projectImage}
                  loading="lazy"
                />
              </div>
            </figure>
          </a>
          <div className={styles.projectContent}>
            <h2 className={styles.projectTitle}>Hair by Kim</h2>
            <p className={styles.projectDescription}>
              Social media beheer voor Hair by Kim. Strategie, fotografie en
              contentcreatie die het merk laat groeien.
            </p>
            <a href="/cases/hair-by-kim" className={styles.projectLink}>
              Bekijk case
            </a>
          </div>
        </article>

        <div className={styles.projectenRow}>
          <article className={`${styles.projectItem} ${styles.projectSmall}`}>
            <a
              href="/cases/falcon-ink"
              className={styles.projectMediaLink}
              data-cursor-hover
              data-cursor-text="Bekijk case"
              aria-label="Bekijk case Falcon Ink"
            >
              <figure className={styles.projectFigure} data-parallax="trigger">
                <div className={styles.parallaxTarget} data-parallax="target">
                  <img
                    data-webgl-media
                    data-webgl-effect="bend"
                    src="https://picsum.photos/seed/falcon-ink/800/600"
                    alt="Falcon Ink"
                    className={styles.projectImage}
                    loading="lazy"
                  />
                </div>
              </figure>
            </a>
            <div className={styles.projectContent}>
              <h2 className={styles.projectTitle}>Falcon Ink</h2>
              <p className={styles.projectDescription}>
                Content creatie voor Falcon Ink. Van concept tot publicatie,
                altijd in de juiste sfeer.
              </p>
              <a href="/cases/falcon-ink" className={styles.projectLink}>
                Bekijk case
              </a>
            </div>
          </article>

          <article className={`${styles.projectItem} ${styles.projectLarge}`}>
            <a
              href="/cases/hal-xiii"
              className={styles.projectMediaLink}
              data-cursor-hover
              data-cursor-text="Bekijk case"
              aria-label="Bekijk case Hal XIII"
            >
              <figure className={styles.projectFigure} data-parallax="trigger">
                <div className={styles.parallaxTarget} data-parallax="target">
                  <img
                    data-webgl-media
                    data-webgl-effect="bend"
                    src="https://picsum.photos/seed/hal-xiii/1280/800"
                    alt="Hal XIII"
                    className={styles.projectImage}
                    loading="lazy"
                  />
                </div>
              </figure>
            </a>
            <div className={styles.projectContent}>
              <h2 className={styles.projectTitle}>Hal XIII</h2>
              <p className={styles.projectDescription}>
                Maandelijks beheer voor Hal XIII. Energie en kracht vertaald
                naar beeld en video.
              </p>
              <a href="/cases/hal-xiii" className={styles.projectLink}>
                Bekijk case
              </a>
            </div>
          </article>
        </div>

        <article className={`${styles.projectItem} ${styles.projectFull}`}>
          <a
            href="/cases/beautysalon-glow"
            className={styles.projectMediaLink}
            data-cursor-hover
            data-cursor-text="Bekijk case"
            aria-label="Bekijk case Beautysalon Glow"
          >
            <figure className={styles.projectFigure} data-parallax="trigger">
              <div className={styles.parallaxTarget} data-parallax="target">
                <img
                  data-webgl-media
                  data-webgl-effect="bend"
                  src="https://picsum.photos/seed/beautysalon-glow/1400/700"
                  alt="Beautysalon Glow"
                  className={styles.projectImage}
                  loading="lazy"
                />
              </div>
            </figure>
          </a>
          <div className={styles.projectContent}>
            <h2 className={styles.projectTitle}>Beautysalon Glow</h2>
            <p className={styles.projectDescription}>
              Eenmalige contentdag voor Beautysalon Glow. Een dag shooten,
              een maand aan content.
            </p>
            <a href="/cases/beautysalon-glow" className={styles.projectLink}>
              Bekijk case
            </a>
          </div>
        </article>
      </section>

      <Footer />
    </div>
  </PageFX>
)

export default CasesIndex
