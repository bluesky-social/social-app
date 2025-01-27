import {SerializedThreadDraft} from './schema'

export interface DraftEntry {
  // We'll be iterating drafts through this string, so it should be incremental
  // like TID rkeys.
  id: string
  createdAt: number
  state: SerializedThreadDraft
}

export interface UnknownDraftEntry {
  id: string
  createdAt: number
  state: unknown
}
