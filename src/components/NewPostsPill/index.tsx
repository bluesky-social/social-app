import {useEffect, useEffectEvent, useId, useState} from 'react'
import {AppState, type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, {Circle, Defs, G, Image, Mask} from 'react-native-svg'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {atoms as a, useTheme} from '#/alf'
import {GlassView, IS_GLASS_AVAILABLE} from '#/components/GlassView'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowTop_Stroke2_Corner0_Rounded as ArrowTopIcon} from '#/components/icons/Arrow'
import {
  newPostsPillLeadsUp,
  newPostsPillPresentation,
  type NewPostsPillVariant,
} from '#/components/NewPostsPill/presentation'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export type {NewPostsPillVariant}

/** Only authors whose avatars are safe to display should be supplied. */
export type NewPostsPillAuthor = {
  did: string
  avatar?: string
}

const PILL_HEIGHT = 32
const FACEPILE_PILL_HEIGHT = 40
const AVATAR_SIZE = 24
const AVATAR_OVERLAP = 7
const FACE_GAP = 2
const ANIMATION_DURATION = 200
const PILL_TRAVEL = 56
const NO_AUTHORS: NewPostsPillAuthor[] = []

/**
 * A floating capsule's content and lifecycle, independent of feed data, metrics,
 * and header positioning. The parent positions it beneath its own header.
 * Exiting pills stay mounted for the slide, but are immediately inert.
 */
export function NewPostsPill({
  visible,
  variant = 'newPosts',
  count = 0,
  authors = NO_AUTHORS,
  showArrow,
  text,
  label,
  style,
  testID = 'newPostsPill',
  onPress,
}: {
  visible: boolean
  variant?: NewPostsPillVariant
  /** Number of eligible rendered posts, or 0 if only existence is known. */
  count?: number
  authors?: NewPostsPillAuthor[]
  /** Independent of fetch mode: a List refresh, for example, points up. */
  showArrow?: boolean
  /** Optional translated visual wording for a surface or long-label fixture. */
  text?: string
  /** Accessible action label; defaults to localized variant/count wording. */
  label?: string
  /** The parent can provide positioning without coupling this to a header. */
  style?: StyleProp<ViewStyle>
  testID?: string
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const reducedMotion = useReducedMotion()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  /* Glass disappears after a genuine background return on supported iOS. */
  const [glassGeneration, setGlassGeneration] = useState(0)
  const rebuildGlass = useEffectEvent(() => {
    if (IS_GLASS_AVAILABLE) setGlassGeneration(generation => generation + 1)
  })
  useEffect(() => {
    let wasBackgrounded = AppState.currentState === 'background'
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'background') {
        wasBackgrounded = true
      } else if (next === 'active' && wasBackgrounded) {
        wasBackgrounded = false
        rebuildGlass()
      }
    })
    return () => subscription.remove()
  }, [])

  /* Translate only: opacity animations stop the native glass from rendering. */
  const travel = useSharedValue(-PILL_TRAVEL)
  useEffect(() => {
    travel.set(
      reducedMotion
        ? visible
          ? 0
          : -PILL_TRAVEL
        : withTiming(visible ? 0 : -PILL_TRAVEL, {
            duration: ANIMATION_DURATION,
            easing: visible ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
          }),
    )
  }, [visible, reducedMotion, travel])
  const slide = useAnimatedStyle(() => ({
    transform: [{translateY: travel.get()}],
  }))

  const [isMounted, setIsMounted] = useState(visible)
  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      return
    }
    const timeout = setTimeout(
      () => setIsMounted(false),
      reducedMotion ? 0 : ANIMATION_DURATION,
    )
    return () => clearTimeout(timeout)
  }, [visible, reducedMotion])

  /* Keep the offered content unchanged as it slides out. */
  const [retained, setRetained] = useState({
    variant,
    count,
    authors,
    showArrow,
    text,
    label,
  })
  useEffect(() => {
    if (visible) setRetained({variant, count, authors, showArrow, text, label})
  }, [visible, variant, count, authors, showArrow, text, label])
  const content = visible
    ? {variant, count, authors, showArrow, text, label}
    : retained

  const faces = content.authors.filter(author => author.avatar).slice(0, 3)
  const presentation = newPostsPillPresentation({
    variant: content.variant,
    count: content.count,
    faceCount: faces.length,
  })
  const hasArrow = content.showArrow ?? newPostsPillLeadsUp(content.variant)
  const defaultLabel =
    content.variant === 'scrollToTop'
      ? l`Scroll to top`
      : content.variant === 'new'
        ? l({
            message: 'Load new notifications',
            comment: 'Accessible action on the notification list pill.',
          })
        : content.variant === 'newPostsToFetch' || content.count === 0
          ? l`Load new posts`
          : plural(content.count, {
              one: 'Load # new post',
              other: 'Load # new posts',
            })

  if (!isMounted) return null

  return (
    <Animated.View pointerEvents="box-none" style={[a.align_center, style]}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
        style={slide}>
        <PressableScale
          testID={testID}
          disabled={!visible}
          accessibilityRole="button"
          accessibilityLabel={content.label ?? defaultLabel}
          accessibilityHint=""
          onPress={onPress}
          hitSlop={HITSLOP_20}
          targetScale={0.95}
          onPointerEnter={onHoverIn}
          onPointerLeave={onHoverOut}>
          <View
            style={[
              a.rounded_full,
              {
                minHeight:
                  presentation === 'facepile'
                    ? FACEPILE_PILL_HEIGHT
                    : PILL_HEIGHT,
              },
            ]}>
            <GlassView
              key={glassGeneration}
              pointerEvents="none"
              isInteractive
              glassEffectStyle="regular"
              tintColor={t.palette.primary_500}
              style={[a.absolute, a.inset_0, a.rounded_full]}
              fallbackStyle={[
                t.atoms.shadow_md,
                {backgroundColor: t.palette.primary_500},
              ]}
            />
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_xs,
                a.px_md,
                {minHeight: presentation === 'facepile' ? 40 : 32},
              ]}>
              <SubtleHover hover={hovered} style={[a.rounded_full]} />
              {hasArrow && (
                <ArrowTopIcon
                  size={presentation === 'facepile' ? 'sm' : 'xs'}
                  fill={t.palette.white}
                  style={[a.z_10]}
                />
              )}
              {presentation === 'facepile' ? (
                <Facepile authors={faces} />
              ) : presentation === 'generic' ? (
                <PillLabelText>
                  {content.text ?? <Trans>New posts</Trans>}
                </PillLabelText>
              ) : presentation === 'new' ? (
                <PillLabelText>
                  {content.text ?? (
                    <Trans
                      context="new content pill"
                      comment="A short label offering newly arrived notifications.">
                      New
                    </Trans>
                  )}
                </PillLabelText>
              ) : null}
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  )
}

