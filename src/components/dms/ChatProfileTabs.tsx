import {useCallback, useState} from 'react'
import {type LayoutChangeEvent, type ScrollView, View} from 'react-native'
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated'
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
  const containerSize = useSharedValue(0)
  const contentSize = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const syncScrollState = useSharedValue<'synced' | 'unsynced' | 'needs-sync'>(
    'synced',
  )

  const [containerWidth, setContainerWidth] = useState(0)

  useAnimatedReaction(
    () => containerSize.get(),
    latestValue => {
      runOnJS(setContainerWidth)(latestValue)
    },
    [containerWidth],
  )

  return (
    <View testID={testID} accessibilityRole="tablist" style={[t.atoms.bg]}>
      <DraggableScrollView
        ref={scrollElRef}
        testID={`${testID}-selector`}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onLayout={e => {
          containerSize.set(e.nativeEvent.layout.width)
        }}
        onScroll={e => {
          scrollX.set(Math.round(e.nativeEvent.contentOffset.x))
        }}
        onScrollBeginDrag={() => {
          // Remember that you've manually messed with the tabbar scroll.
          // This will disable auto-adjustment until after next pager swipe or item tap.
          syncScrollState.set('unsynced')
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
  const layouts = useSharedValue<{x: number; width: number}[]>([])
  const moderationOpts = useModerationOpts()

  const moderation = moderateProfile(profile, moderationOpts!)
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  const onItemLayout = useCallback(
    (i: number, layout: {x: number; width: number}) => {
      'worklet'
      layouts.modify(ls => {
        ls[i] = layout
        return ls
      })
    },
    [layouts],
  )

  const handleLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      runOnUI(onItemLayout)(index, e.nativeEvent.layout)
    },
    [onItemLayout],
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
      ]}
      onLayout={handleLayout(index)}>
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
