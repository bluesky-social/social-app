import {useMemo} from 'react'
import {Trans, useLingui} from '@lingui/react/macro'

import {augmentSearchQuery} from '#/lib/strings/helpers'
import {codeToLanguageName} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {useSearchPostsV2Query} from '#/state/queries/search-posts-v2'
import {useSession} from '#/state/session'
import {type SearchFilters} from '#/screens/Search/searchParams'
import {Admonition} from '#/components/Admonition'
import {createStaticClick, InlineLinkText} from '#/components/Link'

type DetectedLanguage = {code: string; name: string}

// Shows a tip naming the languages v2 detected in the query text (for
// CJK/Thai/Arabic scripts), so the user can confirm we parsed the query as they
// intended. Each name is a link that adds its code to the `language` filter and
// re-runs the search. It runs the same v2 query as the active post-results tab;
// react query dedupes on the shared cache key, so this reads the existing
// result rather than triggering a second fetch.
export function DetectedLanguagesAdmonition({
  query,
  filters,
  sort,
  enabled,
  onPressLanguage,
}: {
  query: string
  filters: SearchFilters
  sort?: 'top' | 'latest'
  enabled: boolean
  onPressLanguage: (code: string) => void
}) {
  const {appLanguage} = useLanguagePrefs()
  const {currentAccount} = useSession()

  const augmentedQuery = useMemo(
    () => augmentSearchQuery(query || '', {did: currentAccount?.did}),
    [query, currentAccount],
  )

  const {data} = useSearchPostsV2Query({
    query: augmentedQuery,
    filters,
    sort,
    enabled,
  })

  // Detected languages are a per-query value; read them from the first page.
  const languages = useMemo<DetectedLanguage[]>(() => {
    const codes = data?.pages[0]?.detectedQueryLanguages ?? []
    return codes.map(code => ({
      code,
      name: codeToLanguageName(code, appLanguage),
    }))
  }, [data, appLanguage])

  // No suggestions to make.
  if (languages.length === 0) return null

  // User already chose one of the suggestions.
  if (filters.lang && languages.some(({code}) => code === filters.lang))
    return null

  return (
    <Admonition type="tip">
      <DetectedLanguagesPrompt
        languages={languages}
        onPressLanguage={onPressLanguage}
      />
    </Admonition>
  )
}

// Per-count templates so the sentence and list conjunction stay translatable
// while each language name remains an individually pressable link. v2 only
// detects 1-5 languages; 3+ all use the comma-list variant.
function DetectedLanguagesPrompt({
  languages,
  onPressLanguage,
}: {
  languages: DetectedLanguage[]
  onPressLanguage: (code: string) => void
}) {
  const {t: l} = useLingui()

  const link = (lang: DetectedLanguage) => (
    <InlineLinkText
      label={l`Filter this search by ${lang.name}`}
      {...createStaticClick(() => onPressLanguage(lang.code))}>
      {lang.name}
    </InlineLinkText>
  )

  if (languages.length === 1) {
    return <Trans>Are you searching for posts in {link(languages[0])}?</Trans>
  }

  if (languages.length === 2) {
    return (
      <Trans>
        Are you searching for posts in {link(languages[0])} or{' '}
        {link(languages[1])}?
      </Trans>
    )
  }

  const head = languages.slice(0, -1)
  const last = languages[languages.length - 1]
  return (
    <Trans comment="List formatting: {0}, {1}, or {2}">
      Are you searching for posts in{' '}
      {head.map(lang => (
        <Trans key={lang.code} comment="List formatting: {0}, {1}, {2}">
          {link(lang)},{' '}
        </Trans>
      ))}
      or {link(last)}?
    </Trans>
  )
}
