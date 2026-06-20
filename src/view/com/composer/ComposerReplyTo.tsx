import {useCallback, useMemo, useState} from 'react'
import {LayoutAnimation, Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {
  AppBskyEmbedGallery,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type ComposerOptsPostRef} from '#/state/shell/composer'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, utils, web} from '#/alf'
import {QuoteEmbed} from '#/components/Post/Embed'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {parseEmbed} from '#/types/bsky/post'

export function ComposerReplyTo({replyTo}: {replyTo: ComposerOptsPostRef}) {
  const t = useTheme()
  const {_} = useLingui()
  const {embed} = replyTo

  const [showFull, setShowFull] = useState(false)

  const onPress = useCallback(() => {
    setShowFull(prev => !prev)
    LayoutAnimation.configureNext({
      duration: 350,
      update: {type: 'spring', springDamping: 0.7},
    })
  }, [])

  const quoteEmbed = useMemo(() => {
    if (
      AppBskyEmbedRecord.isView(embed) &&
      AppBskyEmbedRecord.isViewRecord(embed.record) &&
      AppBskyFeedPost.isRecord(embed.record.value)
    ) {
      return embed
    } else if (
      AppBskyEmbedRecordWithMedia.isView(embed) &&
      AppBskyEmbedRecord.isViewRecord(embed.record.record) &&
      AppBskyFeedPost.isRecord(embed.record.record.value)
    ) {
      return embed.record
    }
    return null
  }, [embed])
  const parsedQuoteEmbed = quoteEmbed
    ? parseEmbed({
        $type: 'app.bsky.embed.record#view',
        ...quoteEmbed,
      })
    : null

  const {images, totalNumber} = useMemo(() => {
    if (AppBskyEmbedImages.isView(embed)) {
      return {images: embed.images, totalNumber: embed.images.length}
    } else if (AppBskyEmbedGallery.isView(embed)) {
      return {
        images: galleryItemsToImages(embed.items),
        totalNumber: embed.items.length,
      }
    } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
      if (AppBskyEmbedImages.isView(embed.media)) {
        return {
          images: embed.media.images,
          totalNumber: embed.media.images.length,
        }
      } else if (AppBskyEmbedGallery.isView(embed.media)) {
        return {
          images: galleryItemsToImages(embed.media.items),
          totalNumber: embed.media.items.length,
        }
      }
    }
    return {images: [], totalNumber: 0}
  }, [embed])

  return (
    <Pressable
      style={[
        a.flex_row,
        a.align_start,
        a.pt_xs,
        a.pb_lg,
        a.mb_md,
        a.mx_lg,
        a.border_b,
        t.atoms.border_contrast_medium,
        web(a.user_select_text),
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={_(
        msg`Expand or collapse the full post you are replying to`,
      )}
      accessibilityHint="">
      <PreviewableUserAvatar
        size={42}
        profile={replyTo.author}
        moderation={replyTo.moderation?.ui('avatar')}
        type={replyTo.author.associated?.labeler ? 'labeler' : 'user'}
        disableNavigation={true}
      />
      <View style={[a.flex_1, a.pl_md, a.pr_sm, a.gap_2xs]}>
        <View style={[a.flex_row, a.align_center, a.pr_xs]}>
          <Text
            style={[a.font_semi_bold, a.text_md, a.leading_snug, a.flex_shrink]}
            numberOfLines={1}
            emoji>
            {sanitizeDisplayName(
              replyTo.author.displayName ||
                sanitizeHandle(replyTo.author.handle),
            )}
          </Text>
          <ProfileBadges profile={replyTo.author} size="sm" style={[a.pl_xs]} />
        </View>
        <View style={[a.flex_row, a.gap_md]}>
          <View style={[a.flex_1, a.flex_grow]}>
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}
              numberOfLines={!showFull ? 6 : undefined}
              selectable={true}
              emoji>
              {replyTo.text}
            </Text>
          </View>
          {images && !replyTo.moderation?.ui('contentMedia').blur && (
            <ComposerReplyToImages images={images} totalNumber={totalNumber} />
          )}
        </View>
        {showFull && parsedQuoteEmbed && parsedQuoteEmbed.type === 'post' && (
          <QuoteEmbed embed={parsedQuoteEmbed} linkDisabled />
        )}
      </View>
    </Pressable>
  )
}

