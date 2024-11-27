import React from 'react'
import {Pressable, StyleProp, View, ViewStyle} from 'react-native'
import {Image, ImageStyle} from 'expo-image'
import {AppBskyEmbedImages} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HandleRef} from '#/lib/hooks/useHandleRef'
import {Dimensions} from '#/lib/media/types'
import {useLargeAltBadgeEnabled} from '#/state/preferences/large-alt-badge'
import {PostEmbedViewContext} from '#/view/com/util/post-embeds/types'
import {atoms as a, useTheme} from '#/alf'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'

type EventFunction = (index: number) => void

interface Props {
  images: AppBskyEmbedImages.ViewImage[]
  index: number
  onPress?: (
    index: number,
    containerRefs: HandleRef[],
    fetchedDims: (Dimensions | null)[],
  ) => void
  onLongPress?: EventFunction
  onPressIn?: EventFunction
  imageStyle?: StyleProp<ImageStyle>
  viewContext?: PostEmbedViewContext
  insetBorderStyle?: StyleProp<ViewStyle>
  containerRefs: HandleRef[]
  thumbDimsRef: React.MutableRefObject<(Dimensions | null)[]>
}

export function GalleryItem({
  images,
  index,
  imageStyle,
  onPress,
  onPressIn,
  onLongPress,
  viewContext,
  insetBorderStyle,
  containerRefs,
  thumbDimsRef,
}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const largeAltBadge = useLargeAltBadgeEnabled()
  const image = images[index]
  const hasAlt = !!image.alt
  const hideBadges =
    viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
  return (
    <View style={a.flex_1} ref={containerRefs[index]} collapsable={false}>
      <Pressable
        onPress={
          onPress
            ? () => onPress(index, containerRefs, thumbDimsRef.current.slice())
            : undefined
        }
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={[
          a.flex_1,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          imageStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={image.alt || _(msg`Image`)}
        accessibilityHint="">
        <Image
          source={{uri: image.thumb}}
          style={[a.flex_1]}
          accessible={true}
          accessibilityLabel={image.alt}
          accessibilityHint=""
          accessibilityIgnoresInvertColors
          onLoad={e => {
            thumbDimsRef.current[index] = {
              width: e.source.width,
              height: e.source.height,
            }
          }}
        />
        <MediaInsetBorder style={insetBorderStyle} />
      </Pressable>
      {hasAlt && !hideBadges ? (
        <View
          accessible={false}
          style={[
            a.absolute,
            a.flex_row,
            a.align_center,
            a.rounded_xs,
            t.atoms.bg_contrast_25,
            {
              gap: 3,
              padding: 3,
              bottom: a.p_xs.padding,
              right: a.p_xs.padding,
              opacity: 0.8,
            },
            largeAltBadge && [
              {
                gap: 4,
                padding: 5,
              },
            ],
          ]}>
          <Text
            style={[a.font_heavy, largeAltBadge ? a.text_xs : {fontSize: 8}]}>
            ALT
          </Text>
        </View>
      ) : null}
    </View>
  )
}
