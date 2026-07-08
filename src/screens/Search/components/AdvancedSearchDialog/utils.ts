import {
  extractSearchPostsParams,
  tokenizeQuery,
} from '#/state/queries/search-posts-params'
import {type SearchFilters} from '#/screens/Search/searchParams'

export type RepliesFilter = 'all' | 'none' | 'only'

/**
 * Media filter is mutually exclusive: a post matches at most one of these. It
 * serializes into the separate media/video sibling params (only one is ever
 * set at a time).
 */
export type MediaFilter = 'all' | 'media' | 'video'

/**
 * Whether to limit results to authors the user follows. Serializes into the
 * `following` sibling param ('following' -> following:true, anyone -> unset).
 */
export type FollowingFilter = 'anyone' | 'following'

export type FilterField = 'authors' | 'mentions' | 'domains' | 'urls' | 'tags'

export const FILTER_FIELDS: FilterField[] = [
  'authors',
  'mentions',
  'domains',
  'urls',
  'tags',
]

/** Fields whose values are user handles, so they get handle typeahead. */
export const HANDLE_FIELDS = new Set<FilterField>(['authors', 'mentions'])

/**
 * Whether a filter includes or excludes matching posts. Exclude is a v2-only
 * capability; it serializes into the exclude* sibling params and is dropped on
 * the search v1 path.
 */
export type FilterMode = 'include' | 'exclude'

export type AdvancedFilter = {
  id: string
  field: FilterField
  mode: FilterMode
  value: string
}

/**
 * Monotonic counter for filter row ids, owned here so both this module and the
 * component create rows through the same source. Imported `let` bindings are
 * read-only, so callers must use makeFilter rather than incrementing directly.
 */
let nextFilterId = 0

/** Creates a new filter row with a unique id. */
export function makeFilter(
  field: FilterField,
  value: string = '',
  mode: FilterMode = 'include',
): AdvancedFilter {
  return {id: `filter-${nextFilterId++}`, field, mode, value}
}

/**
 * A marker character users commonly type that is redundant with the field's
 * stored form, e.g. "#cats" or "@alice"; stripped on serialize so we don't
 * store "#cats" or "@alice" in the param value.
 */
const FIELD_MARKERS: Partial<Record<FilterField, string>> = {
  authors: '@',
  mentions: '@',
  tags: '#',
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const d = new Date(value + 'T00:00:00')
  return !isNaN(d.getTime())
}

/**
 * The dialog's full internal state. Free-text fields (query/exactPhrase/
 * negatedWords) are derived from `q`; everything else comes from the structured
 * filter params.
 */
export type DialogState = {
  query: string
  exactPhrase: string
  negatedWords: string
  language: string
  replies: RepliesFilter
  media: MediaFilter
  following: FollowingFilter
  since: string
  until: string
  filters: AdvancedFilter[]
}

const WHITESPACE_RE = /\s+/

/**
 * Maps a filter field to the structured param key it serializes into, by mode.
 * Include rows write the base param; exclude rows write the exclude* sibling.
 */
const FIELD_TO_PARAM: Record<
  FilterMode,
  Record<FilterField, keyof SearchFilters>
> = {
  include: {
    authors: 'author',
    mentions: 'mentions',
    domains: 'domain',
    urls: 'url',
    tags: 'tag',
  },
  exclude: {
    authors: 'excludeAuthor',
    mentions: 'excludeMentions',
    domains: 'excludeDomain',
    urls: 'excludeUrl',
    tags: 'excludeTag',
  },
}

/**
 * A "simple" free-text word - no quotes. Only simple words round-trip cleanly
 * through the negated-words field, so anything else is left in (or moved to)
 * the main query rather than coerced into a `-word` token it can't represent.
 */
function isSimpleWord(word: string): boolean {
  return word.length > 0 && !word.includes('"')
}

/**
 * Parses the free-text portion of a query (`q`) into the dialog's text fields.
 * `q` no longer carries structured operators - those arrive separately via
 * `filters`. A quoted phrase populates "exact phrase" and -negated terms
 * populate "none of these words" - but only when their contents are simple
 * words. Anything that wouldn't round-trip (embedded quotes, a negated phrase
 * like -"a b", etc.) is left verbatim in the main "all of these words" query
 * text instead of parsed.
 */
function parseFreeText(raw: string): {
  query: string
  exactPhrase: string
  negatedWords: string
} {
  const queryParts: string[] = []
  const negatedWords: string[] = []
  let exactPhrase = ''

  for (const token of tokenizeQuery(raw)) {
    // "phrase" -> "exact phrase", only if it has no inner quote.
    if (token.startsWith('"') && token.endsWith('"') && token.length > 1) {
      const inner = token.slice(1, -1)
      if (!inner.includes('"')) {
        exactPhrase = inner
        continue
      }
    }
    // -word -> "none of these words", only if the negated word is simple.
    if (token.startsWith('-') && token.length > 1 && !token.includes(':')) {
      const word = token.slice(1)
      if (isSimpleWord(word)) {
        negatedWords.push(word)
        continue
      }
    }
    queryParts.push(token)
  }

  return {
    query: queryParts.join(' '),
    exactPhrase,
    negatedWords: negatedWords.join(' '),
  }
}

/**
 * Joins two space-delimited value lists, dropping empties and duplicates while
 * preserving order. Used to fold operators lifted from the query text into the
 * matching structured filter values without clobbering either source.
 */
function mergeValues(a?: string, b?: string): string {
  const seen = new Set<string>()
  for (const part of `${a ?? ''} ${b ?? ''}`.split(WHITESPACE_RE)) {
    if (part) seen.add(part)
  }
  return [...seen].join(' ')
}