function galleryItemsToImages(
  items: AppBskyEmbedGallery.View['items'],
): AppBskyEmbedImages.ViewImage[] {
  // The reply-to thumbnail only renders up to 4 tiles; slicing here keeps
  // the existing layout switch valid for galleries up to 10 items.
  return items
    .filter(AppBskyEmbedGallery.isViewImage)
    .slice(0, 4)
    .map(item => ({
      thumb: item.thumbnail,
      fullsize: item.fullsize,
      alt: item.alt,
      aspectRatio: item.aspectRatio,
    }))
}

function ComposerReplyToImages({
  images,
  totalNumber,
}: {
  images: AppBskyEmbedImages.ViewImage[]
  totalNumber: number
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_xs,
        a.overflow_hidden,
        a.mt_2xs,
        a.mx_xs,
        {
          height: 64,
          width: 64,
        },
      ]}>
      {(images.length === 1 && (
        <Image
          source={{uri: images[0].thumb}}
          style={[a.flex_1]}
          accessibilityIgnoresInvertColors
          useAppleWebpCodec
        />
      )) ||
        (images.length === 2 && (
          <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
            <Image
              source={{uri: images[0].thumb}}
              style={[a.flex_1]}
              accessibilityIgnoresInvertColors
              useAppleWebpCodec
            />
            <Image
              source={{uri: images[1].thumb}}
              style={[a.flex_1]}
              accessibilityIgnoresInvertColors
              useAppleWebpCodec
            />
          </View>
        )) ||
        (images.length === 3 && (
          <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
            <Image
              source={{uri: images[0].thumb}}
              style={[a.flex_1]}
              accessibilityIgnoresInvertColors
              useAppleWebpCodec
            />
            <View style={[a.flex_1, a.gap_2xs]}>
              <Image
                source={{uri: images[1].thumb}}
                style={[a.flex_1]}
                accessibilityIgnoresInvertColors
                useAppleWebpCodec
              />
              <Image
                source={{uri: images[2].thumb}}
                style={[a.flex_1]}
                accessibilityIgnoresInvertColors
                useAppleWebpCodec
              />
            </View>
          </View>
        )) ||
        (images.length === 4 && (
          <View style={[a.flex_1, a.gap_2xs]}>
            <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
              <Image
                source={{uri: images[0].thumb}}
                style={[a.flex_1]}
                accessibilityIgnoresInvertColors
                useAppleWebpCodec
              />
              <Image
                source={{uri: images[1].thumb}}
                style={[a.flex_1]}
                accessibilityIgnoresInvertColors
                useAppleWebpCodec
              />
            </View>
            <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
              <Image
                source={{uri: images[2].thumb}}
                style={[a.flex_1]}
                accessibilityIgnoresInvertColors
                useAppleWebpCodec
              />
              <View style={[a.relative, a.flex_1]}>
                <Image
                  source={{uri: images[3].thumb}}
                  style={[a.flex_1]}
                  accessibilityIgnoresInvertColors
                  useAppleWebpCodec
                />
                {totalNumber > 4 && (
                  <View
                    style={[
                      a.absolute,
                      a.inset_0,
                      a.align_center,
                      a.justify_center,
                      {backgroundColor: utils.alpha(t.palette.black, 0.6)},
                    ]}>
                    <Text
                      style={[
                        a.text_xs,
                        a.text_center,
                        t.atoms.shadow_sm,
                        {color: t.palette.white},
                      ]}>
                      <Trans comment="Number of images beyond the first 3">
                        +{totalNumber - 3}
                      </Trans>
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
    </View>
  )
}
