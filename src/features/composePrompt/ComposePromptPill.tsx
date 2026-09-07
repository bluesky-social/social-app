import {useState} from 'react'
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {useLingui} from '@lingui/react/macro'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useMinimalShellMode} from '#/state/shell/minimal-mode'
import {useShellLayout} from '#/state/shell/shell-layout'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, ios, tokens, useTheme, utils} from '#/alf'
import {Button} from '#/components/Button'
import {GlassView, IS_GLASS_AVAILABLE} from '#/components/GlassView'
import {Camera_Stroke2_Corner0_Rounded as CameraIcon} from '#/components/icons/Camera'
import {Image_Stroke2_Corner2_Rounded as ImageIcon} from '#/components/icons/Image'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {useComposePromptState} from './context'
import {useComposePromptMedia} from './useComposePromptMedia'

const AVATAR_SIZE = 32
/**
 * Horizontal inset of the pill while the bottom bar is showing. Once the bar
 * hides, the inset grows to the bottom safe area for equal spacing, so the
 * closer this is to that, the less the pill changes width on the way down.
 */
const SIDE_MARGIN_UP = tokens.space.lg
/**
 * Gap between the pill and the top of the bottom bar.
 */
const GAP_ABOVE_BAR = tokens.space._2xs

/**
 * The compose pill that lives in the bottom bar. Screens opt in with
 * `useComposePromptForScreen`; the pill fades with their presence, and when
 * the bar hides it drops into the bar's space rather than leaving with it.
 */
export function ComposePromptPill() {
  const {visibility, config} = useComposePromptState()
  const {footerMode} = useMinimalShellMode()
  const {footerHeight} = useShellLayout()
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const playHaptic = useHaptics()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {onPressGallery, onPressCamera} = useComposePromptMedia(config?.open)

  /*
   * Liquid Glass materializes and dissolves through the system's own
   * animation when the style flips, so the glass follows a boolean while the
   * contents follow the presence value frame by frame.
   */
  const [glassVisible, setGlassVisible] = useState(false)
  useAnimatedReaction(
    () => visibility.get() > 0.5,
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setGlassVisible, current)
      }
    },
  )

  /*
   * The pill sits just above the bar and follows it down as it hides. In the
   * down state it is inset from the left, right and bottom edges by the same
   * amount, so that its corners are concentric with the device bevels.
   */
  const downMargin = Math.max(insets.bottom, tokens.space.lg)
  const wrapperStyle = useAnimatedStyle(() => {
    const mode = footerMode.get()
    const upBottom = footerHeight.get() + GAP_ABOVE_BAR
    return {
      bottom: footerHeight.get(),
      paddingHorizontal: interpolate(
        mode,
        [0, 1],
        [SIDE_MARGIN_UP, downMargin],
      ),
      transform: [
        {translateY: interpolate(mode, [0, 1], [0, upBottom - downMargin])},
      ],
    }
  })

  const pillStyle = useAnimatedStyle(() => {
    const shown = visibility.get()
    return {
      pointerEvents: shown > 0.5 ? 'auto' : 'none',
      // a fully transparent ancestor stops Liquid Glass rendering at all
      opacity: IS_GLASS_AVAILABLE ? 1 : shown,
    }
  })

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: visibility.get(),
  }))

  if (!config) {
    return null
  }

  const onPress = () => {
    ax.metric('composerPrompt:press', {})
    config.open()
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        IS_WEB ? a.fixed : a.absolute,
        a.left_0,
        a.right_0,
        a.z_10,
        {paddingBottom: GAP_ABOVE_BAR},
        wrapperStyle,
      ]}>
      <Animated.View style={pillStyle}>
        <PressableScale
          testID="composePromptPill"
          accessibilityRole="button"
          accessibilityLabel={config.accessibilityLabel}
          accessibilityHint={config.accessibilityHint}
          targetScale={0.97}
          onPress={() => {
            onPress()
            playHaptic('Light')
          }}
          onLongPress={ios(() => {
            onPress()
            playHaptic('Heavy')
          })}>
          <GlassView
            isInteractive
            glassEffectStyle={{
              style: glassVisible ? 'clear' : 'none',
              animate: true,
            }}
            tintColor={utils.alpha(t.palette.contrast_50, 0.5)}
            style={[a.rounded_full]}
            fallbackStyle={[
              a.border,
              t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
            ]}>
            <Animated.View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_sm,
                a.py_sm,
                {paddingLeft: tokens.space.sm, paddingRight: tokens.space.xs},
                fadeStyle,
              ]}>
              <UserAvatar
                size={AVATAR_SIZE}
                avatar={profile?.avatar}
                type={profile?.associated?.labeler ? 'labeler' : 'user'}
              />
              <Text
                numberOfLines={1}
                style={[a.flex_1, a.text_md, t.atoms.text_contrast_medium]}>
                {config.label}
              </Text>
              {IS_NATIVE && (
                <Button
                  onPress={e => {
                    e.stopPropagation()
                    void onPressCamera()
                  }}
                  label={l`Open camera`}
                  accessibilityHint={l`Opens device camera`}
                  variant="ghost"
                  shape="round"
                  size="small">
                  {({hovered, pressed, focused}) => (
                    <CameraIcon
                      size="lg"
                      style={{
                        color:
                          hovered || pressed || focused
                            ? t.palette.primary_500
                            : t.palette.contrast_400,
                      }}
                    />
                  )}
                </Button>
              )}
              <Button
                onPress={e => {
                  e.stopPropagation()
                  void onPressGallery()
                }}
                label={l`Add image`}
                accessibilityHint={l`Opens image picker`}
                variant="ghost"
                shape="round"
                size="small">
                {({hovered, pressed, focused}) => (
                  <ImageIcon
                    size="lg"
                    style={{
                      color:
                        hovered || pressed || focused
                          ? t.palette.primary_500
                          : t.palette.contrast_400,
                    }}
                  />
                )}
              </Button>
            </Animated.View>
          </GlassView>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  )
}
