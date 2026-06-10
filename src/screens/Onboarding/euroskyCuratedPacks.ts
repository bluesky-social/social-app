/**
 * Eurosky fork: curated starter packs sourced from the "mu - starter packs and
 * feeds" sheet, used to power onboarding.
 *
 * Two onboarding surfaces consume this:
 *
 * 1. StepSuggestedAccounts ("people per topic") - for the selected interest we
 *    pick the packs tagged with that interest AND the user's language, then
 *    resolve their MEMBERS into a flat follow list (no pack card). See
 *    `selectPacksForInterest` + `euroskySuggestedFollows`.
 *
 * 2. StepSuggestedStarterpacks - we surface a curated showcase set of packs,
 *    floating the user's language-matched regional packs first. See
 *    `selectStep3Packs` + `euroskySuggestedStarterPacks`.
 *
 * Topic mapping note: the sheet's free-text topics are folded onto the app's
 * interest ids (`#/lib/interests`). Per product decision: government -> news +
 * politics; climate and health -> nature + science.
 *
 * Language note: codes are bcp-47 primary subtags. 'nl' covers Dutch and
 * Flemish. `langs: ['*']` means show regardless of the user's language (pan-EU
 * / mixed-language packs). Profile and feed links from the sheet are
 * intentionally omitted - they are not starter packs.
 */

export type EuroskyCuratedPack = {
  /** at:// URI of the starter pack record. */
  uri: string
  /** Display name (for code-side reference only; the UI uses the live record). */
  name: string
  /** App interest ids (`#/lib/interests`) this pack should surface under. */
  interests: string[]
  /** bcp-47 primary language subtags, or ['*'] for all languages. */
  langs: string[]
}

// Cap packs resolved per interest so a broad topic (e.g. news) doesn't fan out
// into too many getStarterPack/getList calls.
const MAX_PACKS_PER_INTEREST = 5

// Some app interests have no curated packs of their own but map naturally onto
// one we do curate. Selecting such an interest also pulls the aliased packs.
const INTEREST_ALIASES: Record<string, string> = {
  journalism: 'news',
}

const SP = 'app.bsky.graph.starterpack'
const uri = (did: string, rkey: string) => `at://${did}/${SP}/${rkey}`

// DIDs, grouped by the account that publishes the packs.
const FRANCE = 'did:plc:durcipmx2rwgzzagbiumobs5' // france-atmosphe.re
const BELGIUM = 'did:plc:uc2nb77ecghhmg72ny6avts2' // belgianblueskywins.eurosky.social
const GERMANY = 'did:plc:252n5cfhxlwdzzeixqw7tbem' // yvesvenedey.de

