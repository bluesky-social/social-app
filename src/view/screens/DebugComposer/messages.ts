import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'
import {type ThreadPlanErrorCode} from '#/components/ComposerV2/planner'

/*
 * Plain-English copy for the tester. Untranslated on purpose: this is a dev
 * tool. Product copy (upload and link failures) comes from
 * `#/components/ComposerV2/messages` and stays translated.
 */

/** Short reply-gate summary for the current threadgate settings. */
export function threadgateSummary(settings: ThreadgateAllowUISetting[]) {
  if (settings.some(setting => setting.type === 'everybody')) {
    return 'replies: everybody'
  }
  if (settings.some(setting => setting.type === 'nobody')) {
    return 'replies: nobody'
  }
  if (settings.length === 0) {
    return 'replies: unknown rules only'
  }
  const parts = settings.map(setting => {
    switch (setting.type) {
      case 'mention':
        return 'mentioned'
      case 'following':
        return 'following'
      case 'followers':
        return 'followers'
      case 'list':
        return 'list'
      default:
        return setting.type
    }
  })
  return `replies: ${parts.join(', ')}`
}

/** Static, actionable guidance per planner error code. */
export function planErrorHint(code: ThreadPlanErrorCode) {
  switch (code) {
    case 'empty-composition':
      return 'Add text, tags, or an attachment to at least one post.'
    case 'empty-post-requires-confirmation':
      return 'An empty post sits inside the thread. Confirm skipping it, remove it, or add content.'
    case 'missing-alt-text':
      return 'Add alt text to the flagged media, or disable the alt text preflight toggle.'
    case 'attachment-not-ready':
      return 'Wait for pending resolution or uploads to finish, then plan again.'
    case 'media-failed':
      return 'Retry or remove the failed attachment, then plan again.'
    case 'media-upload-failed':
      return 'A blob upload failed during planning. Check the connection and plan again.'
    case 'reply-resolution-failed':
      return 'The reply parent could not be read from the AppView.'
    case 'reply-not-found':
      return 'The post you’re replying to has been deleted.'
    case 'rich-text-resolution-failed':
      return 'Mentions or links could not be resolved. Check the text and try again.'
    case 'text-too-long':
      return `A post is over the ${MAX_GRAPHEME_LENGTH} character limit. Shorten it and plan again.`
    case 'missing-dependency':
      return 'A required client dependency is missing for this account.'
    case 'unsupported-attachment':
      return 'This attachment combination cannot be represented in a post record.'
    case 'invalid-snapshot':
    case 'invalid-record-key':
    case 'invalid-record':
    case 'invalid-write-input':
      return 'The generated records failed validation. This is a bug worth reporting.'
    case 'unexpected-error':
      return 'Planning failed unexpectedly. Try again.'
  }
}
