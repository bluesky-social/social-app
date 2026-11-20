import {type StyleProp, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {GhostPressable} from '#/components/atmosphere/GhostPressable'
import {useAtmosphereLike} from '#/components/atmosphere/likes'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilledIcon,
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
} from '#/components/icons/Heart2'
import {Link} from '#/components/Link'
import {type app} from '#/lexicons'

/**
 * "View on {app}" and "Favorite" buttons for a gallery card. Interactive
 * elements can't nest in the card's pressable, so the card renders a `ghost`
 * inside it to reserve space, and overlays the real actions on it.
 */
export function GalleryActions({
  view,
  ghost = false,
  onViewPress,
  style,
}: {
  view: app.bsky.embed.external.ViewGallery
  /**
   * Renders an invisible, non-interactive copy that takes up the same space
   * as the real actions, tracking font scaling with no measuring.
   */
  ghost?: boolean
  /** Tracks opening the gallery externally. */
  onViewPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const {
    canLike: canFavorite,
    isLiked: isFavorited,
    toggle: toggleFavorite,
  } = useAtmosphereLike(view, 'favorite')
  const provider = getAtmosphereProvider(view.providerId)

  const viewText = provider
    ? l({
        message: `View on ${provider.name}`,
        comment:
          'Button that opens a photo gallery on the app it was posted with, e.g. “View on Grain”',
      })
    : l({
        message: 'View gallery',
        comment: 'Button that opens a photo gallery on the web',
      })
  const favoriteText = isFavorited
    ? l({
        message: 'Favorited',
        comment: 'Button showing the viewer has favorited (liked) a gallery',
      })
    : l({
        message: 'Favorite',
        comment: 'Button that favorites (likes) a photo gallery',
      })

  const PressableComponent = ghost ? GhostPressable : undefined

  return (
    <View
      aria-hidden={ghost}
      accessibilityElementsHidden={ghost}
      importantForAccessibility={ghost ? 'no-hide-descendants' : 'auto'}
      /*
       * Only the buttons take touches; the gap falls through to the card
       * beneath. The prop, not the style, since react-native-web drops inline
       * `box-none`.
       */
      pointerEvents={ghost ? 'none' : 'box-none'}
      style={[a.flex_row, a.gap_sm, ghost && {opacity: 0}, style]}>
      <Link
        PressableComponent={PressableComponent}
        shouldProxy
        to={view.uri}
        onPress={onViewPress}
        label={viewText}
        size="small"
        color="secondary_inverted"
        /* Link left-aligns its content by default. */
        style={[a.flex_1, a.justify_center]}>
        {provider ? (
          <>
            <ButtonIcon icon={provider.Icon} />
            <ButtonText>{viewText}</ButtonText>
          </>
        ) : (
          <>
            <ButtonText>{viewText}</ButtonText>
            <ButtonIcon icon={ArrowTopRightIcon} />
          </>
        )}
      </Link>
      {canFavorite && (
        <Button
          PressableComponent={PressableComponent}
          label={
            isFavorited
              ? l({
                  message: 'Remove your favorite',
                  comment:
                    'Accessibility label for a button that unfavorites (unlikes) a photo gallery',
                })
              : favoriteText
          }
          size="small"
          color={isFavorited ? 'primary_subtle' : 'secondary'}
          style={[a.flex_1]}
          onPress={toggleFavorite}>
          <ButtonIcon icon={isFavorited ? HeartFilledIcon : HeartIcon} />
          <ButtonText>{favoriteText}</ButtonText>
        </Button>
      )}
    </View>
  )
}
