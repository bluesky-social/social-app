export const AI_PREFERENCE_NSID = 'community.lexicon.preference.ai'

export type AIPreferenceCategory =
  | 'training'
  | 'inference'
  | 'syntheticContent'
  | 'embedding'

export const AI_PREFERENCE_CATEGORIES: AIPreferenceCategory[] = [
  'training',
  'inference',
  'syntheticContent',
  'embedding',
]

export type TriState = 'allow' | 'deny' | 'unset'

export type AIPreferenceField = {
  allow: boolean
  updatedAt: string
}

export type AIGlobalScope = {
  $type: 'community.lexicon.preference.ai#globalScope'
}

export type AIEntityScope = {
  $type: 'community.lexicon.preference.ai#entityScope'
  entity: string
}

export type AICollectionScope = {
  $type: 'community.lexicon.preference.ai#collectionScope'
  collection: string
}

export type AIPreferenceScope =
  | AIGlobalScope
  | AIEntityScope
  | AICollectionScope

export type AIPreferenceSet = {
  training?: AIPreferenceField
  inference?: AIPreferenceField
  syntheticContent?: AIPreferenceField
  embedding?: AIPreferenceField
}

export type AIPreferenceRecord = {
  $type: 'community.lexicon.preference.ai'
  updatedAt: string
  scope: AIPreferenceScope
  preferences: AIPreferenceSet
}

export type AIPreferenceTriStates = Record<AIPreferenceCategory, TriState>

export const DEFAULT_TRI_STATES: AIPreferenceTriStates = {
  training: 'unset',
  inference: 'unset',
  syntheticContent: 'unset',
  embedding: 'unset',
}
