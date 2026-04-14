/*
 * Quick-react feature types. Keep this file free of runtime imports.
 */

export type ReactionEmoji = 'heart' | 'fire' | 'eyes' | 'joy'

export const REACTION_EMOJIS: readonly ReactionEmoji[] = [
  'heart',
  'fire',
  'eyes',
  'joy',
] as const

export type ReactionSurface = 'feed' | 'thread'

export type ReactionEntryPoint =
  | 'longPress'
  | 'hover'
  | 'click'
  | 'keyboard'
  | 'a11yAction'
  | 'chip'

export type ReactionRecord = {
  postUri: string
  emoji: ReactionEmoji
  updatedAt: number
}

export type ReactionsMap = Record<string, ReactionRecord>

export type ReactionsStore = {
  version: 1
  reactions: ReactionsMap
  lastPrunedAt?: number
}

export type FlagVariant = 'on' | 'off'

export type AnalyticsLogContext = 'FeedItem' | 'PostThreadItem'

export type BarOpenPayload = {
  uriHash: string
  surface: ReactionSurface
  entryPoint: ReactionEntryPoint
  flagVariant: FlagVariant
  logContext: AnalyticsLogContext
}

export type SelectPayload = {
  uriHash: string
  emoji: ReactionEmoji
  surface: ReactionSurface
  entryPoint: ReactionEntryPoint
  flagVariant: FlagVariant
  logContext: AnalyticsLogContext
  isChange: boolean
  previousEmoji?: ReactionEmoji
}

export type RemovePayload = {
  uriHash: string
  previousEmoji: ReactionEmoji
  surface: ReactionSurface
  entryPoint: ReactionEntryPoint
  flagVariant: FlagVariant
  logContext: AnalyticsLogContext
  removalMethod: 'retapSelected' | 'removeRow'
}
