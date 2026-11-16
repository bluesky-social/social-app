import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {PhotoDialog} from '#/screens/Atmosphere/components/PhotoDialog'
import {
  getAssociatedProfile,
  getGalleryImage,
} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'
import {social} from '#/lexicons'
import {type ActivityContent} from '../rows'
import {CardStats} from './CardStats'

/** Keeps very tall or very wide photos from dominating the timeline. */
const MIN_ASPECT_RATIO = 4 / 5
const MAX_ASPECT_RATIO = 2

/** A Grain gallery: title, stats, and its first photo. Opens the photo dialog. */
export function GalleryCard({
  content: {view},
}: {
  content: Extract<ActivityContent, {type: 'gallery'}>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const dialogControl = useDialogControl()
  const {state: interacted, onIn, onOut} = useInteractionState()
  const image = getGalleryImage(view)
  const author = getAssociatedProfile(view.associatedProfiles)

  // `toActivityRows` already turns galleries without these into warnings.
  if (!image || !author) return null

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
          message: `View photos in ${view.title}`,
          comment:
            'Accessibility label for a card that opens a photo gallery. {view.title} is the gallery title, written by its author.',
        })}
        accessibilityHint={l`Opens the photos in a dialog`}
        onPress={() => dialogControl.open()}
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
          <View style={[a.pt_xs]}>
            <CardStats
              date={view.createdAt}
              likeCount={view.likeCount}
              photoCount={view.photoCount || view.items.length}
            />
          </View>
        </View>
        <Image
          source={{uri: image.thumbnail}}
          contentFit="cover"
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessible={!!image.alt}
          style={[
            a.w_full,
            a.rounded_md,
            t.atoms.bg_contrast_25,
            {aspectRatio},
          ]}
        />
      </Button>
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
