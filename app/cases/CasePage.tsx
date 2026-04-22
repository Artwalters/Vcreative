'use client'

import { Fragment } from 'react'
import Footer from '@/app/components/Footer'
import { useWebGLEffects, useGlobalParallax } from '@/app/lib/useWebGLEffects'
import { CASES, type CaseSlug, type CaseTitle } from './caseData'
import styles from './case.module.css'

/* Render <em>script</em>first line<br />…rest, matching the homepage
   hero-text pattern. Works inside any heading that has the webgl-text mask. */
const renderTitle = (t: CaseTitle) => {
  const lines = t.rest.split('\n')
  const [first, ...rest] = lines
  return (
    <>
      <em>{t.script}</em>
      {first}
      {rest.map((line, i) => (
        <Fragment key={i}>
          <br />
          {line}
        </Fragment>
      ))}
    </>
  )
}

const CasePage = ({ slug }: { slug: CaseSlug }) => {
  const data = CASES[slug]
  const next = CASES[data.nextSlug]

  useGlobalParallax()
  useWebGLEffects()

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroMeta}>
          <span className={styles.heroMetaDot} aria-hidden="true" />
          Case · {data.year}
        </p>
        <h1
          data-animation="webgl-text"
          data-webgl-text-mode="hero"
          className={styles.heroTitle}
        >
          {renderTitle(data.heroTitle)}
        </h1>
        <ul className={styles.heroTags}>
          {data.heroTags.map((tag) => (
            <li key={tag} className={styles.heroTag}>
              {tag}
            </li>
          ))}
        </ul>
      </section>

      <figure className={styles.heroFigure} data-parallax="trigger">
        <div className={styles.parallaxTarget} data-parallax="target">
          <img
            src={`https://picsum.photos/seed/${data.heroImageSeed}/1920/823`}
            alt={`${data.name} — hero`}
            className={styles.heroImage}
          />
        </div>
      </figure>

      <div className={styles.sections}>
        {/* Section 01 — text left, portrait image right */}
        <section className={`${styles.section} ${styles.sectionA}`}>
          <div className={styles.sectionText}>
            <p className={styles.sectionLabel}>
              <span className={styles.sectionLabelNumber}>01</span>
              {data.sections[0].label}
            </p>
            <h2 data-animation="webgl-text" className={styles.sectionTitle}>
              {renderTitle(data.sections[0].title)}
            </h2>
            {data.sections[0].body.map((p, i) => (
              <p key={i} className={styles.sectionBody}>{p}</p>
            ))}
          </div>
          <figure className={styles.sectionFigure} data-parallax="trigger">
            <div className={styles.parallaxTarget} data-parallax="target">
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src={`https://picsum.photos/seed/${data.sections[0].imageSeed}/900/1125`}
                alt={`${data.name} — ${data.sections[0].label}`}
                className={styles.sectionImage}
                loading="lazy"
              />
            </div>
          </figure>
        </section>

        {/* Section 02 — landscape image left, text right */}
        <section className={`${styles.section} ${styles.sectionB}`}>
          <figure className={styles.sectionFigure} data-parallax="trigger">
            <div className={styles.parallaxTarget} data-parallax="target">
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src={`https://picsum.photos/seed/${data.sections[1].imageSeed}/1200/900`}
                alt={`${data.name} — ${data.sections[1].label}`}
                className={styles.sectionImage}
                loading="lazy"
              />
            </div>
          </figure>
          <div className={styles.sectionText}>
            <p className={styles.sectionLabel}>
              <span className={styles.sectionLabelNumber}>02</span>
              {data.sections[1].label}
            </p>
            <h2 data-animation="webgl-text" className={styles.sectionTitle}>
              {renderTitle(data.sections[1].title)}
            </h2>
            {data.sections[1].body.map((p, i) => (
              <p key={i} className={styles.sectionBody}>{p}</p>
            ))}
          </div>
        </section>

        {/* Section 03 — full-width image + 2-col caption below */}
        <section className={`${styles.section} ${styles.sectionC}`}>
          <figure className={styles.sectionFigure} data-parallax="trigger">
            <div className={styles.parallaxTarget} data-parallax="target">
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src={`https://picsum.photos/seed/${data.sections[2].imageSeed}/1920/840`}
                alt={`${data.name} — ${data.sections[2].label}`}
                className={styles.sectionImage}
                loading="lazy"
              />
            </div>
          </figure>
          <div className={styles.sectionCText}>
            <div className={styles.sectionCTextLead}>
              <p className={styles.sectionLabel}>
                <span className={styles.sectionLabelNumber}>03</span>
                {data.sections[2].label}
              </p>
              <h2 data-animation="webgl-text" className={styles.sectionTitle}>
                {renderTitle(data.sections[2].title)}
              </h2>
            </div>
            <div className={styles.sectionCTextBody}>
              {data.sections[2].body.map((p, i) => (
                <p key={i} className={styles.sectionBody}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className={styles.quoteSection}>
        <div className={styles.quoteCard}>
          <img
            src={`https://placehold.co/240x80/faf8f2/332f29/png?text=${data.quote.logoText}&font=playfair`}
            alt=""
            aria-hidden="true"
            className={styles.quoteLogo}
            loading="lazy"
          />
          <blockquote
            data-animation="webgl-text"
            data-webgl-text-mode="time-trigger"
            className={styles.quoteText}
          >
            &ldquo;{data.quote.text}&rdquo;
          </blockquote>
          <p className={styles.quoteAuthor}>
            <span className={styles.quoteAuthorDot} aria-hidden="true" />
            {data.quote.author}
          </p>
          <p className={styles.quoteRole}>{data.quote.role}</p>
        </div>
      </section>

      <figure className={styles.fullBleed} data-parallax="trigger">
        <div className={styles.parallaxTarget} data-parallax="target">
          <img
            src={`https://picsum.photos/seed/${data.fullBleedSeed}/1920/1080`}
            alt={`${data.name} — full bleed`}
            className={styles.fullBleedImage}
            loading="lazy"
          />
        </div>
      </figure>

      <section className={styles.nextCase}>
        <p className={styles.nextCaseLabel}>
          <span className={styles.nextCaseLabelDot} aria-hidden="true" />
          Volgende case
        </p>
        <h2
          data-animation="webgl-text"
          data-webgl-text-bg="#332f29"
          className={styles.nextCaseTitle}
        >
          <em>{next.name.charAt(0)}</em>{next.name.slice(1)}
        </h2>
        <a href={`/cases/${next.slug}`} className={styles.nextCaseLink}>
          <figure className={styles.nextCaseFigure} data-parallax="trigger">
            <div className={styles.parallaxTarget} data-parallax="target">
              <img
                src={`https://picsum.photos/seed/${next.heroImageSeed}/1600/900`}
                alt={next.name}
                className={styles.nextCaseImage}
                loading="lazy"
              />
            </div>
          </figure>
          <p className={styles.nextCaseName}>
            Bekijk case
            <span className={styles.nextCaseArrow} aria-hidden="true">→</span>
          </p>
        </a>
      </section>

      <Footer />
    </div>
  )
}

export default CasePage
