import {type AppBskyFeedPost} from '@atproto/api'

// Posts can only be edited for a few minutes after going up.
export const EDIT_WINDOW_MS = 5 * 60 * 1000

// Small speed bump against throwaway accounts: must be a week old to edit.
export const MIN_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Extra fields we write onto a post record on edit — not part of the lexicon. */
export type PostEditFields = {
  /** When the edit happened. Absent means never edited. */
  updatedAt?: string
  /** The original text, kept for history. */
  originalText?: string
}

export type EditedPostRecord = AppBskyFeedPost.Record & PostEditFields

export function getPostEditInfo(record: AppBskyFeedPost.Record): {
  isEdited: boolean
  updatedAt: string | undefined
  originalText: string | undefined
} {
  const {updatedAt, originalText} = record as EditedPostRecord
  return {
    isEdited: typeof updatedAt === 'string',
    updatedAt: typeof updatedAt === 'string' ? updatedAt : undefined,
    originalText: typeof originalText === 'string' ? originalText : undefined,
  }
}

/**
 * Whether the user can edit this post right now. These are UX guardrails only -
 * nothing stops another client from writing to the repo directly. If we can't
 * work out the account's age, we fail closed.
 */
export function canEditPost({
  isAuthor,
  createdAt,
  updatedAt,
  accountCreatedAt,
  now = Date.now(),
}: {
  isAuthor: boolean
  createdAt: string
  updatedAt: unknown
  accountCreatedAt: string | undefined
  now?: number
}): boolean {
  if (!isAuthor) return false
  if (typeof updatedAt === 'string') return false

  const accountAgeMs = accountCreatedAt
    ? now - Date.parse(accountCreatedAt)
    : NaN
  if (Number.isNaN(accountAgeMs) || accountAgeMs < MIN_ACCOUNT_AGE_MS) {
    return false
  }

  const postAgeMs = now - Date.parse(createdAt)
  return postAgeMs >= 0 && postAgeMs <= EDIT_WINDOW_MS
}
