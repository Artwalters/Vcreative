'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from '@/app/styles/text-demo.module.css'
import Footer from '@/app/components/Footer'
import LogoMarquee from '@/app/components/LogoMarquee'
import GlassEffect from '@/app/components/GlassEffect'
import { useWebGLEffects, useGlobalParallax } from '@/app/lib/useWebGLEffects'

const REVIEWS = [
  {
    logo: 'https://placehold.co/240x80/faf8f2/332f29/png?text=hair+by+kim&font=playfair',
    quote:
      'Wat Viënna voor ons heeft neergezet is zoveel meer dan foto\u2019s en reels. Ze heeft ons merk echt op de kaart gezet. Onze salon voelt nu ook online als onze salon.',
    author: 'Kim van Dijk',
    role: 'Eigenaar Hair by Kim',
    caseHref: '/cases/hair-by-kim',
  },
  {
    logo: 'https://placehold.co/240x80/faf8f2/332f29/png?text=falcon+ink&font=playfair',
    quote:
      'Één contentdag met Viënna leverde meer op dan maandenlang losse posts. De sfeer, de ruwheid, de energie, alles klopt met wie we zijn als studio.',
    author: 'Mark Jansen',
    role: 'Founder Falcon Ink',
    caseHref: '/cases/falcon-ink',
  },
  {
    logo: 'https://placehold.co/240x80/faf8f2/332f29/png?text=hal+xiii&font=playfair',
    quote:
      'Viënna begrijpt wat een merk nodig heeft om écht zichtbaar te worden. Geen standaard content, maar beeld dat kracht uitstraalt en ons publiek raakt.',
    author: 'Daan Vermeer',
    role: 'Owner Hal XIII',
    caseHref: '/cases/hal-xiii',
  },
] as const

const WERKWIJZE_STEPS = [
  {
    title: 'Je neemt contact op, ik leer jouw merk kennen.',
    description:
      'We gaan in gesprek, telefonisch, via video of bij je op locatie. Ik wil jouw merk, doelgroep en ambities echt begrijpen voordat we beginnen.',
  },
  {
    title: 'Jij beoordeelt de offerte op mijn plan van aanpak.',
    description:
      'Je ontvangt binnen een week een heldere offerte met concrete deliverables, tijdlijn en investering. Geen verrassingen onderweg.',
  },
  {
    title: 'Zijn we een match? We gaan aan de slag!',
    description:
      'Zodra we beide tekenen plannen we de eerste contentdag in. Ik zorg voor de voorbereiding, jij hoeft alleen zelf op te komen dagen.',
  },
  {
    title: 'Ik vertaal jouw merk in content die bij je past.',
    description:
      'Van conceptuele creatie tot strategische timing. Ik maak content die jouw merk versterkt en jouw publiek raakt.',
  },
  {
    title: 'We brengen het live en blijven evalueren.',
    description:
      'Na publicatie kijken we regelmatig terug: wat werkt, wat kan beter, waar groeien we door? Zo blijft jouw content scherp.',
  },
] as const

