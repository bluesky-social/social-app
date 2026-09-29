import {useLingui} from '@lingui/react/macro'

import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate/types'
import {type ComposerV2PlanErrorCode} from '#/components/ComposerV2/planner'
import {type PostMediaUploadStatus} from '#/components/ComposerV2/store/types'

/*
 * Translated-string helpers for the tester.
 *
 * These are hooks on purpose: Lingui's `t` macro is only compiled where the
 * `useLingui()` macro binding is lexically in scope. Passing the macro alias
 * into another function as an ordinary parameter leaves those tagged
 * templates uncompiled, so they render empty strings at runtime. Each hook
 * binds the macro locally and returns a closure inside that binding's scope,
 * which keeps every branch compiled. Regression-tested against a real Lingui
 * runtime in __tests__/messages.test.tsx.
 */

/** Upload worker phase, as displayed by the media status line. */
export type UploadPhase = NonNullable<
  Extract<PostMediaUploadStatus, {state: 'uploading'}>['phase']
>

/** Short reply-gate summary for the current threadgate settings. */
export function useThreadgateSummary(): (
  settings: ThreadgateAllowUISetting[],
) => string {
  const {t: l} = useLingui()
  return settings => {
    if (settings.some(setting => setting.type === 'everybody')) {
      return l`replies: everybody`
    }
    if (settings.some(setting => setting.type === 'nobody')) {
      return l`replies: nobody`
    }
    if (settings.length === 0) {
      return l`replies: unknown rules only`
    }
    const parts = settings.map(setting => {
      switch (setting.type) {
        case 'mention':
          return l`mentioned`
        case 'following':
          return l`following`
        case 'followers':
          return l`followers`
        case 'list':
          return l`list`
        default:
          return setting.type
      }
    })
    return l`replies: ${parts.join(', ')}`
  }
}

/** Static, actionable guidance per planner error code. */
export function usePlanErrorHint(): (code: ComposerV2PlanErrorCode) => string {
  const {t: l} = useLingui()
  return code => {
    switch (code) {
      case 'empty-composition':
        return l`Add text, tags, or an attachment to at least one post.`
      case 'empty-post-requires-confirmation':
        return l`An empty post sits inside the thread. Confirm skipping it, remove it, or add content.`
      case 'missing-alt-text':
        return l`Add alt text to the flagged media, or disable the alt text preflight toggle.`
      case 'attachment-not-ready':
        return l`Wait for pending resolution or uploads to finish, then plan again.`
      case 'media-failed':
        return l`Retry or remove the failed attachment, then plan again.`
      case 'media-upload-failed':
        return l`A blob upload failed during planning. Check the connection and plan again.`
      case 'reply-resolution-failed':
        return l`The reply parent could not be read from the AppView.`
      case 'rich-text-resolution-failed':
        return l`Mentions or links could not be resolved. Check the text and try again.`
      case 'missing-dependency':
        return l`A required client dependency is missing for this account.`
      case 'unsupported-attachment':
        return l`This attachment combination cannot be represented in a post record.`
      case 'invalid-snapshot':
      case 'invalid-record-key':
      case 'invalid-record':
      case 'invalid-write-input':
        return l`The generated records failed validation. This is a bug worth reporting.`
      case 'unexpected-error':
        return l`Planning failed unexpectedly. Try again.`
    }
  }
}

/** Label for one live upload worker phase. */
export function useUploadPhaseLabel(): (phase: UploadPhase) => string {
  const {t: l} = useLingui()
  return phase => {
    switch (phase) {
      case 'validating':
        return l`Validating`
      case 'compressing':
        return l`Compressing`
      case 'uploading':
        return l`Uploading`
      case 'processing':
        return l`Processing`
      case 'captions':
        return l`Uploading captions`
    }
  }
}
