import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import type * as bsky from '#/types/bsky'
import {useMySupportLink, useSupportLink} from '../storage'
import {SupportButton} from './SupportButton'
import {SupportLinkDialog} from './SupportLinkDialog'
import {SupportPill} from './SupportPill'

/**
 * The link the profile header should show, if any. Visitors get the saved
 * link or the bio-derived fallback; the owner only sees a button they've
 * actually set up.
 */
function useProfileSupportLink(profile: bsky.profile.AnyProfileView) {
  const {currentAccount} = useSession()
  const link = useSupportLink(profile)
  const {link: saved} = useMySupportLink()
  const isMe = currentAccount?.did === profile.did
  return {link: isMe ? saved : link, isMe}
}

/**
 * Whether `ProfileSupportButton` will render anything for this profile, so the
 * header can skip the row (and its spacing) when there's nothing to show.
 */
export function useShowsProfileSupportButton(
  profile: bsky.profile.AnyProfileView,
) {
  return !!useProfileSupportLink(profile).link
}

/**
 * Profile placement. Sits under the bio on its own row rather than beside
 * Follow: Follow is about the relationship, Support is about money, and the
 * two shouldn't compete. It hugs its content at chip size so it reads as an
 * offer, not a banner - the color does the work.
 *
 * Visitors get the interstitial; the owner gets the manage sheet.
 */
export function ProfileSupportButton({
  profile,
}: {
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const control = useDialogControl()
  const {link, isMe} = useProfileSupportLink(profile)
  if (!link) return null

  if (isMe) {
    return (
      <>
        <SupportPill
          uri={link.uri}
          label={l`Manage your Support button`}
          showProvider
          size="small"
          style={a.self_start}
          onPress={() => {
            playHaptic('Light')
            control.open()
          }}
        />
        <SupportLinkDialog control={control} />
      </>
    )
  }

  return (
    <SupportButton
      uri={link.uri}
      creator={profile}
      showProvider
      size="small"
      style={a.self_start}
    />
  )
}