/**
 * Builds the full dialog state from the free-text `q` plus the structured
 * filter params. Operators typed directly into the query box (e.g. `from:`,
 * `domain:`, `since:`, `#tag`) are lifted out via extractSearchPostsParams and
 * folded into the matching include filters/date fields, and removed from the
 * free text - so the dialog shows them as structured rows rather than raw text.
 */
export function parseAdvancedSearch(
  q: string,
  filters: SearchFilters,
): DialogState {
  /*
   * Lift recognized operators out of the query text. Only include-mode fields
   * can be expressed as operators; exclude rows come solely from filter params.
   */
  const lifted = extractSearchPostsParams(q)
  const freeText = parseFreeText(lifted.q)

  const includeValues: Record<FilterField, string> = {
    authors: mergeValues(filters.author, lifted.author),
    mentions: mergeValues(filters.mentions, lifted.mentions),
    domains: mergeValues(filters.domain, lifted.domain),
    urls: mergeValues(filters.url, lifted.url),
    tags: mergeValues(filters.tag, lifted.tag?.join(' ')),
  }

  const filterRows: AdvancedFilter[] = []
  const MODES: FilterMode[] = ['include', 'exclude']
  for (const field of FILTER_FIELDS) {
    for (const mode of MODES) {
      const value =
        mode === 'include'
          ? includeValues[field]
          : filters[FIELD_TO_PARAM[mode][field]]
      if (value) {
        /*
         * Append a trailing space to handle fields so the typeahead (which
         * matches the last token) stays closed until the user types. The space
         * is ignored on serialize, which trims/splits on whitespace.
         */
        filterRows.push(
          makeFilter(
            field,
            HANDLE_FIELDS.has(field) ? `${value} ` : value,
            mode,
          ),
        )
      }
    }
  }

  let replies: RepliesFilter = 'all'
  if (filters.replies === 'none') replies = 'none'
  else if (filters.replies === 'only') replies = 'only'

  let media: MediaFilter = 'all'
  if (filters.media === 'true') media = 'media'
  else if (filters.video === 'true') media = 'video'

  const lang = filters.lang ?? lifted.lang ?? ''
  const since = filters.since ?? lifted.since
  const until = filters.until ?? lifted.until

  return {
    ...freeText,
    language: lang,
    replies,
    media,
    following: filters.following === 'true' ? 'following' : 'anyone',
    since: since && isValidDate(since) ? since : '',
    until: until && isValidDate(until) ? until : '',
    filters: filterRows,
  }
}

/**
 * Serializes the dialog state into the free-text `q` string plus the structured
 * filter params. Free text (all/exact/none words) goes into `q`; everything
 * else becomes a sibling param.
 */
export function serializeAdvancedSearch(state: {
  query: string
  exactPhrase: string
  negatedWords: string
  language: string
  replies: RepliesFilter
  media: MediaFilter
  following: FollowingFilter
  dateSince: string
  dateSinceActive: boolean
  dateUntil: string
  dateUntilActive: boolean
  filters: AdvancedFilter[]
}): {q: string; filters: SearchFilters} {
  const parts: string[] = []

  if (state.query.trim()) {
    parts.push(state.query.trim())
  }

  /*
   * "exact phrase" -> a quoted token, but only if it's a clean phrase with no
   * embedded quotes. Otherwise it can't be safely wrapped, so pass it through
   * to the query verbatim.
   */
  const exactPhrase = state.exactPhrase.trim()
  if (exactPhrase) {
    parts.push(exactPhrase.includes('"') ? exactPhrase : `"${exactPhrase}"`)
  }

  /*
   * "none of these words" -> -negated tokens, but only simple words get the `-`
   * prefix. Anything unexpected passes through to the query verbatim.
   */
  for (const word of state.negatedWords.trim().split(WHITESPACE_RE)) {
    if (!word) continue
    const bare = word.replace(/^-+/, '')
    if (isSimpleWord(bare)) {
      parts.push(`-${bare}`)
    } else {
      parts.push(word)
    }
  }

  const filters: SearchFilters = {}

  /*
   * Each filter row's value is normalized (marker stripped) into space-joined
   * values under its param key. The row's mode selects the include or exclude
   * param. Multiple rows of the same field and mode merge into one param,
   * deduping values across rows (and within a row) so e.g. two `author: alice`
   * rows don't serialize to "alice alice".
   */
  const valuesByKey = new Map<keyof SearchFilters, Set<string>>()
  for (const filter of state.filters) {
    const marker = FIELD_MARKERS[filter.field]
    const values = filter.value
      .trim()
      .split(WHITESPACE_RE)
      .filter(Boolean)
      .map(v => (marker && v.startsWith(marker) ? v.slice(1) : v))
      .filter(Boolean)
    if (values.length) {
      const key = FIELD_TO_PARAM[filter.mode][filter.field]
      const set = valuesByKey.get(key) ?? new Set<string>()
      for (const value of values) set.add(value)
      valuesByKey.set(key, set)
    }
  }
  for (const [key, set] of valuesByKey) {
    filters[key] = [...set].join(' ')
  }

  if (state.language) filters.lang = state.language
  if (state.dateSinceActive && state.dateSince) filters.since = state.dateSince
  if (state.dateUntilActive && state.dateUntil) filters.until = state.dateUntil
  if (state.replies === 'none') filters.replies = 'none'
  if (state.replies === 'only') filters.replies = 'only'
  if (state.media === 'media') filters.media = 'true'
  else if (state.media === 'video') filters.video = 'true'
  if (state.following === 'following') filters.following = 'true'

  return {q: parts.join(' '), filters}
}