function PillLabelText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text style={[a.z_10, a.text_xs, a.font_bold, {color: t.palette.white}]}>
      {children}
    </Text>
  )
}

/** SVG masks leave actual transparent gaps between the faces over glass. */
function Facepile({authors}: {authors: NewPostsPillAuthor[]}) {
  const t = useTheme()
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '')
  const radius = AVATAR_SIZE / 2
  const step = AVATAR_SIZE - AVATAR_OVERLAP
  const width = AVATAR_SIZE + (authors.length - 1) * step

  return (
    <Svg width={width} height={AVATAR_SIZE} style={[a.z_10]}>
      <Defs>
        {authors.map((author, index) => (
          <Mask
            key={author.did}
            id={`${instance}-${index}`}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={AVATAR_SIZE}>
            <Circle
              cx={index * step + radius}
              cy={radius}
              r={radius}
              fill="white"
            />
            {index > 0 && (
              <Circle
                cx={(index - 1) * step + radius}
                cy={radius}
                r={radius + FACE_GAP}
                fill="black"
              />
            )}
          </Mask>
        ))}
      </Defs>
      {authors.map((author, index) => (
        <G key={author.did} mask={`url(#${instance}-${index})`}>
          <Circle
            cx={index * step + radius}
            cy={radius}
            r={radius}
            fill={t.atoms.bg_contrast_25.backgroundColor}
          />
          <Image
            href={author.avatar}
            x={index * step}
            y={0}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            preserveAspectRatio="xMidYMid slice"
          />
        </G>
      ))}
    </Svg>
  )
}
