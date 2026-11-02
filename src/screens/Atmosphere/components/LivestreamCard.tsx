import {View} from 'react-native'
import {Image} from 'expo-image'
import {moderateProfile} from '@bsky/sdk/moderation'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {type AtmosphereLivestreamCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme} from '#/alf'
import {Eye_Stroke2_Corner0_Rounded as EyeIcon} from '#/components/icons/Eye'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

export function LivestreamCard({
  livestream,
  width,
  galleryFocus,
}: {
  livestream: AtmosphereLivestreamCardData
  width?: number
  galleryFocus?: ExploreGalleryFocusProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const authorProfile = livestream.authorProfile
  const moderation =
    moderationOpts && authorProfile
      ? moderateProfile(authorProfile, moderationOpts)
      : undefined
  const authorName = authorProfile
    ? sanitizeDisplayName(
        authorProfile.displayName || sanitizeHandle(authorProfile.handle),
        moderation?.ui('displayName'),
      )
    : undefined

  return (
    <View
      style={[
        a.flex_grow,
        width ? {width} : a.w_full,
        a.rounded_md,
        t.atoms.bg,
      ]}>
      <View style={[a.flex_1, a.rounded_md, a.overflow_hidden]}>
        <Link
          to={livestream.href}
          label={
            livestream.active
              ? livestream.activeCount
                ? l`Open livestream: ${livestream.title}, live with ${plural(
                    livestream.activeCount,
                    {
                      one: '# viewer',
                      other: '# viewers',
                    },
                  )}`
                : l`Open livestream: ${livestream.title}, live`
              : l`Open livestream: ${livestream.title}`
          }
          accessibilityHint=""
          ref={galleryFocus?.focusRef}
          tabIndex={galleryFocus?.tabIndex}
          onFocus={galleryFocus?.onFocus}
          style={[a.flex_col, a.flex_1, a.w_full, a.align_start]}>
          <View
            style={[
              a.w_full,
              a.relative,
              a.overflow_hidden,
              a.rounded_md,
              t.atoms.bg_contrast_25,
              {height: 136},
            ]}>
            {livestream.image ? (
              <Image
                source={livestream.image}
                contentFit="cover"
                style={[a.absolute, a.inset_0, a.w_full, a.h_full]}
                accessible={false}
              />
            ) : undefined}
            <View
              accessible={false}
              pointerEvents="none"
              style={[a.absolute, a.inset_0, a.align_center, a.justify_center]}>
              <View
                style={[
                  a.rounded_full,
                  a.align_center,
                  a.justify_center,
                  a.p_sm,
                  {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  },
                ]}>
                <PlayIcon width={18} fill="white" />
              </View>
            </View>
            {livestream.active ? (
              <View
                pointerEvents="none"
                style={[
                  a.absolute,
                  a.flex_row,
                  a.align_center,
                  a.gap_xs,
                  {
                    top: 8,
                    left: 8,
                  },
                ]}>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.gap_xs,
                    a.px_xs,
                    a.py_2xs,
                    {
                      paddingRight: 6,
                      borderRadius: 5,
                      backgroundColor: t.palette.negative_500,
                    },
                  ]}>
                  <View
                    style={[
                      a.rounded_full,
                      {
                        width: 5,
                        height: 5,
                        backgroundColor: 'white',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      a.text_xs,
                      a.font_semi_bold,
                      {color: 'white', textTransform: 'uppercase'},
                    ]}>
                    <Trans>Live</Trans>
                  </Text>
                </View>
                {livestream.activeCount ? (
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.gap_2xs,
                      a.px_xs,
                      a.py_2xs,
                      {
                        borderRadius: 5,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      },
                    ]}>
                    <EyeIcon size="xs" fill="white" />
                    <Text
                      style={[a.text_xs, a.font_semi_bold, {color: 'white'}]}>
                      {livestream.activeCount}
                    </Text>
                  </View>
                ) : undefined}
              </View>
            ) : undefined}
          </View>
          <View style={[a.w_full, a.flex_1, a.align_start, a.gap_sm, a.py_sm]}>
            <Text emoji style={[a.text_sm, a.font_semi_bold]} numberOfLines={2}>
              {livestream.title}
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
          </View>
        </Link>
      </View>
    </View>
  )
}
