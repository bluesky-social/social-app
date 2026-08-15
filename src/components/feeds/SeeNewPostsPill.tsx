import {useCallback} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {
  FadeInDown,
  FadeOut,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useShellLayout} from '#/state/shell/shell-layout'
import {atoms as a, useBreakpoints, useLayoutBreakpoints, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowTop_Stroke2_Corner0_Rounded as ArrowUpIcon} from '#/components/icons/Arrow'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * Floating pill shown near the top of a feed after the last read position was
 * restored, telling the user there are newer posts loaded above. Pressing it
 * scrolls to the top of the feed.
 */
export function SeeNewPostsPill({
  onPress: onPressInner,
  count = 0,
  topOffset = 0,
  headerMode,
  attached = false,
}: {
  onPress: () => void
  /**
   * Number of new posts above the user. Zero (unknown) falls back to a
   * generic label.
   */
  count?: number
  /**
   * Height of the floating feed header the pill must clear. Pass the same
   * headerOffset used by the feed list.
   */
  topOffset?: number
  /**
   * The home header's minimal-shell mode, passed in as a prop because the
   * pill renders in a Portal outside HomeHeaderModeProvider.
   */
  headerMode: SharedValue<number>
  /**
   * When set, the pill is rendered inside the home header (via
   * HomeHeaderPortal) and anchors itself directly below the sticky tab bar
   * instead of using fixed viewport positioning. Larger web layouts only.
   */
  attached?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  /*
   * On mobile (and native) topOffset is the floating header height, so a
   * small margin below it is enough. On larger web breakpoints the header
   * offset is 0 but the tab bar is sticky, so clear its height instead.
   */
  const top = topOffset > 0 ? topOffset + 12 : gtMobile ? 64 : 12

  const {headerHeight} = useShellLayout()
  const {top: topInset} = useSafeAreaInsets()
  const headerPinnedHeight = IS_LIQUID_GLASS ? topInset : 0

  /*
   * On mobile the floating header minimizes away as the user scrolls, so
   * follow its translation to stay just below it - but stop at the safe
   * area inset so the pill never sits under the status bar.
   */
  const followHeaderStyle = useAnimatedStyle(() => {
    if (topOffset === 0) {
      return {transform: [{translateY: 0}]}
    }
    const translateY = interpolate(
      headerMode.get(),
      [0, 1],
      [0, headerPinnedHeight - headerHeight.get()],
    )
    const minTop = topInset + 12
    return {
      transform: [{translateY: Math.max(translateY, minTop - top)}],
    }
  })

  const onPress = useCallback(() => {
    scheduleOnRN(playHaptic)
    onPressInner?.()
  }, [onPressInner, playHaptic])

  return (
    <View
      style={[
        a.z_20,
        /*
         * Attached mode anchors the pill directly below its parent (the
         * sticky tab bar), which is already column-width, so centering is
         * trivial. Otherwise, on web the pill is fixed and must be centered
         * on the content column, not the viewport - the column shifts at
         * some widths (nav rail, tablet offset), so mirror Layout's
         * WebCenterBorders centering. On native the feed spans the screen,
         * so a full-width absolute container can simply center its child.
         */
        attached
          ? [
              a.absolute,
              a.w_full,
              a.align_center,
              {top: '100%' as const, paddingTop: 12},
            ]
          : IS_WEB
            ? [
                a.fixed,
                {
                  top,
                  left: '50%',
                  transform: [
                    {translateX: '-50%'},
                    {
                      translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0,
                    },
                    ...a.scrollbar_offset.transform,
                  ],
                },
              ]
            : [a.absolute, a.w_full, a.align_center, {top}],
        {
          // Don't prevent scrolling in this area _except_ for in the pill itself
          pointerEvents: 'box-none',
        },
      ]}>
      {/*
       * The header-follow translation lives on its own wrapper because both
       * the container (web centering) and the pressable (press scale) already
       * use transforms of their own.
       */}
      <Animated.View style={[followHeaderStyle, {pointerEvents: 'box-none'}]}>
        <AnimatedPressable
          testID="seeNewPostsPill"
          accessibilityRole="button"
          accessibilityLabel={
            count > 0
              ? plural(count, {one: '# new post', other: '# new posts'})
              : l`See new posts`
          }
          accessibilityHint={l`Scrolls to the top of the feed`}
          style={[
            a.flex_row,
            a.align_center,
            a.justify_center,
            a.gap_xs,
            a.rounded_full,
            a.shadow_sm,
            a.border,
            a.px_md,
            a.py_sm,
            t.atoms.border_contrast_low,
            {
              backgroundColor: t.palette.primary_50,
              pointerEvents: 'box-only',
            },
          ]}
          entering={FadeInDown.springify().damping(18).stiffness(220)}
          exiting={FadeOut.duration(150)}
          onPress={onPress}
          onPointerEnter={onHoverIn}
          onPointerLeave={onHoverOut}>
          <SubtleHover hover={hovered} style={[a.rounded_full]} />
          <ArrowUpIcon
            size="sm"
            style={[a.z_10, {color: t.palette.primary_600}]}
          />
          <Text style={[a.z_10, a.font_bold, {color: t.palette.primary_600}]}>
            {count > 0 ? (
              <Plural value={count} one="# new post" other="# new posts" />
            ) : (
              <Trans>See new posts</Trans>
            )}
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  )
}