const TextDemo = () => {
  const [webglEnabled, setWebglEnabled] = useState(true)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [displayedReviewIndex, setDisplayedReviewIndex] = useState(0)
  const reviewQuoteRef = useRef<HTMLQuoteElement | null>(null)
  const reviewInitialRef = useRef(true)
  const reviewPendingReplayRef = useRef(false)

  const toggleStep = (i: number) => {
    setActiveStep((cur) => (cur === i ? null : i))
  }

  const prevReview = () => setReviewIndex((i) => (i - 1 + REVIEWS.length) % REVIEWS.length)
  const nextReview = () => setReviewIndex((i) => (i + 1) % REVIEWS.length)
  const currentReview = REVIEWS[displayedReviewIndex]

  /* ── Review carousel: cover → swap text → reveal via WebGL mask ──
     reviewIndex is what the user picked; displayedReviewIndex is what's
     actually rendered. We delay the swap so the mask can cover first.
     If the user flips back to the current displayed index while a cover
     is in flight, we still need to uncover — hence the pending ref. */
  useEffect(() => {
    const el = reviewQuoteRef.current
    if (reviewIndex === displayedReviewIndex) {
      if (reviewPendingReplayRef.current && el) {
        reviewPendingReplayRef.current = false
        el.dispatchEvent(new CustomEvent('webgl-text-remeasured'))
      }
      return
    }
    if (!el) {
      setDisplayedReviewIndex(reviewIndex)
      return
    }
    el.dispatchEvent(new CustomEvent('webgl-text-replay'))
    reviewPendingReplayRef.current = true
    const t = setTimeout(() => setDisplayedReviewIndex(reviewIndex), 450)
    return () => clearTimeout(t)
  }, [reviewIndex, displayedReviewIndex])

  useLayoutEffect(() => {
    if (reviewInitialRef.current) {
      reviewInitialRef.current = false
      return
    }
    reviewPendingReplayRef.current = false
    const el = reviewQuoteRef.current
    if (!el) return
    el.dispatchEvent(new CustomEvent('webgl-text-remeasured'))
  }, [displayedReviewIndex])

  /* ── Studio scale-in scroll animation ── */
  useEffect(() => {
    let ctx: ReturnType<typeof import('gsap')['default']['context']> | undefined
    let cancelled = false

    ;(async () => {
      const gsap = (await import('gsap')).default
      const {ScrollTrigger} = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      if (cancelled) return

      ctx = gsap.context(() => {
        const hero = document.querySelector(`.${styles.studioHero}`) as HTMLElement | null
        const card = document.querySelector(`.${styles.studioCard}`) as HTMLElement | null
        const bg = document.querySelector(`.${styles.studioBg}`) as HTMLElement | null
        const bgInner = bg?.querySelector(`.${styles.parallaxTarget}`) as HTMLElement | null
        if (!hero || !card || !bg) return

        gsap.set(card, {scale: 0.35, transformOrigin: 'center center'})
        gsap.set(bg, {opacity: 1})

        /* Pin only — keeps the hero fixed through the scale animation */
        ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: '+=130%',
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        })

        /* Scale + fade timeline spans from viewport entry (top bottom)
           through the end of the pin (+=230% = 100vh entry + 130% pin).
           Split in two phases so the card fully settles before unpin:
           - Entry (0 → 0.435 of timeline): linear warmup 0.35 → 0.5
           - Pin growth (0.435 → 0.785): power2.out settle to 1.0
           - Hold (0.785 → 1.0): stays at 1.0 until the pin releases. */
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top bottom',
            end: '+=230%',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })
        tl.fromTo(card, {scale: 0.35}, {scale: 0.5, ease: 'none', duration: 0.435}, 0)
        tl.to(card, {scale: 1, ease: 'power2.out', duration: 0.35}, 0.435)
        tl.to(bg, {opacity: 0, ease: 'power2.out', duration: 0.2}, 0.5)

        /* Parallax drift on the studio bg — matches the scale timeline */
        if (bgInner) {
          gsap.fromTo(
            bgInner,
            {yPercent: -15},
            {
              yPercent: 15,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top bottom',
                end: '+=230%',
                scrub: true,
              },
            },
          )
        }
      })
    })()

    return () => {
      cancelled = true
      if (ctx) ctx.revert()
    }
  }, [])

  useGlobalParallax()
  useWebGLEffects(webglEnabled)


  return (
    <div className={styles.page}>
      <button
        className={styles.toggle}
        onClick={() => setWebglEnabled((v) => !v)}
      >
        <span className={`${styles.toggleDot} ${!webglEnabled ? styles.toggleDotOff : ''}`} />
        {webglEnabled ? 'WebGL on' : 'WebGL off'}
      </button>
      <section className={styles.hero}>
        <h1
          data-animation="webgl-text"
          data-webgl-text-mode="hero"
          className={styles.heroText}
        >
          <em>J</em>ij runt je bedrijf
          <br />
          ik regel je socials
        </h1>
        <p className={styles.heroSubtitle}>
          <span className={styles.heroSubtitleMain}>Content en strategie</span>
          <span className={styles.heroSubtitleScript}>
            by <span className={styles.heroSubtitleV}>V</span>ienna
          </span>
        </p>
      </section>
      <figure className={styles.heroFigure} data-parallax="trigger">
        <div className={styles.parallaxTarget} data-parallax="target">
          <img
            src="https://picsum.photos/seed/vienna-hero/1920/823"
            alt="V-Creative hero"
            className={styles.heroImage}
          />
        </div>
      </figure>

      <LogoMarquee />
      <section className={styles.imageGrid}>
        <section className={styles.projectenSection}>
          <header className={styles.projectenHeader}>
            <h2 className={styles.projectenTitle} data-animation="webgl-text">
              <span className={styles.projectenTitleLine}>
                <em>Z</em>akelijke projecten
              </span>
              <span className={styles.projectenYears}>2008 / 2026</span>
            </h2>
            <ul className={styles.projectenCategories}>
              <li className={styles.projectenCategory}>Beauty</li>
              <li className={styles.projectenCategory}>Lifestyle</li>
              <li className={styles.projectenCategory}>Horeca</li>
              <li className={styles.projectenCategory}>Retail</li>
              <li className={styles.projectenCategory}>Wellness</li>
            </ul>
          </header>

          <article className={`${styles.projectItem} ${styles.projectFull}`}>
            <figure className={styles.projectFigure} data-parallax="trigger">
              <div className={styles.parallaxTarget} data-parallax="target">
                <img
                  data-webgl-media
                  data-webgl-effect="bend"
                  src="https://picsum.photos/seed/hair-by-kim/1400/700"
                  alt="Hair by Kim"
                  className={styles.projectImage}
                />
              </div>
            </figure>
            <div className={styles.projectContent}>
              <h3 className={styles.projectTitle}>Hair by Kim</h3>
              <p className={styles.projectDescription}>
                Social media beheer voor Hair by Kim. Strategie, fotografie en contentcreatie die het merk laat groeien.
              </p>
              <a href="/cases/hair-by-kim" className={styles.projectLink}>Bekijk case</a>
            </div>
          </article>

          <div className={styles.projectenRow}>
            <article className={`${styles.projectItem} ${styles.projectSmall}`}>
              <figure className={styles.projectFigure} data-parallax="trigger">
                <div className={styles.parallaxTarget} data-parallax="target">
                  <img
                    data-webgl-media
                    data-webgl-effect="bend"
                    src="https://picsum.photos/seed/falcon-ink/800/600"
                    alt="Falcon Ink"
                    className={styles.projectImage}
                  />
                </div>
              </figure>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Falcon Ink</h3>
                <p className={styles.projectDescription}>
                  Content creatie voor Falcon Ink. Van concept tot publicatie, altijd in de juiste sfeer.
                </p>
                <a href="/cases/falcon-ink" className={styles.projectLink}>Bekijk case</a>
              </div>
            </article>

            <article className={`${styles.projectItem} ${styles.projectLarge}`}>
              <figure className={styles.projectFigure} data-parallax="trigger">
                <div className={styles.parallaxTarget} data-parallax="target">
                  <img
                    data-webgl-media
                    data-webgl-effect="bend"
                    src="https://picsum.photos/seed/hal-xiii/1280/800"
                    alt="Hal XIII"
                    className={styles.projectImage}
                  />
                </div>
              </figure>
              <div className={styles.projectContent}>
                <h3 className={styles.projectTitle}>Hal XIII</h3>
                <p className={styles.projectDescription}>
                  Maandelijks beheer voor Hal XIII. Energie en kracht vertaald naar beeld en video.
                </p>
                <a href="/cases/hal-xiii" className={styles.projectLink}>Bekijk case</a>
              </div>
            </article>
          </div>

          <article className={`${styles.projectItem} ${styles.projectFull}`}>
            <figure className={styles.projectFigure} data-parallax="trigger">
              <div className={styles.parallaxTarget} data-parallax="target">
                <img
                  data-webgl-media
                  data-webgl-effect="bend"
                  src="https://picsum.photos/seed/beautysalon-glow/1400/700"
                  alt="Beautysalon Glow"
                  className={styles.projectImage}
                />
              </div>
            </figure>
            <div className={styles.projectContent}>
              <h3 className={styles.projectTitle}>Beautysalon Glow</h3>
              <p className={styles.projectDescription}>
                Eenmalige contentdag voor Beautysalon Glow. Een dag shooten, een maand aan content.
              </p>
              <a href="/cases/beautysalon-glow" className={styles.projectLink}>Bekijk case</a>
            </div>
          </article>

          <a href="/contact" className={styles.projectenCta}>
            <GlassEffect />
            <span className="glass-effect__content">Zet mij aan het werk met jouw merk</span>
          </a>
        </section>
      </section>

      <section className={styles.studioSection}>
        <div className={styles.studioHero}>
          <div className={styles.studioBg}>
            <div className={styles.parallaxTarget}>
              <img src="https://picsum.photos/seed/studio-bg/1920/1080" alt="" className={styles.studioBgImage} />
            </div>
          </div>
          <div className={styles.studioCard}>
            <p className={styles.studioLabel}>Over V-Creative</p>
            <span className={styles.studioLogo} aria-hidden="true" />
            <div className={styles.studioBottomGroup}>
              <h2 className={styles.studioTagline}>
                <em>M</em>ijn missie is om jouw merk écht zichtbaar te maken.
              </h2>
              <p className={styles.studioScroll}>Blijf scrollen</p>
            </div>
          </div>
        </div>
        <div className={styles.studioContent}>
          <div className={styles.studioContentInner}>
            <blockquote className={styles.studioQuote}>
              &ldquo;Mijn studio richt zich op het creëren van content die jouw merk écht zichtbaar maakt en de verbinding met je doelgroep versterkt.&rdquo;
            </blockquote>
            <p className={styles.studioBody}>
              Jouw content draagt jouw merk, jouw verhaal, jouw karakter. Precies hoe je wilt dat mensen je zien en voelen. Een strategie met als resultaat beeld en video waar je trots op bent, en waarmee je met vertrouwen en energie je merk naar buiten brengt.
            </p>
            <blockquote className={styles.studioQuote}>
              &ldquo;Content is meer dan een mooie foto. Het bepaalt hoe jouw merk ervaren, herinnerd en vertrouwd wordt.&rdquo;
            </blockquote>
            <p className={styles.studioBody}>
              Concept, fotografie, video, editing. Iedere stap vraagt om aandacht. Kleur, licht, compositie en timing bepalen samen hoe jouw merk online voelt. Alles wordt doordacht en op de juiste manier ingezet, zodat elk beeld een verlengstuk is van wie jij bent.
            </p>
            <p className={styles.studioBody}>
              Ieder project krijgt een eigen aanpak, zowel in strategie als in uitvoering. Ik werk vanuit een hecht netwerk aan creatieve partners en kan je adviseren over welke aanpak bij jouw merk past. Jij houdt de regie, ik zorg dat alles op het juiste moment klopt, van eerste idee tot laatste post.
            </p>
            <a href="/over-mij" className={styles.studioCta}>
              <GlassEffect />
              <span className="glass-effect__content">Het gezicht achter de studio</span>
            </a>
          </div>
        </div>
      </section>

      <section className={styles.werkwijzeSection}>
        <p className={styles.werkwijzeLabel}>Werkwijze</p>
        <h2 className={styles.werkwijzeTitle} data-animation="webgl-text">
          <em>I</em>n{' '}
          <span className={styles.werkwijzeCount}>
            ({String(WERKWIJZE_STEPS.length).padStart(2, '0')})
          </span>{' '}
          stappen van jouw merk naar content die raakt.
        </h2>

        <ul className={styles.werkwijzeList}>
          {WERKWIJZE_STEPS.map((step, i) => {
            const isActive = activeStep === i
            return (
              <li
                key={i}
                className={styles.werkwijzeItem}
                data-accordion-status={isActive ? 'active' : 'not-active'}
              >
                <button
                  type="button"
                  className={styles.werkwijzeTop}
                  onClick={() => toggleStep(i)}
                  aria-expanded={isActive}
                >
                  <span className={styles.werkwijzeNumber}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className={styles.werkwijzeH3}>{step.title}</h3>
                  <span className={styles.werkwijzeIcon} aria-hidden="true">
                    <span className={styles.werkwijzeIconH} />
                    <span className={styles.werkwijzeIconV} />
                  </span>
                </button>
                <div className={styles.werkwijzeBottom}>
                  <div className={styles.werkwijzeBottomWrap}>
                    <div className={styles.werkwijzeBottomContent}>
                      <p className={styles.werkwijzeP}>{step.description}</p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className={styles.werkwijzeCta}>
          <figure className={styles.werkwijzeCtaFigure} data-parallax="trigger">
            <div className={styles.parallaxTarget} data-parallax="target">
              <img
                data-webgl-media
                data-webgl-effect="bend"
                src="https://picsum.photos/seed/vienna-portrait/900/900"
                alt="Viënna"
                className={styles.werkwijzeCtaImage}
              />
            </div>
          </figure>
          <p className={styles.werkwijzeCtaText}>
            <em>Z</em>et mij aan het werk met jouw unieke merk.
          </p>
          <a href="/contact" className={styles.werkwijzeCtaButton}>
            <GlassEffect />
            <span className="glass-effect__content">Start jouw project</span>
          </a>
        </div>
      </section>

      <section className={styles.reviewsSection} aria-roledescription="carousel">
        <div className={styles.reviewCard}>
          <img
            src={currentReview.logo}
            alt=""
            aria-hidden="true"
            className={styles.reviewLogo}
          />
          <blockquote
            ref={reviewQuoteRef}
            className={styles.reviewQuote}
            data-animation="webgl-text"
            data-webgl-text-mode="time-trigger"
          >
            &ldquo;{currentReview.quote}&rdquo;
          </blockquote>
          <p className={styles.reviewAuthor}>
            <span className={styles.reviewAuthorDot} aria-hidden="true" />
            {currentReview.author}
          </p>
          <p className={styles.reviewRole}>{currentReview.role}</p>
          <div className={styles.reviewStarsRow}>
            <button
              type="button"
              className={styles.reviewsArrow}
              onClick={prevReview}
              aria-label="Vorige review"
            >
              <GlassEffect />
              <span aria-hidden="true" className="glass-effect__content">←</span>
            </button>
            <div className={styles.reviewStars} aria-label="5 sterren">
              {'★★★★★'}
            </div>
            <button
              type="button"
              className={styles.reviewsArrow}
              onClick={nextReview}
              aria-label="Volgende review"
            >
              <GlassEffect />
              <span aria-hidden="true" className="glass-effect__content">→</span>
            </button>
          </div>
          <a href={currentReview.caseHref} className={styles.reviewLink}>Bekijk case</a>
        </div>
      </section>

      <Footer />

      <div className="progressive-blur">
        <div className="progressive-blur__layer is--1" />
        <div className="progressive-blur__layer is--2" />
        <div className="progressive-blur__layer is--3" />
        <div className="progressive-blur__layer is--4" />
        <div className="progressive-blur__layer is--5" />
      </div>
    </div>
  )
}

export default TextDemo
