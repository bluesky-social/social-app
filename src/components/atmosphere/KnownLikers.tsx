import {View} from 'react-native'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {isActorHidden} from '#/screens/Atmosphere/ActivityTab/moderation'
import {AvatarStack} from '#/components/AvatarStack'
import {type app} from '#/lexicons'

type Profile = app.bsky.actor.defs.ProfileViewBasic

/**
 * People the viewer follows who liked something, leaving out the viewer and
 * moderated actors.
 */
export function useKnownLikers(
  view: {viewer?: {knownLikers?: Profile[]}},
  /**
   * Already moderated, shown ahead of the view's `knownLikers`, e.g. related
   * activity from the same stretch of timeline.
   */
  leadingProfiles: Profile[] = [],
) {
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()

  const seen = new Set<string>()
  return [
    ...leadingProfiles,
    ...(view.viewer?.knownLikers ?? []).filter(
      profile => moderationOpts && !isActorHidden(profile, moderationOpts),
    ),
  ].filter(profile => {
    if (profile.did === currentAccount?.did || seen.has(profile.did)) {
      return false
    }
    seen.add(profile.did)
    return true
  })
}

/** Avatars of up to three people the viewer follows who liked something. */
export function KnownLikers({
  view,
  leadingProfiles,
}: {
  view: {viewer?: {knownLikers?: Profile[]}}
  /** See `useKnownLikers`. */
  leadingProfiles?: Profile[]
}) {
  const profiles = useKnownLikers(view, leadingProfiles)
  if (profiles.length === 0) return null

  return (
    <View accessible={false} pointerEvents="none">
      <AvatarStack profiles={profiles.slice(0, 3)} size={20} overlap={6} />
    </View>
  )
}
