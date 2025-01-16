import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyEmbedVideo,AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeHandle} from '#/lib/strings/handles'
import {formatCount} from '#/view/com/util/numeric/format'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {BLUE_HUE} from '#/alf/util/colorGeneration'
import {select} from '#/alf/util/themeSelector'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'
import {Text} from '#/components/Typography'

export function VideoPostCard({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const embed = post.embed
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  /**
   * Filtering should be done at a higher level, such as `PostFeed` or
   * `PostFeedVideoGridRow`, but we need to protect here as well.
   */
  if (!AppBskyEmbedVideo.isView(embed)) return null

  const {thumbnail} = embed
  const black = select(t.name, {
    light: t.atoms.bg_contrast_25.backgroundColor,
    dark: t.atoms.bg_contrast_25.backgroundColor,
    dim: `hsl(${BLUE_HUE}, 28%, 6%)`,
  })

  return (
    <Pressable
      accessibilityHint={_(msg`View video`)} // TODO
      accessibilityLabel={_(msg`View video`)}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}>
      <View
        style={[
          a.justify_center,
          a.rounded_sm,
          a.overflow_hidden,
          {
            backgroundColor: black,
            aspectRatio: 9 / 16,
          },
        ]}>
        <Image
          source={{uri: thumbnail}}
          style={[a.w_full, a.h_full]}
          accessibilityIgnoresInvertColors
        />

        <View style={[a.absolute, a.inset_0]}>
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.transition_opacity,
              {
                backgroundColor: black,
                opacity: hovered ? 0 : 0.2,
              },
            ]}
          />

          <View
            style={[
              a.absolute,
              a.inset_0,
              a.pt_3xl,
              {
                top: 'auto',
              },
            ]}>
            <LinearGradient
              colors={[black, 'rgba(22, 24, 35, 0)']}
              locations={[0.02, 1]}
              start={{x: 0, y: 1}}
              end={{x: 0, y: 0}}
              style={[a.absolute, a.inset_0]}
            />

            <View style={[a.relative, a.z_10, a.p_md, a.flex_row, a.gap_md]}>
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                <Heart size="md" fill="white" />
                <Text style={[a.text_md, a.font_bold]}>
                  {formatCount(i18n, post.likeCount || 0)}
                </Text>
              </View>
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                <Repost size="md" fill="white" />
                <Text style={[a.text_md, a.font_bold]}>
                  {formatCount(i18n, post.repostCount || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={[a.pt_sm, a.flex_row, a.gap_sm, a.align_center]}>
        <PreviewableUserAvatar type="user" size={24} profile={post.author} />
        <Text
          style={[
            a.flex_1,
            a.text_sm,
            a.font_bold,
            a.leading_tight,
            t.atoms.text_contrast_medium,
          ]}
          numberOfLines={1}>
          {sanitizeHandle(post.author.handle, '@')}
        </Text>
      </View>
    </Pressable>
  )
}
