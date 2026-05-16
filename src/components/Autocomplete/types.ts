import {type Sift} from '@bsky.app/sift'
import {type Emoji} from '@emoji-mart/data'

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
}

export type AutocompleteItem =
  | AutocompleteProfile
  | AutocompleteTag
  | AutocompleteEmoji
  | AutocompleteSearch

export type AutocompleteItemType = AutocompleteItem['type']

export type AutocompleteItemProps = Parameters<
  Parameters<typeof Sift<AutocompleteItem>>[0]['render']
>[0]

export type AutocompleteApi = {
  query: string
  items: AutocompleteItem[]
}
