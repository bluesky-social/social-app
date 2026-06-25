import {useMemo} from 'react'
import {
  type AppBskyActorDefs,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyLabelerDefs,
  AtpAgent,
  type ComAtprotoLabelDefs,
  type InterpretedLabelValueDefinition,
  LABELS,
  type ModerationCause,
  type ModerationOpts,
  type ModerationUI,
} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type AppModerationCause} from '#/components/Pills'

export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn'] as const
export const OTHER_SELF_LABELS = ['graphic-media'] as const
export const SELF_LABELS = [
  ...ADULT_CONTENT_LABELS,
  ...OTHER_SELF_LABELS,
] as const

export type AdultSelfLabel = (typeof ADULT_CONTENT_LABELS)[number]
export type OtherSelfLabel = (typeof OTHER_SELF_LABELS)[number]
export type SelfLabel = (typeof SELF_LABELS)[number]

export function getModerationCauseKey(
  cause: ModerationCause | AppModerationCause,
): string {
  const source =
    cause.source.type === 'labeler'
      ? cause.source.did
      : cause.source.type === 'list'
        ? cause.source.list.uri
        : 'user'
  if (cause.type === 'label') {
    return `label:${cause.label.val}:${source}`
  }
  return `${cause.type}:${source}`
}

export function isJustAMute(modui: ModerationUI): boolean {
  return modui.filters.length === 1 && modui.filters[0].type === 'muted'
}

export function moduiContainsHideableOffense(modui: ModerationUI): boolean {
  const label = modui.filters.at(0)
  if (label && label.type === 'label') {
    return labelIsHideableOffense(label.label)
  }
  return false
}

export function labelIsHideableOffense(
  label: ComAtprotoLabelDefs.Label,
): boolean {
  return ['!hide', '!takedown'].includes(label.val)
}

export function getLabelingServiceTitle({
  displayName,
  handle,
}: {
  displayName?: string
  handle: string
}) {
  return displayName
    ? sanitizeDisplayName(displayName)
    : sanitizeHandle(handle, '@')
}

export function lookupLabelValueDefinition(
  labelValue: string,
  customDefs: InterpretedLabelValueDefinition[] | undefined,
): InterpretedLabelValueDefinition | undefined {
  let def
  if (!labelValue.startsWith('!') && customDefs) {
    def = customDefs.find(d => d.identifier === labelValue)
  }
  if (!def) {
    def = LABELS[labelValue as keyof typeof LABELS]
  }
  return def
}

export function isAppLabeler(
  labeler:
    | string
    | AppBskyLabelerDefs.LabelerView
    | AppBskyLabelerDefs.LabelerViewDetailed,
): boolean {
  if (typeof labeler === 'string') {
    return AtpAgent.appLabelers.includes(labeler)
  }
  return AtpAgent.appLabelers.includes(labeler.creator.did)
}

export function isLabelerSubscribed(
  labeler:
    | string
    | AppBskyLabelerDefs.LabelerView
    | AppBskyLabelerDefs.LabelerViewDetailed,
  modOpts: ModerationOpts,
) {
  labeler = typeof labeler === 'string' ? labeler : labeler.creator.did
  if (isAppLabeler(labeler)) {
    return true
  }
  return modOpts.prefs.labelers.find(l => l.did === labeler)
}

export type Subject =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export function useLabelSubject({label}: {label: ComAtprotoLabelDefs.Label}): {
  subject: Subject
} {
  return useMemo(() => {
    const {cid, uri} = label
    if (cid) {
      return {
        subject: {
          uri,
          cid,
        },
      }
    } else {
      return {
        subject: {
          did: uri,
        },
      }
    }
  }, [label])
}

export function unique(
  value: ModerationCause,
  index: number,
  array: ModerationCause[],
) {
  return (
    array.findIndex(
      item => getModerationCauseKey(item) === getModerationCauseKey(value),
    ) === index
  )
}

function getActiveMutedWords(
  mutedWords: AppBskyActorDefs.MutedWord[],
  viewer: {following?: string} | undefined,
  now: Date,
  target: string,
): string[] {
  return mutedWords
    .filter(
      w =>
        !(w.expiresAt && new Date(w.expiresAt) < now) &&
        !(w.actorTarget === 'exclude-following' && viewer?.following) &&
        w.targets.includes(target),
    )
    .map(w => w.value.toLowerCase())
}

// For backward compat: words saved before the 'profiles' target existed used
// 'content' to cover both post text and profile name/bio/alt filtering.
function getActiveMutedContentWords(
  mutedWords: AppBskyActorDefs.MutedWord[],
  viewer: {following?: string} | undefined,
  now: Date,
): string[] {
  return getActiveMutedWords(mutedWords, viewer, now, 'content')
}

