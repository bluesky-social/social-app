import {ModerationUI} from '@atproto/api'
import {describeModerationCause} from '../moderation'

// \u2705 = ✅
// \u2713 = ✓
// \u2714 = ✔
// \u2611 = ☑
const CHECK_MARKS_RE = /[\u2705\u2713\u2714\u2611]/gu

export function sanitizeDisplayName(
  str: string,
  moderation?: ModerationUI,
): string {
  if (moderation?.blur) {
    return `⚠${describeModerationCause(moderation.cause, 'account').name}`
  }
  if (typeof str === 'string') {
    return str.replace(CHECK_MARKS_RE, '').trim()
  }
  return ''
}

export function combinedDisplayName({
  handle,
  displayName,
}: {
  handle?: string
  displayName?: string
}): string {
  if (!handle) {
    return ''
  }
  return displayName
    ? `${sanitizeDisplayName(displayName)} (@${handle})`
    : `@${handle}`
}
