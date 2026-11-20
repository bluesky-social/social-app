import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {
  GalleryCountPills,
  useGalleryCounts,
} from '#/screens/Atmosphere/components/GalleryCountPills'
import {PhotoDialog} from '#/screens/Atmosphere/components/PhotoDialog'
import {
  getAssociatedProfile,
  getGalleryImage,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {useLogContentPress} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'
import {social} from '#/lexicons'
import {type ActivityContent} from '../rows'
import {GalleryActions} from './GalleryActions'

/** Keeps very tall or very wide photos from dominating the timeline. */
const MIN_ASPECT_RATIO = 4 / 5
const MAX_ASPECT_RATIO = 2

/** Space between the card's edge and its content: its padding plus border. */
const CARD_INSET = a.p_md.padding + a.border.borderWidth

/**
 * A Grain gallery: title, its first photo with counts, and actions. Opens the
 * photo dialog.
 */
export function GalleryCard({
  content: {view},
}: {
  content: Extract<ActivityContent, {type: 'gallery'}>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const dialogControl = useDialogControl()
  const {state: interacted, onIn, onOut} = useInteractionState()
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  const image = getGalleryImage(view)
  const author = getAssociatedProfile(view.associatedProfiles)
  const {favoriteCount, photoCount, label: countsLabel} = useGalleryCounts(view)

  // `toActivityRows` already turns galleries without these into warnings.
  if (!image || !author) return null

  const title = view.title
  const aspectRatio = image.aspectRatio
    ? Math.min(
        Math.max(
          image.aspectRatio.width / image.aspectRatio.height,
          MIN_ASPECT_RATIO,
        ),
        MAX_ASPECT_RATIO,
      )
    : 1

  return (
    <View style={a.relative}>
      <Button
        testID="activityGalleryCard"
        label={l({
          message: `View photos in ${title}, ${countsLabel}`,
          comment:
            'Accessibility label for a card that opens a photo gallery. {title} is the gallery title, written by its author. {countsLabel} is the already-translated number of favorites and photos, e.g. “3 favorites, 12 photos”.',
        })}
        accessibilityHint={l`Opens the photos in a dialog`}
        onPress={() => {
          logPress('photoDialog')
          sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
          dialogControl.open()
        }}
        onHoverIn={onIn}
        onHoverOut={onOut}
        onFocus={onIn}
        onBlur={onOut}
        style={[
          a.flex_col,
          a.align_stretch,
          a.w_full,
          a.p_md,
          a.rounded_lg,
          a.border,
          t.atoms.bg,
          interacted
            ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_high]
            : t.atoms.border_contrast_low,
        ]}>
        <View style={[a.gap_xs, a.pb_md]}>
          {!!view.title && (
            <Text
              emoji
              numberOfLines={2}
              style={[a.pr_5xl, a.text_lg, a.font_bold, a.leading_snug]}>
              {view.title}
            </Text>
          )}
          {!!view.description && (
            <Text
              emoji
              numberOfLines={2}
              style={[a.pr_5xl, a.text_md, a.leading_snug]}>
              {view.description}
            </Text>
          )}
        </View>
        <View
          style={[
            a.w_full,
            a.overflow_hidden,
            a.rounded_md,
            t.atoms.bg_contrast_25,
            {aspectRatio},
          ]}>
          <Image
            source={{uri: image.thumbnail}}
            contentFit="cover"
            accessibilityLabel={image.alt}
            accessibilityHint=""
            accessible={!!image.alt}
            style={[a.w_full, a.h_full]}
          />
          <GalleryCountPills
            favoriteCount={favoriteCount}
            photoCount={photoCount}
          />
        </View>
        <GalleryActions ghost view={view} style={[a.pt_md]} />
      </Button>
      <GalleryActions
        view={view}
        onViewPress={() => {
          logPress('external')
          sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
        }}
        style={[
          a.absolute,
          {left: CARD_INSET, right: CARD_INSET, bottom: CARD_INSET},
        ]}
      />
      <AtmosphereCardMenu
        type="photo"
        item={view}
        reportableTypes={[social.grain.gallery.$type]}
        author={author}
        offsetY={a.p_md.padding}
        offsetX={a.p_md.padding}
      />
      <PhotoDialog control={dialogControl} photo={view} author={author} />
    </View>
  )
}
