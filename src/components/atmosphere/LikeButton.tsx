import {type StyleProp, View, type ViewStyle} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme, web} from '#/alf'
import {AtmosphereFirstActionWelcomeDialog} from '#/components/atmosphere/AtmosphereFirstActionWelcomeDialog'
import {
  type AtmosphereLikeKind,
  type LikeableView,
  useAtmosphereLike,
} from '#/components/atmosphere/likes'
import {Button} from '#/components/Button'
import {HoverTooltip} from '#/components/HoverTooltip'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilledIcon,
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
} from '#/components/icons/Heart2'
import {
  Sparkle_Stroke2_Corner0_Rounded as SparkleIcon,
  Sparkle_Stroke2_Corner0_Rounded_Filled as SparkleFilledIcon,
} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'

/** Space between the pill's edge and its icon. */
const PILL_INSET = 8

/** Eases in gently and settles softly, like something with a little weight. */
const NATURAL_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

type Icon = React.ComponentType<SVGIconProps>

const KINDS: Record<
  AtmosphereLikeKind,
  {
    icon: Icon
    /** Once liked. */
    activeIcon: Icon
    /** Web only, and left out when the user prefers reduced motion. */
    iconMotion: {rest: StyleProp<ViewStyle>; hovered: StyleProp<ViewStyle>}
  }
> = {
  favorite: {
    icon: HeartIcon,
    activeIcon: HeartFilledIcon,
    // A subtle zoom in on hover, and back out after.
    iconMotion: {
      rest: web({
        transitionProperty: 'transform',
        transitionDuration: '200ms',
        transitionTimingFunction: NATURAL_EASING,
      }),
      hovered: {transform: [{scale: 1.15}]},
    },
  },
  recommend: {
    icon: SparkleIcon,
    activeIcon: SparkleFilledIcon,
    /*
     * One full turn on hover. Only the hovered state transitions, so leaving
     * snaps back to 0deg, which looks the same as 360deg, instead of
     * unwinding.
     */
    iconMotion: {
      rest: undefined,
      hovered: web({
        transform: [{rotate: '360deg'}],
        transitionProperty: 'transform',
        transitionDuration: '600ms',
        transitionTimingFunction: NATURAL_EASING,
      }),
    },
  },
}

/**
 * The icon and count that favorite a gallery or recommend an article, or undo
 * it. Read-only when the view has no record to like.
 */
export function LikeButton({
  view,
  kind,
  testID,
}: {
  view: LikeableView
  kind: AtmosphereLikeKind
  testID?: string
}) {
  const {t: l, i18n} = useLingui()
  const {canLike, isLiked, likeCount, toggle, firstActionWelcomeDialogControl} =
    useAtmosphereLike(view, kind, 'card')

  const count = formatCount(i18n, likeCount)
  const shownCount = likeCount > 0 ? count : undefined
  let countLabel: string
  let action: string
  let tooltip: string
  switch (kind) {
    case 'favorite':
      tooltip = l({
        message: 'Favorite',
        context: 'tooltip',
        comment:
          'Tooltip shown when hovering the heart button on a photo gallery. Favoriting is like liking a post. Keep it short; it names the action, not its state.',
      })
      countLabel = l({
        message: plural(likeCount, {
          one: `${count} favorite`,
          other: `${count} favorites`,
        }),
        comment:
          'Number of people who favorited (liked) a photo gallery, read out by screen readers. {count} is already formatted.',
      })
      action = isLiked
        ? l({
            message: 'Remove your favorite',
            comment:
              'Accessibility label for a button that unfavorites (unlikes) a photo gallery',
          })
        : l({
            message: 'Favorite',
            comment: 'Button that favorites (likes) a photo gallery',
          })
      break
    case 'recommend':
      tooltip = l({
        message: 'Recommend',
        context: 'tooltip',
        comment:
          'Tooltip shown when hovering the sparkle button on an article. Recommending is like liking a post. Keep it short; it names the action, not its state.',
      })
      countLabel = l({
        message: plural(likeCount, {
          one: `${count} recommendation`,
          other: `${count} recommendations`,
        }),
        comment:
          'Number of people who recommended (liked) an article, read out by screen readers. {count} is already formatted.',
      })
      action = isLiked
        ? l`Remove your recommendation`
        : l({
            message: 'Recommend',
            comment: 'Button that recommends (likes) an article',
          })
      break
  }

  if (!canLike) {
    if (likeCount === 0 && !isLiked) return null
    return (
      <View
        accessible
        accessibilityLabel={countLabel}
        accessibilityHint=""
        style={{marginLeft: -PILL_INSET}}>
        <LikePill kind={kind} liked={isLiked} count={shownCount} />
      </View>
    )
  }

  return (
    <>
      <HoverTooltip label={tooltip} color="primary">
        <Button
          testID={testID}
          label={l({
            message: `${action}, ${countLabel}`,
            comment:
              'Accessibility label for a like button, e.g. “Favorite, 3 favorites” or “Recommend, 3 recommendations”. Both parts are already translated.',
          })}
          hitSlop={4}
          style={[a.rounded_full, {marginLeft: -PILL_INSET}]}
          onPress={toggle}>
          {({hovered, focused, pressed}) => (
            <LikePill
              kind={kind}
              liked={isLiked}
              count={shownCount}
              hovered={hovered || focused || pressed}
            />
          )}
        </Button>
      </HoverTooltip>
      <AtmosphereFirstActionWelcomeDialog
        control={firstActionWelcomeDialogControl}
      />
    </>
  )
}

/**
 * The icon and count, blue once liked. Hovered, a pill appears behind them.
 * The pill's left padding is pulled back out with a negative margin, so the
 * icon stays on the text line either way.
 */
function LikePill({
  kind,
  liked,
  count,
  hovered = false,
}: {
  kind: AtmosphereLikeKind
  liked: boolean
  /** Formatted, or undefined to show the icon alone. */
  count?: string
  /** Hovered, focused or pressed. */
  hovered?: boolean
}) {
  const t = useTheme()
  const reducedMotion = useReducedMotion()
  const highlighted = liked || hovered
  const config = KINDS[kind]
  const Icon = liked ? config.activeIcon : config.icon
  const color = highlighted
    ? t.palette.primary_700
    : t.atoms.text_contrast_medium.color

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.rounded_full,
        {
          paddingVertical: 4,
          // The icon's built-in ~2px makes 8 read like the count side's 10.
          paddingLeft: PILL_INSET,
          paddingRight: 10,
        },
        hovered && {
          backgroundColor: liked ? t.palette.primary_100 : t.palette.primary_50,
        },
        !reducedMotion &&
          web([a.transition_color, a.transition_timing_default]),
      ]}>
      <View
        style={[
          !reducedMotion &&
            web([config.iconMotion.rest, hovered && config.iconMotion.hovered]),
        ]}>
        <Icon size="sm" fill={color} />
      </View>
      {count && (
        <Text
          style={[
            a.text_sm,
            a.font_medium,
            {color, fontVariant: ['tabular-nums']},
          ]}>
          {count}
        </Text>
      )}
    </View>
  )
}
