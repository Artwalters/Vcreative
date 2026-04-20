'use client'

import {useEffect, useRef} from 'react'
import styles from '@/app/components/LogoMarquee.module.css'

/* For now, one logo duplicated. Later swap with folder contents. */
const MaeLogo = () => (
  <svg
    width="218"
    height="64"
    viewBox="0 0 218 64"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Mae"
  >
    <path d="M121.677 0.000488281C122.099 0.000488281 122.359 0.437382 122.13 0.775246L107.118 23.0685L91.6895 45.9791L79.7244 63.752V63.7636H58.2455C57.8235 63.7636 57.5629 63.3209 57.7925 62.9889L100.049 0.233498C100.148 0.087867 100.322 0.000488281 100.502 0.000488281H121.677Z" />
    <path d="M71.6546 0.000488281H92.8294C93.2514 0.000488281 93.512 0.443207 93.2824 0.775246L51.0198 63.5248C50.9205 63.6704 50.7467 63.7578 50.5668 63.7578H29.392C28.97 63.7578 28.7094 63.3151 28.939 62.983L71.2016 0.239323C71.3009 0.0936922 71.4747 0.00631353 71.6546 0.00631353V0.000488281Z" />
    <path d="M52.5569 0H63.9759C64.3979 0 64.6585 0.442719 64.4289 0.774758L22.1725 63.5301C22.0732 63.6758 21.8994 63.7631 21.7195 63.7631H0.538511C0.116506 63.7631 -0.144145 63.3204 0.0854758 62.9884L37.1289 7.98059C40.4739 3.01165 46.3013 0 52.5569 0Z" />
    <path d="M217.403 0.7855L206.121 17.5447C206.021 17.6904 205.848 17.7777 205.668 17.7777L138.333 17.8302C138.035 17.8302 137.793 17.603 137.793 17.3234V0.569966C137.793 0.290354 138.035 0.0631694 138.333 0.0631694L216.95 0.0107422C217.378 0.0107422 217.633 0.447636 217.409 0.7855H217.403Z" />
    <path d="M138.339 22.9316L201.491 23.0598C201.913 23.0598 202.174 23.5025 201.944 23.8345L190.662 40.5879C190.562 40.7336 190.389 40.8268 190.202 40.8209L138.333 40.6928C138.035 40.6928 137.793 40.4656 137.793 40.186V23.4326C137.793 23.153 138.035 22.9258 138.333 22.9258L138.339 22.9316Z" />
    <path d="M186.473 46.7918L180.682 55.3899C177.164 60.6151 171.032 63.784 164.448 63.784H138.333C138.035 63.784 137.793 63.5569 137.793 63.2773V46.518C137.793 46.2384 138.035 46.0112 138.333 46.0112H186.013C186.435 46.0112 186.696 46.4481 186.466 46.786L186.473 46.7918Z" />
    <path d="M131.931 63.7622H87.0995C86.6775 63.7622 86.4169 63.3253 86.6465 62.9875L97.9289 46.2282C98.0282 46.0826 98.202 45.9952 98.382 45.9952H112.991C113.289 45.9952 113.531 45.768 113.531 45.4884L113.512 23.2302C113.512 23.137 113.543 23.0379 113.593 22.9564L128.897 0.243752C128.996 0.0981209 129.17 0.0107422 129.35 0.0107422H131.888C132.186 0.0107422 132.428 0.237927 132.428 0.517538L132.459 45.9952L132.471 63.2612C132.471 63.5409 132.229 63.7680 131.931 63.7680V63.7622Z" />
  </svg>
)

const LOGOS = [MaeLogo]

const FILL_COUNT = 12

type Props = {
  direction?: 'left' | 'right'
  speed?: number
  scrollSpeed?: number
  duplicate?: number
}

const LogoMarquee = ({
  direction = 'left',
  speed = 90,
  scrollSpeed = 2,
  duplicate = 2,
}: Props) => {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ctx: ReturnType<typeof import('gsap')['default']['context']> | undefined
    let cancelled = false

    ;(async () => {
      const gsap = (await import('gsap')).default
      const {ScrollTrigger} = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)
      if (cancelled) return

      const marquee = marqueeRef.current
      if (!marquee) return

      ctx = gsap.context(() => {
        const marqueeContent = marquee.querySelector<HTMLDivElement>(
          '[data-marquee-collection-target]',
        )
        const marqueeScroll = marquee.querySelector<HTMLDivElement>(
          '[data-marquee-scroll-target]',
        )
        if (!marqueeContent || !marqueeScroll) return

        const marqueeDirectionAttr = direction === 'right' ? 1 : -1
        const speedMultiplier =
          window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1

        const marqueeSpeed =
          speed * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier

        marqueeScroll.style.marginLeft = `${scrollSpeed * -1}%`
        marqueeScroll.style.width = `${scrollSpeed * 2 + 100}%`

        if (duplicate > 0) {
          const fragment = document.createDocumentFragment()
          for (let i = 0; i < duplicate; i++) {
            fragment.appendChild(marqueeContent.cloneNode(true))
          }
          marqueeScroll.appendChild(fragment)
        }

        const marqueeItems = marquee.querySelectorAll(
          '[data-marquee-collection-target]',
        )
        const animation = gsap
          .to(marqueeItems, {
            xPercent: -100,
            repeat: -1,
            duration: marqueeSpeed,
            ease: 'linear',
          })
          .totalProgress(0.5)

        gsap.set(marqueeItems, {xPercent: marqueeDirectionAttr === 1 ? 100 : -100})
        animation.timeScale(marqueeDirectionAttr)
        animation.play()

        marquee.setAttribute('data-marquee-status', 'normal')

        ScrollTrigger.create({
          trigger: marquee,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const isInverted = self.direction === 1
            const currentDirection = isInverted
              ? -marqueeDirectionAttr
              : marqueeDirectionAttr
            animation.timeScale(currentDirection)
            marquee.setAttribute(
              'data-marquee-status',
              isInverted ? 'normal' : 'inverted',
            )
          },
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: marquee,
            start: '0% 100%',
            end: '100% 0%',
            scrub: 1.5,
          },
        })

        const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeed : -scrollSpeed
        const scrollEnd = -scrollStart

        tl.fromTo(
          marqueeScroll,
          {x: `${scrollStart}vw`},
          {x: `${scrollEnd}vw`, ease: 'none'},
        )
      }, marqueeRef)
    })()

    return () => {
      cancelled = true
      if (ctx) ctx.revert()
    }
  }, [direction, speed, scrollSpeed, duplicate])

  return (
    <section className={styles.section}>
      <div
        ref={marqueeRef}
        className={styles.marquee}
        data-marquee-direction={direction}
        data-marquee-status="normal"
      >
        <div data-marquee-scroll-target className={styles.scroll}>
          <div data-marquee-collection-target className={styles.collection}>
            {Array.from({length: FILL_COUNT}).map((_, i) => {
              const Logo = LOGOS[i % LOGOS.length]
              return (
                <div key={i} className={styles.item}>
                  <Logo />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default LogoMarquee
