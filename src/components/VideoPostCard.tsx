import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyEmbedVideo, AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIBES_FEED_URI} from '#/lib/constants'
import {sanitizeHandle} from '#/lib/strings/handles'
import {formatCount} from '#/view/com/util/numeric/format'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {BLUE_HUE} from '#/alf/util/colorGeneration'
import {select} from '#/alf/util/themeSelector'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'
import {Link} from '#/components/Link'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'

export function VideoPostCard({
  post,
  sourceFeedUri = VIBES_FEED_URI,
}: {
  post: AppBskyFeedDefs.PostView
  sourceFeedUri?: string
}) {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const embed = post.embed
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  /**
   * Filtering should be done at a higher level, such as `PostFeed` or
   * `PostFeedVideoGridRow`, but we need to protect here as well.
   */
  if (!AppBskyEmbedVideo.isView(embed)) return null

  const text = AppBskyFeedPost.isRecord(post.record) ? post.record?.text : ''
  const likeCount = post?.likeCount ?? 0
  const repostCount = post?.repostCount ?? 0
  const {thumbnail} = embed
  const black = select(t.name, {
    light: t.palette.black,
    dark: t.atoms.bg_contrast_25.backgroundColor,
    dim: `hsl(${BLUE_HUE}, 28%, 6%)`,
  })

  return (
    <Link
      label={_(msg`View video`)}
      to={{
        screen: 'TempVibe',
        params: {
          feedUri: sourceFeedUri,
          postUri: post.uri,
        },
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        a.flex_col,
        {
          alignItems: undefined,
          justifyContent: undefined,
        },
      ]}>
      <View
        style={[
          a.justify_center,
          a.rounded_md,
          a.overflow_hidden,
          {
            backgroundColor: black,
            aspectRatio: 9 / 16,
          },
        ]}>
        <Image
          source={{uri: thumbnail}}
          style={[a.w_full, a.h_full, {opacity: pressed ? 0.8 : 1}]}
          accessibilityIgnoresInvertColors
        />
        <MediaInsetBorder />

        <View style={[a.absolute, a.inset_0]}>
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.pt_2xl,
              {
                top: 'auto',
              },
            ]}>
            <LinearGradient
              colors={[black, 'rgba(22, 24, 35, 0)']}
              locations={[0.02, 1]}
              start={{x: 0, y: 1}}
              end={{x: 0, y: 0}}
              style={[a.absolute, a.inset_0, {opacity: 0.9}]}
            />

            <View style={[a.relative, a.z_10, a.p_md, a.flex_row, a.gap_md]}>
              {likeCount > 0 && (
                <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                  <Heart size="sm" fill="white" />
                  <Text style={[a.text_sm, a.font_bold, {color: 'white'}]}>
                    {formatCount(i18n, likeCount)}
                  </Text>
                </View>
              )}
              {repostCount > 0 && (
                <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                  <Repost size="sm" fill="white" />
                  <Text style={[a.text_sm, a.font_bold, {color: 'white'}]}>
                    {formatCount(i18n, repostCount)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={[a.pr_xs, {paddingTop: 6, gap: 4}]}>
        {text && (
          <Text style={[a.text_md, a.leading_snug]} numberOfLines={2}>
            {text}
          </Text>
        )}
        <View style={[a.flex_row, a.gap_xs, a.align_center]}>
          <PreviewableUserAvatar type="user" size={20} profile={post.author} />
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
      </View>
    </Link>
  )
}
