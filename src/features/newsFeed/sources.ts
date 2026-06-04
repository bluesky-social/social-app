/**
 * The curated registry of approved news accounts, each tagged with the topics,
 * regions, and languages it covers. This is shared, operator-owned config
 * rather than per-user state, so it lives as a local list instead of in the
 * PDS. The user's own selections live in the `social.redacted.newsFeedPrefs`
 * record (see ./state/prefs).
 */

export interface NewsTopic {
  id: string
  label: string
}

export interface NewsRegion {
  id: string
  label: string
}

export interface NewsSource {
  did: string
  handle: string
  displayName: string
  topics: string[]
  regions: string[]
  langs: string[]
}

// `id` is stored in the user's prefs; `label` is display-only and wrapped for
// translation at render time.
export const NEWS_TOPICS: NewsTopic[] = [
  {id: 'all', label: 'All topics'},
  {id: 'politics', label: 'Politics'},
  {id: 'arts', label: 'Arts & Culture'},
  {id: 'tech', label: 'Tech'},
  {id: 'sports', label: 'Sports'},
  {id: 'health', label: 'Health'},
  {id: 'climate', label: 'Climate'},
  {id: 'science', label: 'Science'},
  {id: 'business', label: 'Business & Finance'},
  {id: 'general', label: 'General'},
]

export const NEWS_REGIONS: NewsRegion[] = [
  {id: 'global', label: 'Global'},
  {id: 'europe', label: 'Europe'},
  {id: 'uk', label: 'UK'},
  {id: 'france', label: 'France'},
  {id: 'germany', label: 'Germany'},
  {id: 'netherlands', label: 'Netherlands'},
  {id: 'belgium', label: 'Belgium'},
  {id: 'spain', label: 'Spain'},
  {id: 'italy', label: 'Italy'},
  {id: 'poland', label: 'Poland'},
  {id: 'ireland', label: 'Ireland'},
  {id: 'portugal', label: 'Portugal'},
  {id: 'austria', label: 'Austria'},
  {id: 'switzerland', label: 'Switzerland'},
  {id: 'greece', label: 'Greece'},
  {id: 'nordics', label: 'Nordics'},
  {id: 'ukraine', label: 'Ukraine'},
]

/**
 * Curated demo sources: real news accounts on the network, resolved to their
 * DIDs. Tags are an editorial starting point - refine as the registry grows.
 */
