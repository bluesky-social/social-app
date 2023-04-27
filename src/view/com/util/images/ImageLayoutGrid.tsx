import React, {useMemo, useState} from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {ImageStyle} from 'expo-image'
import {Dimensions} from 'lib/media/types'
import {AppBskyEmbedImages} from '@atproto/api'
import {GalleryItem} from './Gallery'

export const DELAY_PRESS_IN = 500

interface ImageLayoutGridProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
}

export function ImageLayoutGrid({style, ...props}: ImageLayoutGridProps) {
  const [containerInfo, setContainerInfo] = useState<Dimensions | undefined>()

  const onLayout = (evt: LayoutChangeEvent) => {
    const {width, height} = evt.nativeEvent.layout
    setContainerInfo({
      width,
      height,
    })
  }

  return (
    <View style={style} onLayout={onLayout}>
      {containerInfo ? (
        <ImageLayoutGridInner {...props} containerInfo={containerInfo} />
      ) : undefined}
    </View>
  )
}

interface ImageLayoutGridInnerProps {
  images: AppBskyEmbedImages.ViewImage[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  containerInfo: Dimensions
}

function ImageLayoutGridInner({
  containerInfo,
  ...props
}: ImageLayoutGridInnerProps) {
  const count = props.images.length
  const size1 = useMemo<ImageStyle>(() => {
    if (count === 3) {
      const size = (containerInfo.width - 10) / 3
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [count, containerInfo])
  const size2 = React.useMemo<ImageStyle>(() => {
    if (count === 3) {
      const size = ((containerInfo.width - 10) / 3) * 2 + 5
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [count, containerInfo])

<<<<<<< HEAD
  switch (count) {
    case 2:
      return (
        <View style={styles.flexRow}>
          <GalleryItem index={0} {...props} imageStyle={size1} />
          <GalleryItem index={1} {...props} imageStyle={size1} />
        </View>
      )
    case 3:
      return (
        <View style={styles.flexRow}>
          <GalleryItem index={0} {...props} imageStyle={size2} />
          <View style={styles.flexColumn}>
            <GalleryItem index={1} {...props} imageStyle={size1} />
            <GalleryItem index={2} {...props} imageStyle={size1} />
          </View>
        </View>
      )
    case 4:
      return (
        <View style={styles.flexRow}>
          <View style={styles.flexColumn}>
            <GalleryItem index={0} {...props} imageStyle={size1} />
            <GalleryItem index={2} {...props} imageStyle={size1} />
          </View>
          <View style={styles.flexColumn}>
            <GalleryItem index={1} {...props} imageStyle={size1} />
            <GalleryItem index={3} {...props} imageStyle={size1} />
          </View>
=======
  if (count === 2) {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(0)}
          onPressIn={() => onPressIn?.(0)}
          onLongPress={() => onLongPress?.(0)}
          accessible={true}
          accessibilityRole="image"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(0)
                break
              case 'longpress':
                onLongPress?.(0)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: images[0].thumb}}
            style={size1}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityLabel={images[0].alt}
            accessibilityHint={images[0].alt}
          />
        </TouchableOpacity>
        <View style={styles.wSpace} />
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(1)}
          onPressIn={() => onPressIn?.(1)}
          onLongPress={() => onLongPress?.(1)}
          accessibilityLabel="Open second of two images"
          accessibilityHint="Opens image in viewer"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(1)
                break
              case 'longpress':
                onLongPress?.(1)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: images[1].thumb}}
            style={size1}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityLabel={images[1].alt}
            accessibilityHint={images[1].alt}
          />
        </TouchableOpacity>
      </View>
    )
  }
  if (count === 3) {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(0)}
          onPressIn={() => onPressIn?.(0)}
          onLongPress={() => onLongPress?.(0)}
          accessibilityRole="image"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={action => {
            switch (action.nativeEvent.actionName) {
              case 'press':
                onPress?.(0)
                break
              case 'longpress':
                onLongPress?.(0)
                break
              default:
                break
            }
          }}>
          <Image
            source={{uri: images[0].thumb}}
            style={size2}
            accessible={true}
            accessibilityIgnoresInvertColors
            accessibilityLabel={images[0].alt}
            accessibilityHint={images[0].alt}
          />
        </TouchableOpacity>
        <View style={styles.wSpace} />
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(1)}
            onPressIn={() => onPressIn?.(1)}
            onLongPress={() => onLongPress?.(1)}
            accessible={true}
            accessibilityLabel="Open second of three images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(1)
                  break
                case 'longpress':
                  onLongPress?.(1)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[1].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[1].alt}
              accessibilityHint={images[1].alt}
            />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(2)}
            onPressIn={() => onPressIn?.(2)}
            onLongPress={() => onLongPress?.(2)}
            accessible={true}
            accessibilityLabel="Open last of three images"
            accessibilityHint="Opens image in viewer"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(2)
                  break
                case 'longpress':
                  onLongPress?.(2)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[2].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[2].alt}
              accessibilityHint={images[2].alt}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  if (count === 4) {
    return (
      <View style={styles.flexRow}>
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(0)}
            onPressIn={() => onPressIn?.(0)}
            onLongPress={() => onLongPress?.(0)}
            accessibilityRole="image"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(0)
                  break
                case 'longpress':
                  onLongPress?.(0)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[0].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[0].alt}
              accessibilityHint={images[0].alt}
            />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(2)}
            onPressIn={() => onPressIn?.(2)}
            onLongPress={() => onLongPress?.(2)}
            accessibilityRole="image"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(2)
                  break
                case 'longpress':
                  onLongPress?.(2)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[2].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[2].alt}
              accessibilityHint={images[2].alt}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.wSpace} />
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(1)}
            onPressIn={() => onPressIn?.(1)}
            onLongPress={() => onLongPress?.(1)}
            accessibilityRole="image"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(1)
                  break
                case 'longpress':
                  onLongPress?.(1)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[1].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[1].alt}
              accessibilityHint={images[1].alt}
            />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(3)}
            onPressIn={() => onPressIn?.(3)}
            onLongPress={() => onLongPress?.(3)}
            accessibilityRole="image"
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            onAccessibilityAction={action => {
              switch (action.nativeEvent.actionName) {
                case 'press':
                  onPress?.(3)
                  break
                case 'longpress':
                  onLongPress?.(3)
                  break
                default:
                  break
              }
            }}>
            <Image
              source={{uri: images[3].thumb}}
              style={size1}
              accessible={true}
              accessibilityIgnoresInvertColors
              accessibilityLabel={images[3].alt}
              accessibilityHint={images[3].alt}
            />
          </TouchableOpacity>
>>>>>>> a17654f0 (Wrap up)
        </View>
      )
    default:
      return null
  }
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row', gap: 5},
  flexColumn: {flexDirection: 'column', gap: 5},
})
