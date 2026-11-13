import {View} from 'react-native'
import {Image} from 'expo-image'
import {moderateProfile} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {
  getAssociatedProfile,
  getGalleryImages,
} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {type ItemFocusProps} from '#/components/Gallery'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner2_Rounded as ImageIcon} from '#/components/icons/Image'
import {Text} from '#/components/Typography'
import {type app, social} from '#/lexicons'
import {AtmosphereCardMenu} from './AtmosphereCardMenu'
import {PhotoDialog} from './PhotoDialog'

export function PhotoCard({
  photo,
  galleryFocus,
}: {
  photo: app.bsky.embed.external.ViewGallery
  galleryFocus?: ItemFocusProps
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()
  const dialogControl = useDialogControl()
  const moderationOpts = useModerationOpts()
  const authorProfile = getAssociatedProfile(photo.associatedProfiles)
  const photos = getGalleryImages(photo)
  const image = photos[0]
  const likeCount = photo.likeCount ?? 0
  const photoCount = photo.photoCount ?? photos.length
  const title = photo.title

  if (!authorProfile || !image) return null

  const moderation = moderationOpts
    ? moderateProfile(authorProfile, moderationOpts)
    : undefined
  const authorName = sanitizeDisplayName(
    authorProfile.displayName || sanitizeHandle(authorProfile.handle),
    moderation?.ui('displayName'),
  )

  const countPillStyle = [
    a.flex_row,
    a.align_center,
    a.gap_2xs,
    a.rounded_full,
    t.atoms.bg,
    {paddingVertical: 5, paddingHorizontal: 7},
  ]

  return (
    <View style={[a.flex_grow, a.w_full]}>
      <Button
        testID="atmospherePhotoCard"
        label={l({
          message: `View photos in ${title}`,
          comment:
            'Accessibility label for a card that opens a photo gallery. {title} is the gallery title, written by its author.',
        })}
        accessibilityHint={l({
          message: 'Opens the photos in a dialog',
          comment:
            'Accessibility hint for a card that opens a photo gallery in a dialog (a popup window) rather than navigating away.',
        })}
        ref={galleryFocus?.focusRef}
        tabIndex={galleryFocus?.tabIndex}
        onPress={() => dialogControl.open()}
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
          <View
            accessible={false}
            pointerEvents="none"
            style={[a.absolute, a.flex_row, a.gap_xs, {top: 8, left: 8}]}>
            {likeCount > 0 ? (
              <View testID="atmospherePhotoCardLikes" style={countPillStyle}>
                <Heart size="xs" fill={t.atoms.text.color} />
                <Text style={[a.text_xs, a.font_medium, t.atoms.text]}>
                  {formatCount(i18n, likeCount)}
                </Text>
              </View>
            ) : undefined}
            <View testID="atmospherePhotoCardPhotos" style={countPillStyle}>
              <ImageIcon size="xs" fill={t.atoms.text.color} />
              <Text style={[a.text_xs, a.font_medium, t.atoms.text]}>
                {formatCount(i18n, photoCount)}
              </Text>
            </View>
          </View>
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
