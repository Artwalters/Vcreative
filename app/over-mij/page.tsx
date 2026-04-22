import type { Metadata } from 'next'
import Footer from '@/app/components/Footer'
import { IconButton } from '@/app/components/IconButton'
import PageFX from '@/app/components/PageFX'
import styles from '@/app/over-mij/over-mij.module.css'

export const metadata: Metadata = {
  title: 'Over mij',
  description:
    'Vienna Wachelder — social media partner voor merken met karakter. Strategie, content en maandelijks beheer vanuit Heerlen.',
}

const SERVICES = [
  {
    name: 'Strategie',
    copy: 'Een helder verhaal als basis. We bepalen samen toon, ritme en doel zodat elke post bijdraagt aan jouw merk.',
  },
  {
    name: 'Content',
    copy: 'Foto, video en tekst die voelt als jouw bedrijf — niet als een sjabloon. Op locatie of in de studio.',
  },
  {
    name: 'Beheer',
    copy: 'Maandelijks contentbeheer, planning en monitoring. Jij focust op je vak, ik zorg dat je zichtbaar blijft.',
  },
]

const USPS = [
  'Eén vast aanspreekpunt — geen kantoor, geen tussenlagen.',
  'Wekelijkse afstemming en heldere planning, geen verrassingen achteraf.',
  'Sterk netwerk van fotografen, editors en strategen voor grotere producties.',
  'Meedenken op de lange termijn, niet alleen losse posts.',
]

const OverMij = () => (
  <PageFX>
  <div className={styles.page}>
    <header className={styles.hero}>
      <p className={styles.label}>
        <span className={styles.labelDot} aria-hidden="true" />
        Over mij
      </p>
      <h1
        className={styles.title}
        data-animation="webgl-text"
        data-webgl-text-mode="hero"
      >
        <em>I</em>k ben Vienna —
        <br />
        social media partner
        <br />
        voor merken met karakter
      </h1>
      <p className={styles.subtitle}>
        Sinds 2019 help ik ondernemers en merken hun verhaal vertalen naar
        content die werkt. Geen losse posts, maar een doorlopende stroom die
        past bij wie je bent en hoe je gezien wil worden.
      </p>
    </header>

    <div className={styles.portrait}>
      <figure className={styles.portraitFigure}>
        <img
          src="https://picsum.photos/seed/vienna-portrait/1920/823"
          alt="Vienna aan het werk"
          className={styles.portraitImage}
          loading="lazy"
        />
      </figure>
    </div>

    <section className={styles.story}>
      <h2 className={styles.storyTitle} data-animation="webgl-text">
        <em>M</em>ijn verhaal
      </h2>
      <div className={styles.storyBody}>
        <p>
          Ik ben opgegroeid met camera in de hand en altijd nieuwsgierig naar
          de mensen achter een merk. Wat begon als hobbymatig fotograferen
          voor lokale ondernemers groeide uit tot een eigen studio voor
          social media en contentstrategie.
        </p>
        <p>
          Mijn aanpak: kort op het merk, lange adem in de uitvoering. Ik
          werk met een vaste cyclus van strategie, productie en evaluatie,
          zodat content niet alleen mooi is, maar ook iets oplevert.
        </p>
        <p>
          Vanuit Heerlen bedien ik klanten door heel Nederland — van
          beautysalons tot horeca tot tattoo studio&rsquo;s. Wat ze gemeen
          hebben: ze willen hun verhaal serieus nemen.
        </p>
      </div>
    </section>

    <section className={styles.servicesSection}>
      <div className={styles.servicesInner}>
        <header className={styles.servicesHeader}>
          <h2 className={styles.servicesTitle} data-animation="webgl-text">
            <em>W</em>at ik doe
          </h2>
        </header>

        <div className={styles.servicesGrid}>
          {SERVICES.map((s, i) => (
            <article key={s.name} className={styles.serviceItem}>
              <p className={styles.serviceNumber}>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className={styles.serviceName}>{s.name}</h3>
              <p className={styles.serviceCopy}>{s.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className={styles.usps}>
      <h2 className={styles.uspsTitle} data-animation="webgl-text">
        <em>W</em>aarom samen?
      </h2>
      <ul className={styles.uspsList}>
        {USPS.map((u, i) => (
          <li key={i} className={styles.uspItem}>
            <span className={styles.uspNumber}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className={styles.uspText}>{u}</p>
          </li>
        ))}
      </ul>
    </section>

    <section className={styles.cta}>
      <h2 className={styles.ctaHeading} data-animation="webgl-text">
        <em>K</em>laar om jouw merk te laten zien?
      </h2>
      <IconButton href="/contact" ariaLabel="Naar contactpagina">
        Start jouw project
      </IconButton>
    </section>

    <Footer />
  </div>
  </PageFX>
)

export default OverMij
