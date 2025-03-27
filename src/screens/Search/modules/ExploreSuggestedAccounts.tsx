import {memo} from 'react'
import {View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'

import {logger} from '#/logger'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

/**
 * Profile card for suggested accounts. Note: border is on the bottom edge
 */
let SuggestedProfileCard = ({
  profile,
  moderationOpts,
  recId,
  position,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  recId?: number
  position: number
}): React.ReactNode => {
  const t = useTheme()
  return (
    <ProfileCard.Link
      profile={profile}
      style={[a.flex_1]}
      onPress={() => {
        logger.metric('suggestedUser:press', {
          logContext: 'Explore',
          recId,
          position,
        })
      }}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            a.py_md,
            a.px_lg,
            a.border_b,
            t.atoms.border_contrast_low,
            a.flex_1,
            (hovered || pressed) && t.atoms.border_contrast_high,
          ]}>
          <ProfileCard.Outer>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                profile={profile}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.NameAndHandle
                profile={profile}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.FollowButton
                profile={profile}
                moderationOpts={moderationOpts}
                withIcon={false}
                logContext="ExploreSuggestedAccounts"
                onFollow={() => {
                  logger.metric('suggestedUser:follow', {
                    logContext: 'Explore',
                    location: 'Card',
                    recId,
                    position,
                  })
                }}
              />
            </ProfileCard.Header>
            <ProfileCard.Description profile={profile} numberOfLines={3} />
          </ProfileCard.Outer>
        </View>
      )}
    </ProfileCard.Link>
  )
}
SuggestedProfileCard = memo(SuggestedProfileCard)
export {SuggestedProfileCard}
