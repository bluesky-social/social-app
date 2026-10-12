import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfileQuery} from '#/state/queries/profile'

export function useSubjectPreviewProfile(did?: string) {
  const {t: l} = useLingui()
  const opts = useModerationOpts()
  const query = useProfileQuery({did})
  const profile = query.data
  const moderation =
    profile && opts ? moderateProfile(profile, opts) : undefined
  const name =
    profile && moderation
      ? createSanitizedDisplayName(
          profile,
          false,
          moderation.ui('displayName'),
        ) || l`Account`
      : l`Account`
  const handle =
    profile && moderation && !moderation.ui('displayName').blur
      ? sanitizeHandle(profile.handle, '@')
      : undefined

  return {query, profile, opts, moderation, name, handle}
}
