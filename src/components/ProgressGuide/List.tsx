import {type StyleProp, View, type ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useSession} from '#/state/session'
import {
  useProgressGuide,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useLayoutBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {TimesLarge_Stroke2_Corner0_Rounded as Times} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {FollowDialog} from './FollowDialog'
import {ProgressGuideTask} from './Task'

const TOTAL_AVATARS = 10

export function ProgressGuideList({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {rightNavVisible} = useLayoutBreakpoints()
  const {currentAccount} = useSession()
  const followProgressGuide = useProgressGuide('follow-10')
  const followAndLikeProgressGuide = useProgressGuide('like-10-and-follow-7')
  const guide = followProgressGuide || followAndLikeProgressGuide
  const {endProgressGuide} = useProgressGuideControls()
  const {data: follows} = useProfileFollowsQuery(currentAccount?.did, {
    limit: TOTAL_AVATARS,
  })

  const actualFollowsCount = follows?.pages?.[0]?.follows?.length ?? 0

  // Hide if user already follows 10+ people
  if (guide?.guide === 'follow-10' && actualFollowsCount >= TOTAL_AVATARS) {
    return null
  }

  // Inline layout when left nav visible but no right sidebar (800-1100px)
  const inlineLayout = gtPhone && !rightNavVisible

  if (guide) {
    return (
      <View
        style={[
          a.flex_col,
          a.gap_md,
          a.rounded_md,
          t.atoms.bg_contrast_25,
          a.p_lg,
          style,
        ]}>
        <View style={[a.flex_row, a.align_center, a.justify_between]}>
          <Text style={[t.atoms.text, a.font_semi_bold, a.text_md]}>
            <Trans>Follow 10 people to get started</Trans>
          </Text>
          <Button
            variant="ghost"
            size="tiny"
            color="secondary"
            shape="round"
            label={_(msg`Dismiss getting started guide`)}
            onPress={endProgressGuide}
            style={[a.bg_transparent, {marginTop: -6, marginRight: -6}]}>
            <ButtonIcon icon={Times} size="xs" />
          </Button>
        </View>
        {guide.guide === 'follow-10' && (
          <View
            style={[
              inlineLayout
                ? [
                    a.flex_row,
                    a.flex_wrap,
                    a.align_center,
                    a.justify_between,
                    a.gap_sm,
                  ]
                : a.flex_col,
              !inlineLayout && a.gap_md,
            ]}>
            <StackedAvatars follows={follows?.pages?.[0]?.follows} />
            <FollowDialog guide={guide} showArrow={inlineLayout} />
          </View>
        )}
        {guide.guide === 'like-10-and-follow-7' && (
          <>
            <ProgressGuideTask
              current={guide.numLikes + 1}
              total={10 + 1}
              title={_(msg`Like 10 posts`)}
              subtitle={_(msg`Teach our algorithm what you like`)}
            />
            <ProgressGuideTask
              current={guide.numFollows + 1}
              total={7 + 1}
              title={_(msg`Follow 7 accounts`)}
              subtitle={_(msg`Bluesky is better with friends!`)}
            />
          </>
        )}
      </View>
    )
  }
  return null
}

function StackedAvatars({follows}: {follows?: bsky.profile.AnyProfileView[]}) {
  const t = useTheme()
  const {centerColumnOffset} = useLayoutBreakpoints()

  // Smaller avatars for narrower viewport
  const avatarSize = centerColumnOffset ? 30 : 37
  const overlap = centerColumnOffset ? 9 : 11
  const iconSize = centerColumnOffset ? 14 : 18

  // Use actual follows count, not the guide's event counter
  const followedAvatars = follows?.slice(0, TOTAL_AVATARS) ?? []
  const remainingSlots = TOTAL_AVATARS - followedAvatars.length

  // Total width calculation: first avatar + (remaining * visible portion)
  const totalWidth = avatarSize + (TOTAL_AVATARS - 1) * (avatarSize - overlap)

  return (
    <View style={[a.flex_row, a.self_start, {width: totalWidth}]}>
      {/* Show followed user avatars */}
      {followedAvatars.map((follow, i) => (
        <View
          key={follow.did}
          style={[
            a.rounded_full,
            {
              marginLeft: i === 0 ? 0 : -overlap,
              zIndex: TOTAL_AVATARS - i,
              borderWidth: 2,
              borderColor: t.atoms.bg_contrast_25.backgroundColor,
            },
          ]}>
          <UserAvatar
            type="user"
            size={avatarSize - 4}
            avatar={follow.avatar}
          />
        </View>
      ))}
      {/* Show placeholder avatars for remaining slots */}
      {Array(remainingSlots)
        .fill(0)
        .map((_, i) => (
          <View
            key={`placeholder-${i}`}
            style={[
              a.align_center,
              a.justify_center,
              a.rounded_full,
              t.atoms.bg_contrast_100,
              {
                width: avatarSize,
                height: avatarSize,
                marginLeft:
                  followedAvatars.length === 0 && i === 0 ? 0 : -overlap,
                zIndex: TOTAL_AVATARS - followedAvatars.length - i,
                borderWidth: 2,
                borderColor: t.atoms.bg_contrast_25.backgroundColor,
              },
            ]}>
            <PersonIcon
              width={iconSize}
              height={iconSize}
              fill={t.atoms.text_contrast_low.color}
            />
          </View>
        ))}
    </View>
  )
}
