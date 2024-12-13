import {AppBskyActorDefs} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function createSanitizedDisplayName(
  profile:
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
  noAt = false,
) {
  if (profile.displayName != null && profile.displayName !== '') {
    return sanitizeDisplayName(profile.displayName)
  } else {
    return sanitizeHandle(profile.handle, noAt ? '' : '@')
  }
}
