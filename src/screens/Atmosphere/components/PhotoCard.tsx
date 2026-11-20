import {View} from 'react-native'
import {Image} from 'expo-image'
import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {
  getAssociatedProfile,
  getGalleryImages,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {useLogContentPress} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {type ItemFocusProps} from '#/components/Gallery'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'
import {type app, social} from '#/lexicons'
import {AtmosphereCardMenu} from './AtmosphereCardMenu'
import {GalleryCountPills, useGalleryCounts} from './GalleryCountPills'
import {PhotoDialog} from './PhotoDialog'

export function PhotoCard({
  photo,
  galleryFocus,
}: {
  photo: app.bsky.embed.external.ViewGallery
  galleryFocus?: ItemFocusProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()
  const dialogControl = useDialogControl()
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  const moderationOpts = useModerationOpts()
  const authorProfile = getAssociatedProfile(photo.associatedProfiles)
  const photos = getGalleryImages(photo)
  const image = photos[0]
  const {
    favoriteCount,
    photoCount,
    label: countsLabel,
  } = useGalleryCounts(photo)
  const title = photo.title

  if (!authorProfile || !image) return null

  const moderation = moderationOpts
    ? moderateProfile(authorProfile, moderationOpts)
    : undefined
  const authorName = sanitizeDisplayName(
    authorProfile.displayName || sanitizeHandle(authorProfile.handle),
    moderation?.ui('displayName'),
  )

  return (
    <View style={[a.flex_grow, a.w_full]}>
      <Button
        testID="atmospherePhotoCard"
        label={l({
          message: `View photos in ${title}, ${countsLabel}`,
          comment:
            'Accessibility label for a card that opens a photo gallery. {title} is the gallery title, written by its author. {countsLabel} is the already-translated number of favorites and photos, e.g. “3 favorites, 12 photos”.',
        })}
        accessibilityHint={l({
          message: 'Opens the photos in a dialog',
          comment:
            'Accessibility hint for a card that opens a photo gallery in a dialog (a popup window) rather than navigating away.',
        })}
        ref={galleryFocus?.focusRef}
        tabIndex={galleryFocus?.tabIndex}
        onPress={() => {
          logPress('photoDialog')
          sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
          dialogControl.open()
        }}
        onHoverIn={onInteract}
        onHoverOut={onInteractOut}
        onFocus={() => {
          onInteract()
          galleryFocus?.onFocus()
        }}
        onBlur={onInteractOut}
        style={[a.w_full, a.flex_col, a.align_start, a.gap_sm]}>
        <View
          style={[
            a.w_full,
            a.aspect_square,
            a.overflow_hidden,
            a.rounded_md,
            t.atoms.bg_contrast_25,
          ]}>
          <Image
            source={image.thumbnail}
            contentFit="cover"
            accessibilityLabel={image.alt}
            accessibilityHint=""
            style={[a.w_full, a.h_full]}
            accessible={!!image.alt}
          />
          {interacted ? (
            <View
              testID="atmospherePhotoHoverOverlay"
              accessible={false}
              pointerEvents="none"
              style={[
                a.absolute,
                a.inset_0,
                {backgroundColor: 'rgba(0, 0, 0, 0.1)'},
              ]}
            />
          ) : undefined}
          <GalleryCountPills
            favoriteCount={favoriteCount}
            photoCount={photoCount}
          />
        </View>
        <Text
          emoji
          style={[a.w_full, a.text_sm, a.font_semi_bold]}
          numberOfLines={2}>
          {photo.title}
        </Text>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <UserAvatar
            type="user"
            size={16}
            avatar={authorProfile.avatar}
            moderation={moderation?.ui('avatar')}
          />
          <Text emoji style={[a.text_xs, a.font_medium]} numberOfLines={1}>
            {authorName}
          </Text>
        </View>
      </Button>
      <AtmosphereCardMenu
        type="photo"
        item={photo}
        reportableTypes={[social.grain.gallery.$type]}
        author={authorProfile}
        galleryFocus={galleryFocus}
        offsetY={a.p_md.padding}
        offsetX={a.p_md.padding}
      />
      <PhotoDialog
        control={dialogControl}
        photo={photo}
        author={authorProfile}
      />
    </View>
  )
}
