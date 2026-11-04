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
  getGalleryImage,
} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {AtmosphereCardMenu} from './AtmosphereCardMenu'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

export function PhotoCard({
  photo,
  galleryFocus,
}: {
  photo: app.bsky.embed.external.ViewGallery
  galleryFocus?: ExploreGalleryFocusProps
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()
  const moderationOpts = useModerationOpts()
  const authorProfile = getAssociatedProfile(photo.associatedProfiles)
  const image = getGalleryImage(photo)
  const likeCount = photo.likeCount ?? 0

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
      <Link
        to={photo.uri}
        label={l`Open ${photo.title}`}
        accessibilityHint=""
        ref={galleryFocus?.focusRef}
        tabIndex={galleryFocus?.tabIndex}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={() => {
          onInteract()
          galleryFocus?.onFocus()
        }}
        onBlur={onInteractOut}
        style={[a.flex_grow, a.w_full, a.flex_col, a.align_start, a.gap_sm]}>
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
          {likeCount > 0 ? (
            <View
              accessible={false}
              pointerEvents="none"
              style={[
                a.absolute,
                a.flex_row,
                a.align_center,
                a.gap_2xs,
                a.px_xs,
                a.py_2xs,
                {
                  top: 7,
                  left: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  borderRadius: 5,
                },
              ]}>
              <Heart size="xs" style={{color: 'white'}} />
              <Text style={[a.text_xs, a.font_medium, {color: 'white'}]}>
                {formatCount(i18n, likeCount)}
              </Text>
            </View>
          ) : undefined}
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
      </Link>
      <AtmosphereCardMenu
        type="photo"
        uri={photo.uri}
        author={authorProfile}
        galleryFocus={galleryFocus}
      />
    </View>
  )
}
