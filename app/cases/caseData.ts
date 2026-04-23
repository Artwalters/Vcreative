/* All case content lives here. The shared `CasePage` component renders
   whatever's in CASES[slug], and each slug has its own thin page.tsx
   that hands the slug to CasePage. Add a case → add an entry here and a
   folder with a one-line page.tsx. */

export type CaseSlug =
  | 'hair-by-kim'
  | 'falcon-ink'
  | 'hal-xiii'
  | 'beautysalon-glow'

/* Titles split into a script lead-in letter and the rest of the title.
   The rest may contain \n which the renderer turns into <br />. */
export type CaseTitle = { script: string; rest: string }

export type CaseSection = {
  label: string
  title: CaseTitle
  body: string[]
  imageSeed: string
}

export type CaseData = {
  slug: CaseSlug
  year: string
  name: string
  heroTitle: CaseTitle
  heroTags: string[]
  heroImageSeed: string
  sections: [CaseSection, CaseSection, CaseSection]
  quote: {
    logoText: string
    text: string
    author: string
    role: string
  }
  fullBleedSeed: string
  nextSlug: CaseSlug
}

export const CASES: Record<CaseSlug, CaseData> = {
  'hair-by-kim': {
    slug: 'hair-by-kim',
    year: '2026',
    name: 'Hair by Kim',
    heroTitle: {
      script: 'S',
      rest: 'ocial media beheer\nvoor Hair by Kim',
    },
    heroTags: ['Strategie', 'Contentcreatie', 'Fotografie', 'Maandelijks beheer'],
    heroImageSeed: 'hair-by-kim-hero',
    sections: [
      {
        label: 'Het startpunt',
        title: {
          script: 'E',
          rest: 'en salon met karakter,\nmaar online onzichtbaar.',
        },
        body: [
          "Kim had een volle agenda en loyale klanten, maar haar socials liepen achter. Losse foto's, geen ritme, geen rode draad. De sfeer van de salon kwam niet door het scherm heen, waardoor nieuwe klanten lastig te bereiken waren.",
          'We begonnen met een korte merkanalyse op locatie. Wie is Hair by Kim, voor wie is het, en welk gevoel moet elke post oproepen? Die antwoorden werden het fundament van de contentstrategie.',
        ],
        imageSeed: 'hair-by-kim-01',
      },
      {
        label: 'De contentdag',
        title: {
          script: 'É',
          rest: 'én dag shooten,\neen kwartaal aan content.',
        },
        body: [
          'Op één zorgvuldig uitgewerkte contentdag legden we de hele salon vast: behandelingen, details, sfeerbeelden en portretten van Kim zelf. Warm licht, rustige composities en veel ruimte voor stilte in het beeld.',
          'Het resultaat: een voorraad beeld waar we maandenlang mee vooruit konden, zonder dat het ooit als herhaling voelde. Elke post past in het grotere verhaal.',
        ],
        imageSeed: 'hair-by-kim-02',
      },
      {
        label: 'Het resultaat',
        title: {
          script: 'D',
          rest: 'e salon voelt online\nnu ook als de salon.',
        },
        body: [
          'Binnen drie maanden groeide de Instagram van Hair by Kim met bijna veertig procent, maar belangrijker: de nieuwe klanten die binnenkwamen gaven aan dat ze "precies de sfeer van de posts" zochten. Online en offline klopten met elkaar.',
          'Inmiddels verzorg ik het maandelijkse beheer, met vaste contentmomenten, een beeldbank die blijft doorgroeien en een kalender die past bij het ritme van de salon.',
        ],
        imageSeed: 'hair-by-kim-03',
      },
    ],
    quote: {
      logoText: 'hair+by+kim',
      text:
        "Wat Viënna voor ons heeft neergezet is zoveel meer dan foto's en reels. Ze heeft ons merk echt op de kaart gezet. Onze salon voelt nu ook online als onze salon.",
      author: 'Kim van Dijk',
      role: 'Eigenaar Hair by Kim',
    },
    fullBleedSeed: 'hair-by-kim-full',
    nextSlug: 'falcon-ink',
  },

  'falcon-ink': {
    slug: 'falcon-ink',
    year: '2026',
    name: 'Falcon Ink',
    heroTitle: {
      script: 'C',
      rest: 'ontent creatie\nvoor Falcon Ink',
    },
    heroTags: ['Contentdag', 'Fotografie', 'Reels', 'Creative direction'],
    heroImageSeed: 'falcon-ink-hero',
    sections: [
      {
        label: 'Het startpunt',
        title: {
          script: 'E',
          rest: 'en studio met een\nduidelijk handschrift.',
        },
        body: [
          "Falcon Ink is geen standaard tattooshop — het is een plek waar klanten komen voor werk dat ergens over gaat. Op social was dat gevoel nog niet terug te zien: losse foto's van tattoos zonder context, zonder sfeer, zonder verhaal.",
          'We begonnen met een middag in de studio, gewoon om te praten over wat Falcon Ink bijzonder maakt. Niet de tattoos zelf, maar de aanloop ernaartoe: de gesprekken, de rituelen, de rust vlak voor de naald.',
        ],
        imageSeed: 'falcon-ink-01',
      },
      {
        label: 'De contentdag',
        title: {
          script: 'É',
          rest: 'én dag in de studio,\nalle zintuigen open.',
        },
        body: [
          "Geen geposeerde shots. We filmden en fotografeerden een volledige werkdag — van de eerste koffie tot het laatste afscheid. Close-ups van inkt, handen, gezichten die veranderen tijdens een sessie. Geluid, ruwheid, focus.",
          'Alles in één sfeer, één kleurruimte, één toon. Zodat elke post herkenbaar Falcon Ink is, ook als er niet direct een tattoo in beeld komt.',
        ],
        imageSeed: 'falcon-ink-02',
      },
      {
        label: 'Het resultaat',
        title: {
          script: 'C',
          rest: 'ontent die even hard\nbinnenkomt als het werk.',
        },
        body: [
          'De eerste reel haalde in een week meer views dan alle posts van het halfjaar daarvoor samen. Belangrijker: nieuwe klanten noemden uit zichzelf "de sfeer van de video\'s" als reden dat ze voor Falcon Ink kozen.',
          'Het handschrift van de studio kwam eindelijk ook online binnen — en bleef daar consistent.',
        ],
        imageSeed: 'falcon-ink-03',
      },
    ],
    quote: {
      logoText: 'falcon+ink',
      text:
        'Één contentdag met Viënna leverde meer op dan maandenlang losse posts. De sfeer, de ruwheid, de energie — alles klopt met wie we zijn als studio.',
      author: 'Mark Jansen',
      role: 'Founder Falcon Ink',
    },
    fullBleedSeed: 'falcon-ink-full',
    nextSlug: 'hal-xiii',
  },

  'hal-xiii': {
    slug: 'hal-xiii',
    year: '2026',
    name: 'Hal XIII',
    heroTitle: {
      script: 'M',
      rest: 'aandelijks beheer\nvoor Hal XIII',
    },
    heroTags: ['Strategie', 'Maandelijks beheer', 'Fotografie', 'Video'],
    heroImageSeed: 'hal-xiii-hero',
    sections: [
      {
        label: 'Het startpunt',
        title: {
          script: 'E',
          rest: 'en merk met kracht,\nmaar zonder ritme.',
        },
        body: [
          'Hal XIII had de basis goed staan: sterke merkwaarden, loyale volgers, duidelijke richting. Wat ontbrak was regie — posts verschenen onregelmatig, zonder lijn, en de energie die in het merk zit kwam niet mee.',
          'We spraken uitgebreid met het team over waar ze over een jaar willen staan, en vooral: wie ze onderweg willen raken.',
        ],
        imageSeed: 'hal-xiii-01',
      },
      {
        label: 'Het ritme',
        title: {
          script: 'E',
          rest: 'lke maand nieuwe energie,\nniet meer van hetzelfde.',
        },
        body: [
          'We zetten een contentkalender op met vaste momenten: één grote shoot per maand, twee contentdagen op locatie en reactieve content rondom lanceringen en events.',
          'Elke maand verschuift het accent — portretten, productdetails, klantverhalen. Het merk houdt dezelfde toon, maar voelt nooit statisch.',
        ],
        imageSeed: 'hal-xiii-02',
      },
      {
        label: 'Het resultaat',
        title: {
          script: 'Z',
          rest: 'ichtbaar, herkenbaar\nen in beweging.',
        },
        body: [
          'Na zes maanden een groeiend publiek op alle kanalen, en — belangrijker — een community-respons die veel verder gaat dan likes. Berichten, samenwerkingen, nieuwe klanten die zich aangesproken voelen door het totaalbeeld.',
          'Hal XIII is online net zo aanwezig geworden als in de fysieke ruimte.',
        ],
        imageSeed: 'hal-xiii-03',
      },
    ],
    quote: {
      logoText: 'hal+xiii',
      text:
        'Viënna begrijpt wat een merk nodig heeft om écht zichtbaar te worden. Geen standaard content, maar beeld dat kracht uitstraalt en ons publiek raakt.',
      author: 'Daan Vermeer',
      role: 'Owner Hal XIII',
    },
    fullBleedSeed: 'hal-xiii-full',
    nextSlug: 'beautysalon-glow',
  },

  'beautysalon-glow': {
    slug: 'beautysalon-glow',
    year: '2026',
    name: 'Beautysalon Glow',
    heroTitle: {
      script: 'E',
      rest: 'enmalige contentdag\nvoor Beautysalon Glow',
    },
    heroTags: ['Contentdag', 'Fotografie', 'Styling', 'Planning'],
    heroImageSeed: 'beautysalon-glow-hero',
    sections: [
      {
        label: 'Het startpunt',
        title: {
          script: 'E',
          rest: 'en salon die klaar was\nvoor beeld dat klopt.',
        },
        body: [
          'Beautysalon Glow had geen vast contentplan nodig — het team post graag zelf. Wat ze nodig hadden was een voorraad sterk beeld zodat ze maanden vooruit zelfstandig content kunnen samenstellen, zonder steeds opnieuw te hoeven schieten.',
          'We begonnen met een uitgebreide briefing en een moodboard op maat: welke sfeer, welke kleurwereld, welke behandelingen centraal.',
        ],
        imageSeed: 'beautysalon-glow-01',
      },
      {
        label: 'De dag',
        title: {
          script: 'É',
          rest: 'én intensieve dag,\nvolledig uitgedacht.',
        },
        body: [
          "Van zeven uur 's ochtends tot zes uur 's avonds. Elk moment was vooraf besproken: welke behandelingen, welke hoeken, welke sfeerbeelden, welke portretten van het team.",
          'Daardoor konden we op de dag zelf volledig vrij werken — geen logistiek, alleen maken. Licht, styling, details. Een heel jaar aan beeld in elf uur tijd.',
        ],
        imageSeed: 'beautysalon-glow-02',
      },
      {
        label: 'Het resultaat',
        title: {
          script: 'E',
          rest: 'en beeldbank die het\nteam zelfstandig draagt.',
        },
        body: [
          "Binnen twee weken leverden we een georganiseerde beeldbank op: meer dan honderd foto's en een tiental video's, in dezelfde sfeer en direct bruikbaar voor posts, stories, campagnes en de website.",
          'Het team post sindsdien wekelijks, zonder dat de content herhalend voelt. Een eenmalige investering die maanden doorwerkt.',
        ],
        imageSeed: 'beautysalon-glow-03',
      },
    ],
    quote: {
      logoText: 'beautysalon+glow',
      text:
        'De voorbereiding was zo grondig dat de contentdag zelf aanvoelde als samen creëren. We hebben nu beeld waar we het hele jaar mee vooruit kunnen.',
      author: 'Sanne Visser',
      role: 'Eigenaar Beautysalon Glow',
    },
    fullBleedSeed: 'beautysalon-glow-full',
    nextSlug: 'hair-by-kim',
  },
}
