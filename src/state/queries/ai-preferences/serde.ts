import {
  AI_PREFERENCE_CATEGORIES,
  type AIPreferenceCategory,
  type AIPreferenceRecord,
  type AIPreferenceSet,
  type AIPreferenceTriStates,
  DEFAULT_TRI_STATES,
  type TriState,
} from './types'

export function fieldToTriState(field: {allow: boolean} | undefined): TriState {
  if (!field) return 'unset'
  return field.allow ? 'allow' : 'deny'
}

export function preferenceSetToTriStates(
  set: AIPreferenceSet | undefined,
): AIPreferenceTriStates {
  if (!set) return {...DEFAULT_TRI_STATES}
  return {
    training: fieldToTriState(set.training),
    inference: fieldToTriState(set.inference),
    syntheticContent: fieldToTriState(set.syntheticContent),
    embedding: fieldToTriState(set.embedding),
  }
}

export function recordToTriStates(
  record: AIPreferenceRecord | null | undefined,
): AIPreferenceTriStates {
  return preferenceSetToTriStates(record?.preferences)
}

export type Patch = Partial<Record<AIPreferenceCategory, TriState>>

export function applyPatch(
  prev: AIPreferenceSet | undefined,
  patch: Patch,
  now: string,
): AIPreferenceSet {
  const next: AIPreferenceSet = {...(prev ?? {})}
  for (const category of AI_PREFERENCE_CATEGORIES) {
    const value = patch[category]
    if (value === undefined) continue
    if (value === 'unset') {
      delete next[category]
    } else {
      next[category] = {
        allow: value === 'allow',
        updatedAt: now,
      }
    }
  }
  return next
}

export function buildGlobalRecord(
  prev: AIPreferenceRecord | null | undefined,
  patch: Patch,
  now: string = new Date().toISOString(),
): AIPreferenceRecord {
  const preferences = applyPatch(prev?.preferences, patch, now)
  return {
    $type: 'community.lexicon.preference.ai',
    updatedAt: now,
    scope: {$type: 'community.lexicon.preference.ai#globalScope'},
    preferences,
  }
}

export function mostRecentUpdatedAt(
  set: AIPreferenceSet | undefined,
): string | undefined {
  if (!set) return undefined
  let latest: string | undefined
  for (const category of AI_PREFERENCE_CATEGORIES) {
    const field = set[category]
    if (!field) continue
    if (!latest || field.updatedAt > latest) latest = field.updatedAt
  }
  return latest
}
