import React from 'react'
import {LayoutAnimation, Pressable, StyleSheet, View} from 'react-native'
import {Image} from 'expo-image'
import {
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {ComposerOptsPostRef} from '#/state/shell/composer'
import {MaybeQuoteEmbed} from '#/view/com/util/post-embeds/QuoteEmbed'
import {Text} from '#/view/com/util/text/Text'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'

export function ComposerReplyTo({replyTo}: {replyTo: ComposerOptsPostRef}) {
  const t = useTheme()
  const {_} = useLingui()
  const {embed} = replyTo

  const [showFull, setShowFull] = React.useState(false)

  const onPress = React.useCallback(() => {
    setShowFull(prev => !prev)
    LayoutAnimation.configureNext({
      duration: 350,
      update: {type: 'spring', springDamping: 0.7},
    })
  }, [])

  const quoteEmbed = React.useMemo(() => {
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

  const images = React.useMemo(() => {
    if (AppBskyEmbedImages.isView(embed)) {
      return embed.images
    } else if (
      AppBskyEmbedRecordWithMedia.isView(embed) &&
      AppBskyEmbedImages.isView(embed.media)
    ) {
      return embed.media.images
    }
  }, [embed])

  return (
    <Pressable
      style={[t.atoms.border_contrast_medium, styles.replyToLayout]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={_(
        msg`Expand or collapse the full post you are replying to`,
      )}
      accessibilityHint={_(
        msg`Expand or collapse the full post you are replying to`,
      )}>
      <PreviewableUserAvatar
        size={50}
        profile={replyTo.author}
        moderation={replyTo.moderation?.ui('avatar')}
        type={replyTo.author.associated?.labeler ? 'labeler' : 'user'}
      />
      <View style={styles.replyToPost}>
        <Text type="xl-medium" style={t.atoms.text} numberOfLines={1} emoji>
          {sanitizeDisplayName(
            replyTo.author.displayName || sanitizeHandle(replyTo.author.handle),
          )}
        </Text>
        <View style={styles.replyToBody}>
          <View style={styles.replyToText}>
            <Text
              type="post-text"
              style={t.atoms.text}
              numberOfLines={!showFull ? 6 : undefined}
              emoji>
              {replyTo.text}
            </Text>
          </View>
          {images && !replyTo.moderation?.ui('contentMedia').blur && (
            <ComposerReplyToImages images={images} showFull={showFull} />
          )}
        </View>
        {showFull && quoteEmbed && <MaybeQuoteEmbed embed={quoteEmbed} />}
      </View>
    </Pressable>
  )
}

function ComposerReplyToImages({
  images,
}: {
  images: AppBskyEmbedImages.ViewImage[]
  showFull: boolean
}) {
  return (
    <View style={[styles.imagesContainer, a.mx_xs]}>
      {(images.length === 1 && (
        <Image
          source={{uri: images[0].thumb}}
          style={[a.flex_1]}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      )) ||
        (images.length === 2 && (
          <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
            <Image
              source={{uri: images[0].thumb}}
              style={[a.flex_1]}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
            <Image
              source={{uri: images[1].thumb}}
              style={[a.flex_1]}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
          </View>
        )) ||
        (images.length === 3 && (
          <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
            <Image
              source={{uri: images[0].thumb}}
              style={[a.flex_1]}
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
            />
            <View style={[a.flex_1, a.gap_2xs]}>
              <Image
                source={{uri: images[1].thumb}}
                style={[a.flex_1]}
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
              <Image
                source={{uri: images[2].thumb}}
                style={[a.flex_1]}
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
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
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
              <Image
                source={{uri: images[1].thumb}}
                style={[a.flex_1]}
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View style={[a.flex_1, a.flex_row, a.gap_2xs]}>
              <Image
                source={{uri: images[2].thumb}}
                style={[a.flex_1]}
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
              <Image
                source={{uri: images[3].thumb}}
                style={[a.flex_1]}
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
            </View>
          </View>
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  replyToLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    paddingBottom: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  replyToPost: {
    flex: 1,
    paddingLeft: 13,
    paddingRight: 8,
  },
  replyToBody: {
    flexDirection: 'row',
    gap: 10,
  },
  replyToText: {
    flex: 1,
    flexGrow: 1,
  },
  imagesContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 2,
    height: 64,
    width: 64,
  },
})
