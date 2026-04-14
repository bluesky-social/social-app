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

/**
 * Display glyph for a given reaction emoji. Pure so it can be imported from
 * tests without pulling in the React/react-native tree.
 */
export function getEmojiGlyph(emoji: ReactionEmoji): string {
  switch (emoji) {
    case 'heart':
      return '\u2764\uFE0F' // ❤️
    case 'fire':
      return '\uD83D\uDD25' // 🔥
    case 'eyes':
      return '\uD83D\uDC40' // 👀
    case 'joy':
      return '\uD83D\uDE02' // 😂
  }
}

/** Stable identifier for each picker row — used for testIDs and a11y keys. */
export function getPickerRowLabelKey(emoji: ReactionEmoji): string {
  return `quickReact.picker.row.${emoji}`
}

export function getRemoveRowLabelKey(): string {
  return 'quickReact.picker.row.remove'
}

/**
 * Pure gate for whether QuickReactChip should render anything. Centralized
 * so tests can assert zero-footprint behavior (AC-15, AC-9).
 */
export function shouldRenderChip(args: {
  enabled: boolean
  emoji: ReactionEmoji | undefined
}): boolean {
  if (!args.enabled) return false
  if (!args.emoji) return false
  return true
}

/**
 * Build a stable non-localized label string for the chip. The real user-
 * facing label is produced via Lingui inside the component; this helper is
 * only used as a testable default + for accessibility fallback keys.
 */
export function buildChipAccessibilityLabel(emoji: ReactionEmoji): string {
  return `Reacted with ${emoji}. Double tap to change or remove.`
}

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