export const EUROSKY_CURATED_PACKS: EuroskyCuratedPack[] = [
  // France
  {
    uri: uri(FRANCE, '3ml6nbppl2m2k'),
    name: 'Presse ecrite',
    interests: ['news'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3ml6nqawbla2v'),
    name: 'Medias en Ligne',
    interests: ['news'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3mmr7le5wfs2w'),
    name: 'Meteo et climat',
    interests: ['nature', 'science', 'politics'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3mkkijyzhhg2s'),
    name: 'Executif',
    interests: ['news', 'politics'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3mkkje2ek5u2y'),
    name: "Agences et operateurs de l'Etat",
    interests: ['news', 'politics'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3mmlcp37dis2f'),
    name: 'Tech et cybersec',
    interests: ['tech', 'politics'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3mkkw3mzrs62k'),
    name: 'Sante',
    interests: ['nature', 'science'],
    langs: ['fr'],
  },
  {
    uri: uri(FRANCE, '3mkkubkofqy2k'),
    name: 'Economie',
    interests: ['finance'],
    langs: ['fr'],
  },

  // Belgium (Flemish + French)
  {
    uri: uri(BELGIUM, '3ls53rypmsl2j'),
    name: 'BE Media',
    interests: ['news'],
    langs: ['nl', 'fr', 'en'],
  },
  {
    uri: uri(BELGIUM, '3mllg5mwz2i2s'),
    name: 'BE Federal Government',
    interests: ['news', 'politics'],
    langs: ['nl', 'fr'],
  },
  {
    uri: uri(BELGIUM, '3mm52xoi7t22k'),
    name: 'BE Flemish Government',
    interests: ['news', 'politics'],
    langs: ['nl'],
  },
  {
    uri: uri(BELGIUM, '3mcf5ejflim2k'),
    name: 'BE Governments & Services',
    interests: ['news', 'politics'],
    langs: ['nl', 'fr'],
  },
  {
    uri: uri(BELGIUM, '3mmtjz63rw42f'),
    name: 'BE Weather and Climate',
    interests: ['nature', 'science'],
    langs: ['nl', 'fr'],
  },
  {
    uri: uri(BELGIUM, '3ml45rtzxpc2k'),
    name: 'BE Health',
    interests: ['nature', 'science'],
    langs: ['nl', 'fr', 'en'],
  },

  // Netherlands
  {
    uri: uri('did:plc:qay5t74gafoql7x4j3ahzau7', '3mmhcxxicwy2z'),
    name: 'NL Media',
    interests: ['news'],
    langs: ['nl'],
  },
  {
    uri: uri('did:plc:qvozofw44d4ick44g3nmzoc4', '3latzv4cqmp2v'),
    name: 'Kunstenaars en makers uit Nederland en Belgie',
    interests: ['art', 'culture'],
    langs: ['nl'],
  },

  // Germany
  {
    uri: uri(GERMANY, '3llye43gpp725'),
    name: 'Techjournalist:innen',
    interests: ['tech'],
    langs: ['de'],
  },
  {
    uri: uri(GERMANY, '3l6kzedx6op2o'),
    name: 'Klima Startpaket',
    interests: ['nature', 'science'],
    langs: ['de'],
  },
  {
    uri: uri('did:plc:xhwps35k4uux4upzahbe2vxt', '3lk6a4e6kb22j'),
    name: 'Deutsche Bundesbehorden',
    interests: ['news', 'politics'],
    langs: ['de'],
  },

  // EU / Global (shown regardless of language where langs is ['*'])
  {
    uri: uri('did:plc:oxo226vi7t2btjokm2buusoy', '3lvsypmwed42s'),
    name: 'European Commissioners',
    interests: ['news', 'politics'],
    langs: ['*'],
  },
  {
    uri: uri('did:plc:jcoy7v3a2t4rcfdh6i4kza25', '3kvvsi4qacz2p'),
    name: 'Astronomy on Bluesky',
    interests: ['science'],
    langs: ['en'],
  },
  {
    uri: uri('did:plc:v7gngzva22rilmcp6fiypowf', '3lbcrdrart42l'),
    name: 'Top-Notch Nature Photographers',
    interests: ['nature', 'photography', 'science'],
    langs: ['en'],
  },
  {
    uri: uri('did:plc:wi7bstljuyjgn26su62xdg2j', '3lg3zaxppsp2a'),
    name: 'BookSky',
    interests: ['books', 'art', 'culture'],
    langs: ['en'],
  },
  {
    uri: uri('did:plc:m7h633sxyqlzwlhdubecv4uy', '3lggcx32mgu23'),
    name: 'Gaming: Studios, Publishers, Media & Leakers',
    interests: ['gaming'],
    langs: ['en'],
  },
  {
    uri: uri('did:plc:62vnlixijdl6uwgpjbxjk5b3', '3l4tsdod5fb2y'),
    name: 'International Politics',
    interests: ['politics'],
    langs: ['en'],
  },
  {
    uri: uri('did:plc:uz5apa2z3jrxhjjzqw5qik65', '3lb7zle5y6v2l'),
    name: 'UK Political Commentators',
    interests: ['politics'],
    langs: ['en'],
  },
]

/**
 * Curated showcase for StepSuggestedStarterpacks, shown to everyone. These are
 * broad pan-EU / global packs; the user's regional packs are floated in front
 * of them by `selectStep3Packs`.
 */
const STEP3_SHOWCASE_URIS: string[] = [
  uri('did:plc:oxo226vi7t2btjokm2buusoy', '3lvsypmwed42s'), // European Commissioners
  uri('did:plc:jcoy7v3a2t4rcfdh6i4kza25', '3kvvsi4qacz2p'), // Astronomy
  uri('did:plc:wi7bstljuyjgn26su62xdg2j', '3lg3zaxppsp2a'), // BookSky
  uri('did:plc:62vnlixijdl6uwgpjbxjk5b3', '3l4tsdod5fb2y'), // International Politics
  uri('did:plc:m7h633sxyqlzwlhdubecv4uy', '3lggcx32mgu23'), // Gaming
  uri('did:plc:v7gngzva22rilmcp6fiypowf', '3lbcrdrart42l'), // Nature Photographers
]

/** Lowercased primary subtags for the user's content languages. */
function primaryLangs(userLangs: string[]): string[] {
  return userLangs.map(l => l.split('-')[0].toLowerCase())
}

/**
 * Does this pack match the user's languages? `['*']` always matches, and an
 * empty language pref (the "full experience" English default) matches anything.
 */
function packMatchesLangs(
  pack: EuroskyCuratedPack,
  userLangs: string[],
): boolean {
  if (pack.langs.includes('*')) return true
  if (userLangs.length === 0) return true
  const prims = primaryLangs(userLangs)
  return pack.langs.some(l => prims.includes(l))
}

/**
 * Pack URIs to resolve into a follow list for a given interest + user language.
 * Used by StepSuggestedAccounts.
 */
export function selectPacksForInterest(
  interest: string,
  userLangs: string[],
): string[] {
  const wanted = new Set([interest, INTEREST_ALIASES[interest]].filter(Boolean))
  return EUROSKY_CURATED_PACKS.filter(
    p => p.interests.some(i => wanted.has(i)) && packMatchesLangs(p, userLangs),
  )
    .slice(0, MAX_PACKS_PER_INTEREST)
    .map(p => p.uri)
}

/**
 * Pack URIs for StepSuggestedStarterpacks: the user's language-matched regional
 * packs first, then the global showcase. Capped so the curated set stays tight.
 */
export function selectStep3Packs(userLangs: string[]): string[] {
  const prims = primaryLangs(userLangs)
  const regional =
    prims.length === 0
      ? []
      : EUROSKY_CURATED_PACKS.filter(
          p =>
            !p.langs.includes('*') &&
            p.langs.some(l => prims.includes(l)) &&
            !STEP3_SHOWCASE_URIS.includes(p.uri),
        )
          .slice(0, 3)
          .map(p => p.uri)

  return Array.from(new Set([...regional, ...STEP3_SHOWCASE_URIS])).slice(0, 8)
}
