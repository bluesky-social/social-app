import {useCallback, useEffect} from 'react'
import {type ScrollView, View} from 'react-native'
import Animated, {useAnimatedRef, useSharedValue} from 'react-native-reanimated'
import {moderateProfile} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {DraggableScrollView} from '#/view/com/pager/DraggableScrollView'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

type Props = {
  testID?: string
  profiles: bsky.profile.AnyProfileView[]
  onRemove?: (did: string) => void
}

export function ChatProfileTabs({testID, profiles, onRemove}: Props) {
  const t = useTheme()
  const scrollElRef = useAnimatedRef<ScrollView>()
  const contentSize = useSharedValue(0)
  const scrollX = useSharedValue(0)

  useEffect(() => {
    requestAnimationFrame(() => {
      // Scroll to the end of the list when `profiles` changes.
      scrollElRef.current?.scrollToEnd({animated: true})
    })
  }, [profiles, scrollElRef])

  return (
    <View testID={testID} accessibilityRole="list" style={[t.atoms.bg]}>
      <DraggableScrollView
        ref={scrollElRef}
        testID={`${testID}-selector`}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          scrollX.set(Math.round(e.nativeEvent.contentOffset.x))
        }}>
        <Animated.View
          style={[
            a.flex_row,
            a.flex_grow,
            a.gap_sm,
            a.align_center,
            a.justify_start,
          ]}
          onLayout={e => {
            contentSize.set(e.nativeEvent.layout.width)
          }}>
          {profiles.map((profile, index) => (
            <Tab
              key={profile.did}
              testID={testID}
              index={index}
              profile={profile}
              total={profiles.length}
              onRemove={onRemove}
            />
          ))}
        </Animated.View>
      </DraggableScrollView>
    </View>
  )
}

function Tab({
  testID,
  index,
  profile,
  total,
  onRemove,
}: {
  testID?: string
  index: number
  profile: bsky.profile.AnyProfileView
  total: number
  onRemove?: (did: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()

  const moderation = moderateProfile(profile, moderationOpts!)
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  const onPressItem = useCallback(
    (did: string) => {
      onRemove?.(did)
    },
    [onRemove],
  )

  return (
    <View
      testID={`${testID}-selector-${profile.did}`}
      style={[
        a.flex_row,
        a.align_center,
        a.border,
        a.justify_center,
        a.rounded_lg,
        a.pl_xs,
        a.pr_sm,
        a.py_xs,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        index === 0 ? a.ml_lg : index === total - 1 ? a.mr_lg : null,
      ]}>
      {moderationOpts ? (
        <>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
            size={24}
            disabledPreview
          />
          <View style={[a.flex_row, a.align_center, a.max_w_full, a.ml_xs]}>
            <Text
              emoji
              style={[
                a.text_sm,
                a.font_normal,
                a.leading_snug,
                a.self_start,
                a.flex_shrink,
                t.atoms.text,
              ]}
              numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </>
      ) : (
        <>
          <ProfileCard.AvatarPlaceholder size={24} />
          <ProfileCard.NamePlaceholder />
        </>
      )}
      <Button
        hitSlop={HITSLOP_10}
        label={l`Remove ${displayName} from group chat`}
        style={[a.ml_xs]}
        onPress={() => onPressItem(profile.did)}>
        {({hovered, pressed, focused}) => (
          <XIcon
            size="sm"
            style={[
              hovered || pressed || focused
                ? t.atoms.text
                : t.atoms.text_contrast_high,
            ]}
          />
        )}
      </Button>
    </View>
  )
}
