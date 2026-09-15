import {type Sift} from '@bsky.app/sift'
import {type Emoji} from '@emoji-mart/data'

import {type SearchFilters} from '#/screens/Search/searchParams'
import type * as bsky from '#/types/bsky'

export type AutocompleteProfile = {
  key: string
  type: 'profile'
  value: string
  profile: bsky.profile.AnyProfileView
}

export type AutocompleteTag = {
  key: string
  type: 'tag'
  value: string
  tag: string
}

export type AutocompleteEmoji = {
  key: string
  type: 'emoji'
  value: string
  emoji: Emoji
}

export type AutocompleteSearch = {
  key: string
  type: 'search'
  value: string
  /** Filters to restore when replaying a recent search. */
  filters?: SearchFilters
}

export type AutocompleteItem =
  AutocompleteProfile | AutocompleteTag | AutocompleteEmoji | AutocompleteSearch

export type AutocompleteItemType = AutocompleteItem['type']

export type AutocompleteItemProps = Parameters<
  Parameters<typeof Sift<AutocompleteItem>>[0]['render']
>[0]

export type AutocompleteApi = {
  query: string
  items: AutocompleteItem[]
  isFetching: boolean
  isError: boolean
}

/**
 * A locally cached dataset injected into autocomplete results. Items are
 * pre-hydrated and ordered most-relevant-first; array order encodes
 * recency and is used as the tie-break when ranking matches within a priority.
 */
export type LocalSource = {
  /** stable id, e.g. 'recents', 'convo-members', 'follows' */
  key: string
  items: AutocompleteItem[]
  /** Higher-priority sources rank first among matching local results. */
  priority?: number
}
