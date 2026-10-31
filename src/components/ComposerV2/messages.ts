import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {type LinkResolutionFailureCode} from '#/components/ComposerV2/store/linkResolver'
import {type UploadFailureCode} from '#/components/ComposerV2/store/types'

/*
 * Localized copy for the failure codes ComposerV2 state holds. State stores
 * codes only; callers turn them into text at the edge, inside or outside
 * React (`useLingui().i18n` in a component). These are plain functions over
 * `msg` descriptors because Lingui's `t` macro alias cannot be passed into
 * another function; see `DebugComposer/messages.ts`.
 */

/** User-facing copy for a failed upload; `detail` is the server's own text, if any. */
export function getUploadFailureMessage({
  failure,
  i18n,
}: {
  failure: {code: UploadFailureCode; detail?: string}
  i18n: I18n
}): string {
  switch (failure.code) {
    case 'invalid-image-dimensions':
      return i18n._(msg`The selected image has invalid dimensions.`)
    case 'unreadable-media':
      return i18n._(msg`The selected file could not be read.`)
    case 'unsupported-video-format':
      return i18n._(msg`The selected video uses an unsupported format.`)
    case 'invalid-video-dimensions':
      return i18n._(msg`The selected video has invalid dimensions.`)
    case 'video-too-long':
      return i18n._(msg`The selected video is too long.`)
    case 'video-too-large':
      return i18n._(
        msg`The selected video is too large. Please try again with a smaller file.`,
      )
    case 'video-upload-limit':
      return (
        failure.detail ||
        i18n._(
          msg`You have temporarily reached the limit for video uploads. Please try again later.`,
        )
      )
    case 'video-rejected':
      return i18n._(msg`The selected video could not be processed.`)
    case 'video-processing-failed':
    case 'video-failed':
      return i18n._(msg`The video could not be processed or uploaded.`)
    case 'network':
      return i18n._(
        msg`An upload failed. Please check your internet connection and try again.`,
      )
    case 'image-failed':
      return i18n._(msg`The image could not be processed or uploaded.`)
    default:
      return failure.code satisfies never
  }
}

/** User-facing copy for a link that failed to resolve. */
export function getLinkFailureMessage({
  code,
  i18n,
}: {
  code: LinkResolutionFailureCode
  i18n: I18n
}): string {
  switch (code) {
    case 'embedding-disabled':
      /* Same copy as the legacy composer, so it reuses its translations. */
      return i18n._(msg`This post's author has disabled quote posts.`)
    case 'unknown':
      return i18n._(msg`The link could not be resolved. Please try again.`)
    default:
      return code satisfies never
  }
}
