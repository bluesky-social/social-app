import {AppBskyActorDefs} from '@atproto/api'
import {I18n} from '@lingui/core'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function createSanitizedDisplayName(
  i18n: I18n,
  profile:
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
  noAt = false,
) {
  if (profile.displayName != null && profile.displayName !== '') {
    return sanitizeDisplayName(profile.displayName)
  } else {
    return sanitizeHandle(i18n, profile.handle, noAt ? '' : '@')
  }
}