function getActiveMutedProfileWords(
  mutedWords: AppBskyActorDefs.MutedWord[],
  viewer: {following?: string} | undefined,
  now: Date,
): string[] {
  // Include 'content' words for backward compat with words saved before the
  // explicit 'profiles' target was introduced.
  const byProfile = getActiveMutedWords(mutedWords, viewer, now, 'profiles')
  const byContent = getActiveMutedWords(mutedWords, viewer, now, 'content')
  return [...new Set([...byProfile, ...byContent])]
}

export function hasMutedWordInText({
  mutedWords,
  text,
  author,
}: {
  mutedWords: AppBskyActorDefs.MutedWord[]
  text: string
  author?: {viewer?: {following?: string}}
}): boolean {
  if (!mutedWords.length || !text) return false
  const lowerText = text.toLowerCase()
  const active = getActiveMutedContentWords(
    mutedWords,
    author?.viewer,
    new Date(),
  )
  return active.some(v => lowerText.includes(v))
}

export function hasMutedWordInAuthorName({
  mutedWords,
  author,
}: {
  mutedWords: AppBskyActorDefs.MutedWord[]
  author: {
    displayName?: string
    description?: string
    viewer?: {following?: string}
  }
}): boolean {
  if (!mutedWords.length) return false
  const displayName = author.displayName?.toLowerCase() ?? ''
  const description = author.description?.toLowerCase() ?? ''
  if (!displayName && !description) return false
  const active = getActiveMutedProfileWords(
    mutedWords,
    author.viewer,
    new Date(),
  )
  return active.some(v => displayName.includes(v) || description.includes(v))
}

export function hasMutedWordInPostAltText({
  mutedWords,
  post,
}: {
  mutedWords: AppBskyActorDefs.MutedWord[]
  post: AppBskyFeedDefs.PostView
}): boolean {
  if (!mutedWords.length) return false
  const {embed} = post
  if (!embed) return false
  const active = getActiveMutedProfileWords(
    mutedWords,
    post.author.viewer,
    new Date(),
  )
  if (!active.length) return false
  const matchesAlt = (alt: string) => {
    const lower = alt.toLowerCase()
    return active.some(v => lower.includes(v))
  }
  if (AppBskyEmbedImages.isView(embed)) {
    return embed.images.some(img => img.alt && matchesAlt(img.alt))
  }
  if (
    AppBskyEmbedRecordWithMedia.isView(embed) &&
    AppBskyEmbedImages.isView(embed.media)
  ) {
    return embed.media.images.some(img => img.alt && matchesAlt(img.alt))
  }
  return false
}

export function hasMutedWordInEmbeddedPost({
  mutedWords,
  post,
}: {
  mutedWords: AppBskyActorDefs.MutedWord[]
  post: AppBskyFeedDefs.PostView
}): boolean {
  if (!mutedWords.length) return false
  const {embed} = post
  if (!embed) return false
  // Get non-expired 'embeds' words without applying exclude-following yet,
  // since we need to check it against the embedded post's author, not the
  // outer (quoting) post's author.
  const now = new Date()
  const candidates = mutedWords.filter(
    w =>
      !(w.expiresAt && new Date(w.expiresAt) < now) &&
      w.targets.includes('embeds'),
  )
  if (!candidates.length) return false

  const checkViewRecord = (record: AppBskyEmbedRecord.ViewRecord): boolean => {
    // Apply exclude-following based on the embedded post's author.
    const active = candidates
      .filter(
        w =>
          !(
            w.actorTarget === 'exclude-following' &&
            record.author.viewer?.following
          ),
      )
      .map(w => w.value.toLowerCase())
    if (!active.length) return false
    const text = (record.value as AppBskyFeedPost.Record)?.text ?? ''
    if (text) {
      const lowerText = text.toLowerCase()
      if (active.some(v => lowerText.includes(v))) return true
    }
    const displayName = record.author.displayName?.toLowerCase() ?? ''
    return displayName ? active.some(v => displayName.includes(v)) : false
  }

  if (AppBskyEmbedRecord.isView(embed)) {
    return (
      AppBskyEmbedRecord.isViewRecord(embed.record) &&
      checkViewRecord(embed.record)
    )
  }
  if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return (
      AppBskyEmbedRecord.isViewRecord(embed.record.record) &&
      checkViewRecord(embed.record.record)
    )
  }
  return false
}