export const NEWS_SOURCES: NewsSource[] = [
  // Global wires / general
  {
    did: 'did:plc:a67zdrt4nl2tv2qojpngogbq',
    handle: 'apnews.com',
    displayName: 'The Associated Press',
    topics: ['politics', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:jbvnehrrdqoulco4rf5gxg5r',
    handle: 'reuters.com',
    displayName: 'Reuters',
    topics: ['politics', 'business', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:ln72v57ivz2g46uqf4xxqiuh',
    handle: 'npr.org',
    displayName: 'NPR',
    topics: ['politics', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:eclio37ymobqex2ncko63h4r',
    handle: 'nytimes.com',
    displayName: 'The New York Times',
    topics: ['politics', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:k5nskatzhyxersjilvtnz4lh',
    handle: 'washingtonpost.com',
    displayName: 'The Washington Post',
    topics: ['politics', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:k4jt6heuiamymgi46yeuxtpt',
    handle: 'propublica.org',
    displayName: 'ProPublica',
    topics: ['politics'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:2lofqead276vtc5647ye7sl2',
    handle: 'aljazeera.com',
    displayName: 'Al Jazeera English',
    topics: ['politics', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:mhzk3blh4pfxo3fqh2meowbb',
    handle: 'economist.com',
    displayName: 'The Economist',
    topics: ['politics', 'business'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:2jwxoziacifmtqa5felhqms6',
    handle: 'semafor.com',
    displayName: 'Semafor',
    topics: ['politics', 'business', 'general'],
    regions: ['global'],
    langs: ['en'],
  },
  // UK
  {
    did: 'did:plc:vovinwhtulbsx4mwfw26r5ni',
    handle: 'theguardian.com',
    displayName: 'The Guardian',
    topics: ['politics', 'general'],
    regions: ['uk', 'global'],
    langs: ['en'],
  },
  // France
  {
    did: 'did:plc:qqxqxgdu5z3he2piqfbfaku4',
    handle: 'lemonde.fr',
    displayName: 'Le Monde',
    topics: ['politics', 'general'],
    regions: ['france', 'europe'],
    langs: ['fr'],
  },
  {
    did: 'did:plc:wkreszch2k4mumsrlkeaflgn',
    handle: 'france24.com',
    displayName: 'FRANCE 24',
    topics: ['politics', 'general'],
    regions: ['france', 'europe'],
    langs: ['fr', 'en'],
  },
  {
    did: 'did:plc:vvlpfarso2eojm2xpzc7qrd7',
    handle: 'rfi.fr',
    displayName: 'RFI',
    topics: ['politics', 'general'],
    regions: ['france', 'europe'],
    langs: ['fr'],
  },
  {
    did: 'did:plc:uo4didwt5qe4onrscbmqwvwm',
    handle: 'liberation.fr',
    displayName: 'Libération',
    topics: ['politics', 'general'],
    regions: ['france'],
    langs: ['fr'],
  },
  // Germany
  {
    did: 'did:plc:6xofcnvvojjnmggqx43zghwh',
    handle: 'spiegel.de',
    displayName: 'DER SPIEGEL',
    topics: ['politics', 'general'],
    regions: ['germany', 'europe'],
    langs: ['de'],
  },
  {
    did: 'did:plc:42pjb4dy3p3ubiekmwpkthen',
    handle: 'zeit.de',
    displayName: 'ZEIT ONLINE',
    topics: ['politics', 'general'],
    regions: ['germany', 'europe'],
    langs: ['de'],
  },
  // Netherlands
  {
    did: 'did:plc:bvkk4kkuavnhqrwapc34wtfp',
    handle: 'nrc.nl',
    displayName: 'NRC',
    topics: ['politics', 'general'],
    regions: ['netherlands', 'europe'],
    langs: ['nl'],
  },
  {
    did: 'did:plc:ass4aukj7qniiiswynzx24xa',
    handle: 'volkskrant.nl',
    displayName: 'de Volkskrant',
    topics: ['politics', 'general'],
    regions: ['netherlands'],
    langs: ['nl'],
  },
  // Belgium
  {
    did: 'did:plc:y76r3wcphgsa2tabzsrfdwgg',
    handle: 'standaard.be',
    displayName: 'De Standaard',
    topics: ['politics', 'general'],
    regions: ['belgium'],
    langs: ['nl'],
  },
  // Spain
  {
    did: 'did:plc:u6mkbcgviwlbhuwqirmhcgu3',
    handle: 'elpais.com',
    displayName: 'EL PAÍS',
    topics: ['politics', 'general'],
    regions: ['spain', 'europe'],
    langs: ['es'],
  },
  // Italy
  {
    did: 'did:plc:edlhbnew2fu4x3huxgrtybsp',
    handle: 'ilpost.it',
    displayName: 'Il Post',
    topics: ['politics', 'general'],
    regions: ['italy', 'europe'],
    langs: ['it'],
  },
  // Poland
  {
    did: 'did:plc:t7zuqso6lxw5luyr36cbqb25',
    handle: 'wyborcza.pl',
    displayName: 'Gazeta Wyborcza',
    topics: ['politics', 'general'],
    regions: ['poland', 'europe'],
    langs: ['pl'],
  },
  {
    did: 'did:plc:32k2vlfjwbjnqys7muphw2d5',
    handle: 'tvn24.pl',
    displayName: 'TVN24',
    topics: ['politics', 'general'],
    regions: ['poland', 'europe'],
    langs: ['pl'],
  },
  // Ireland
  {
    did: 'did:plc:ilo5g7lh5xvh7ppgl7xqygpk',
    handle: 'rte.ie',
    displayName: 'RTÉ News',
    topics: ['politics', 'general'],
    regions: ['ireland', 'europe'],
    langs: ['en'],
  },
  {
    did: 'did:plc:465tbrqfeduj3lhludc6nbog',
    handle: 'irishtimes.com',
    displayName: 'The Irish Times',
    topics: ['politics', 'general'],
    regions: ['ireland', 'europe'],
    langs: ['en'],
  },
  {
    did: 'did:plc:qjaqauwzfmqz3uzauuufhrc4',
    handle: 'thejournal.ie',
    displayName: 'TheJournal.ie',
    topics: ['politics', 'general'],
    regions: ['ireland', 'europe'],
    langs: ['en'],
  },
  // Portugal
  {
    did: 'did:plc:t6xm4zrxilskfwjta2x7lu56',
    handle: 'publico.pt',
    displayName: 'Público',
    topics: ['politics', 'general'],
    regions: ['portugal', 'europe'],
    langs: ['pt'],
  },
  // Austria
  {
    did: 'did:plc:h3fqal74ubgzp3lfnsucbhrp',
    handle: 'derstandard.at',
    displayName: 'DER STANDARD',
    topics: ['politics', 'general'],
    regions: ['austria', 'europe'],
    langs: ['de'],
  },
  // Switzerland
  {
    did: 'did:plc:mx2psjx4bmhoa4fld24c6gla',
    handle: 'nzz.ch',
    displayName: 'NZZ',
    topics: ['politics', 'general'],
    regions: ['switzerland', 'europe'],
    langs: ['de'],
  },
  // Greece
  {
    did: 'did:plc:f66ovc6bfjep4arbkkmfz5ef',
    handle: 'kathimerini.gr',
    displayName: 'Kathimerini',
    topics: ['politics', 'general'],
    regions: ['greece', 'europe'],
    langs: ['el'],
  },
  // Nordics
  {
    did: 'did:plc:trfc2wxofhvebggzpefafxs2',
    handle: 'hs.fi',
    displayName: 'Helsingin Sanomat',
    topics: ['politics', 'general'],
    regions: ['nordics', 'europe'],
    langs: ['fi'],
  },
  {
    did: 'did:plc:pvao7wm4e4b3c7rtco4vh766',
    handle: 'politiken.dk',
    displayName: 'Politiken',
    topics: ['politics', 'general'],
    regions: ['nordics', 'europe'],
    langs: ['da'],
  },
  // Ukraine
  {
    did: 'did:plc:yazbevg3wkzp5llnzb44tqgh',
    handle: 'kyivindependent.com',
    displayName: 'The Kyiv Independent',
    topics: ['politics', 'general'],
    regions: ['ukraine', 'europe'],
    langs: ['en'],
  },
  // Europe-wide
  {
    did: 'did:plc:bak7f4b3jsiqlpyo6o4ejaji',
    handle: 'politico.eu',
    displayName: 'POLITICO Europe',
    topics: ['politics', 'business'],
    regions: ['europe'],
    langs: ['en'],
  },
  {
    did: 'did:plc:6uybbvnd3pfjh5oztjngzdss',
    handle: 'euronews.com',
    displayName: 'Euronews',
    topics: ['politics', 'general'],
    regions: ['europe'],
    langs: ['en'],
  },
  {
    did: 'did:plc:npdxsw4zvih4gcyqppoql7qk',
    handle: 'euractiv.com',
    displayName: 'EURACTIV',
    topics: ['politics', 'business'],
    regions: ['europe'],
    langs: ['en'],
  },
  // Tech
  {
    did: 'did:plc:7exlcsle4mjfhu3wnhcgizz6',
    handle: 'theverge.com',
    displayName: 'The Verge',
    topics: ['tech'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:wld6fad6xsm4tz4kfkoikun2',
    handle: 'arstechnica.com',
    displayName: 'Ars Technica',
    topics: ['tech', 'science'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:vtpyqvwce4x6gpa5dcizqecy',
    handle: 'techcrunch.com',
    displayName: 'TechCrunch',
    topics: ['tech', 'business'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:inz4fkbbp7ms3ixufw6xuvdi',
    handle: 'wired.com',
    displayName: 'WIRED',
    topics: ['tech', 'science'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:vcepp6trx4vpe5ourxso4tjl',
    handle: '404media.co',
    displayName: '404 Media',
    topics: ['tech'],
    regions: ['global'],
    langs: ['en'],
  },
  // Science
  {
    did: 'did:plc:vrsppvjc5fysqnm2zshiirey',
    handle: 'nature.com',
    displayName: 'Nature',
    topics: ['science'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:546qgaw5whiyfktyiyzv4z3p',
    handle: 'newscientist.com',
    displayName: 'New Scientist',
    topics: ['science'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:vqgovau5gkirnk3ss5qwjdmz',
    handle: 'science.org',
    displayName: 'Science Magazine',
    topics: ['science'],
    regions: ['global'],
    langs: ['en'],
  },
  // Health
  {
    did: 'did:plc:dawci6skpmelnlja3lygz3p7',
    handle: 'statnews.com',
    displayName: 'STAT',
    topics: ['health', 'science'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:ptqslujurlrnncmzlhq5sscu',
    handle: 'kffhealthnews.org',
    displayName: 'KFF Health News',
    topics: ['health'],
    regions: ['global'],
    langs: ['en'],
  },
  // Sports
  {
    did: 'did:plc:x7d6j54pm22ufehkes6jo4jf',
    handle: 'espn.com',
    displayName: 'ESPN',
    topics: ['sports'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:b2kutgxqlltwc6lhs724cfwr',
    handle: 'theathletic.com',
    displayName: 'The Athletic',
    topics: ['sports'],
    regions: ['global'],
    langs: ['en'],
  },
  // Climate
  {
    did: 'did:plc:ngqdkvttdmzsbwb2mngquwip',
    handle: 'grist.org',
    displayName: 'Grist',
    topics: ['climate'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:2d6kuvaoa7qi6bq5cwq4isee',
    handle: 'carbonbrief.org',
    displayName: 'Carbon Brief',
    topics: ['climate', 'science'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:zme3usssbyhtqtg2rsilkeh4',
    handle: 'insideclimatenews.org',
    displayName: 'Inside Climate News',
    topics: ['climate'],
    regions: ['global'],
    langs: ['en'],
  },
  // Arts & Culture
  {
    did: 'did:plc:azhp7skmdpph62i3zgy4jixy',
    handle: 'variety.com',
    displayName: 'Variety',
    topics: ['arts'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:bz2qt2eyn4wu5nnpqxu7iydz',
    handle: 'pitchfork.com',
    displayName: 'Pitchfork',
    topics: ['arts'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:4isvv7q3p52sbntcd3npzh7s',
    handle: 'hyperallergic.com',
    displayName: 'Hyperallergic',
    topics: ['arts'],
    regions: ['global'],
    langs: ['en'],
  },
  // Business & Finance
  {
    did: 'did:plc:uewxgchsjy4kmtu7dcxa77us',
    handle: 'bloomberg.com',
    displayName: 'Bloomberg',
    topics: ['business'],
    regions: ['global'],
    langs: ['en'],
  },
  {
    did: 'did:plc:m7ks2xhfuku7errrtfjux2lg',
    handle: 'cnbc.com',
    displayName: 'CNBC',
    topics: ['business'],
    regions: ['global'],
    langs: ['en'],
  },
]

/**
 * Filter the registry by a selection. Empty `topics`/`regions` mean "no
 * constraint" on that facet. Pass `applyExclusions: false` to get the full
 * match set for the opt-out screen, where the user toggles sources off.
 */
export function selectSources(
  selection: {
    topics: string[]
    regions: string[]
    excludedDids?: string[]
  },
  {applyExclusions = true}: {applyExclusions?: boolean} = {},
): NewsSource[] {
  const {topics, regions, excludedDids = []} = selection
  // `all` is a catch-all that disables topic filtering entirely.
  const filterByTopic = topics.length > 0 && !topics.includes('all')
  return NEWS_SOURCES.filter(source => {
    if (filterByTopic && !topics.some(t => source.topics.includes(t))) {
      return false
    }
    if (regions.length && !regions.some(r => source.regions.includes(r))) {
      return false
    }
    if (applyExclusions && excludedDids.includes(source.did)) {
      return false
    }
    return true
  })
}

const REGION_LABELS = new Map(NEWS_REGIONS.map(r => [r.id, r.label]))
const TOPIC_LABELS = new Map(NEWS_TOPICS.map(t => [t.id, t.label]))

// Labels for a source's tags (regions first, then topics) for the source card.
export function sourceTagLabels(source: NewsSource): string[] {
  return [
    ...source.regions.map(id => REGION_LABELS.get(id) ?? id),
    ...source.topics.map(id => TOPIC_LABELS.get(id) ?? id),
  ]
}
