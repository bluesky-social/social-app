/*
 * Pure helpers for lifting structured `app.bsky.feed.searchPosts` params out of
 * a free-text query. Kept free of React Native imports so it can be unit
 * tested in isolation (the search-posts query hook re-exports these).
 */

import {type AppBskyFeedSearchPostsV2} from '@atproto/api'

import {
  filtersToApiParams,
  type SearchFilters,
} from '#/screens/Search/searchParams'

const DATE_RE = /^\d{4}-\d{2}-\d{2}/

export type ExtractedSearchParams = {
  q: string
  author?: string
  mentions?: string
  domain?: string
  url?: string
  lang?: string
  since?: string
  until?: string
  tag?: string[]
}

/**
 * Splits a query into whitespace-delimited tokens, keeping quoted phrases
 * ("a b") and parenthesized OR groups ((a OR b)) intact so they pass through to
 * `q` untouched. Shared with the advanced-search dialog's parser (view layer),
 * which imports it from here so the two stay in sync.
 */
export function tokenizeQuery(raw: string): string[] {
  const tokens: string[] = []
  let i = 0
  const n = raw.length
  while (i < n) {
    if (/\s/.test(raw[i])) {
      i++
      continue
    }
    const start = i
    if (raw[i] === '(') {
      let depth = 0
      while (i < n) {
        if (raw[i] === '(') depth++
        else if (raw[i] === ')') {
          depth--
          if (depth === 0) {
            i++
            break
          }
        }
        i++
      }
      tokens.push(raw.slice(start, i))
      continue
    }
    let buf = ''
    while (i < n && !/\s/.test(raw[i]) && raw[i] !== '(') {
      if (raw[i] === '"') {
        buf += raw[i++]
        while (i < n && raw[i] !== '"') buf += raw[i++]
        if (i < n) buf += raw[i++]
      } else {
        buf += raw[i++]
      }
    }
    if (buf) tokens.push(buf)
  }
  return tokens
}

/**
 * Lifts the operators that `app.bsky.feed.searchPosts` accepts as structured
 * params out of the free-text query, so the backend filters on them directly.
 * Recognized operators are stripped from `q`; everything else (free text,
 * quoted phrases, OR groups, negations, and unsupported operators like
 * `replies:`, `media:`) is left in `q` verbatim. Singular params keep the first
 * value seen; `tag` accumulates (the lexicon AND-matches multiple tags).
 */
export function extractSearchPostsParams(query: string): ExtractedSearchParams {
  const result: ExtractedSearchParams = {q: ''}
  const remaining: string[] = []
  const tags: string[] = []

  for (const token of tokenizeQuery(query)) {
    if (token.startsWith('#') && token.length > 1 && !token.includes(':')) {
      tags.push(token.slice(1))
      continue
    }

    const colonIdx = token.indexOf(':')
    if (colonIdx === -1) {
      remaining.push(token)
      continue
    }

    const op = token.slice(0, colonIdx)
    const value = token.slice(colonIdx + 1)
    if (!value) {
      remaining.push(token)
      continue
    }

    switch (op) {
      case 'from':
        result.author ??= value
        break
      case 'mentions':
      case 'to':
        result.mentions ??= value
        break
      case 'domain':
        result.domain ??= value
        break
      case 'url':
        result.url ??= value
        break
      case 'lang':
        result.lang ??= value
        break
      case 'since':
        if (DATE_RE.test(value)) result.since ??= value
        else remaining.push(token)
        break
      case 'until':
        if (DATE_RE.test(value)) result.until ??= value
        else remaining.push(token)
        break
      default:
        // Unsupported operator (to:, replies:, media:, etc.) - keep in q.
        remaining.push(token)
    }
  }

  if (tags.length) result.tag = tags
  result.q = remaining.join(' ')
  return result
}

/**
 * Concatenates two optional value lists, dropping empties and duplicates while
 * preserving order. Used to union the back-compat operators embedded in the
 * query string with the explicit dialog filters so neither source clobbers the
 * other.
 */
function mergeList(a?: string[], b?: string[]): string[] | undefined {
  const merged = [...new Set([...(a ?? []), ...(b ?? [])])]
  return merged.length ? merged : undefined
}

/**
 * Builds the `app.bsky.feed.searchPostsV2` query params (minus q/limit/cursor/
 * sort, which the caller owns) from the operators embedded in the query string
 * plus the structured advanced-search dialog filters. The two sources are
 * merged rather than overriding each other: list fields union their values, and
 * scalar fields prefer the explicit dialog filter, falling back to the embedded
 * operator. v2 renames v1's singular operators to plural arrays, and `lang` to
 * `language`.
 */
export function buildSearchPostsV2Filters(
  embedded: Omit<ExtractedSearchParams, 'q'>,
  filters?: SearchFilters,
): AppBskyFeedSearchPostsV2.QueryParams {
  const apiFilters = filters ? filtersToApiParams(filters) : {}
  const params: AppBskyFeedSearchPostsV2.QueryParams = {}

  const authors = mergeList(
    embedded.author ? [embedded.author] : undefined,
    apiFilters.authors,
  )
  if (authors) params.authors = authors

  const mentions = mergeList(
    embedded.mentions ? [embedded.mentions] : undefined,
    apiFilters.mentions,
  )
  if (mentions) params.mentions = mentions

  const domains = mergeList(
    embedded.domain ? [embedded.domain] : undefined,
    apiFilters.domains,
  )
  if (domains) params.domains = domains

  const urls = mergeList(
    embedded.url ? [embedded.url] : undefined,
    apiFilters.urls,
  )
  if (urls) params.urls = urls

  const hashtags = mergeList(embedded.tag, apiFilters.hashtags)
  if (hashtags) params.hashtags = hashtags

  const language = apiFilters.language ?? embedded.lang
  // TODO At the moment, the language selector is single-select. -dsb
  if (language) params.languages = [language]

  const since = parseTimestamp(apiFilters.since ?? embedded.since)
  if (since) params.since = since

  const until = parseTimestamp(apiFilters.until ?? embedded.until)
  if (until) params.until = until

  /*
   * Exclude lists have no embedded query-string source (operators like `from:`
   * are always include), so they pass straight through from the dialog filters.
   */
  if (apiFilters.excludeAuthors)
    params.excludeAuthors = apiFilters.excludeAuthors
  if (apiFilters.excludeMentions)
    params.excludeMentions = apiFilters.excludeMentions
  if (apiFilters.excludeDomains)
    params.excludeDomains = apiFilters.excludeDomains
  if (apiFilters.excludeUrls) params.excludeUrls = apiFilters.excludeUrls
  if (apiFilters.excludeHashtags)
    params.excludeHashtags = apiFilters.excludeHashtags

  if (apiFilters.hasMedia) params.hasMedia = true
  if (apiFilters.hasVideo) params.hasVideo = true
  if (apiFilters.following) params.following = true
  if (apiFilters.excludeReplies) params.excludeReplies = true
  if (apiFilters.repliesOnly) params.repliesOnly = true

  return params
}

/**
 * Consistent with timestamp parsing in @atproto/api. Only the date is used; the
 * time is appended here since the lexicon expects a datetime value.
 */
const parseTimestamp = (value: string | undefined): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  if (isNaN(date.getTime())) return undefined
  return date.toISOString().split('.')[0] + 'Z'
}
