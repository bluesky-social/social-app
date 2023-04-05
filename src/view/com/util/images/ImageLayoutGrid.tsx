import {Dimensions} from 'lib/media/types'
import React, {useState} from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {Image, ImageStyle} from 'expo-image'

export const DELAY_PRESS_IN = 500

export type ImageLayoutGridType = 'two' | 'three' | 'four'

export function ImageLayoutGrid({
  type,
  uris,
  onPress,
  onLongPress,
  onPressIn,
  style,
}: {
  type: ImageLayoutGridType
  uris: string[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  style?: StyleProp<ViewStyle>
}) {
  const [containerInfo, setContainerInfo] = useState<Dimensions | undefined>()

  const onLayout = (evt: LayoutChangeEvent) => {
    setContainerInfo({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    })
  }

  return (
    <View style={style} onLayout={onLayout}>
      {containerInfo ? (
        <ImageLayoutGridInner
          type={type}
          uris={uris}
          onPress={onPress}
          onPressIn={onPressIn}
          onLongPress={onLongPress}
          containerInfo={containerInfo}
        />
      ) : undefined}
    </View>
  )
}

function ImageLayoutGridInner({
  type,
  uris,
  onPress,
  onLongPress,
  onPressIn,
  containerInfo,
}: {
  type: ImageLayoutGridType
  uris: string[]
  onPress?: (index: number) => void
  onLongPress?: (index: number) => void
  onPressIn?: (index: number) => void
  containerInfo: Dimensions
}) {
  const size1 = React.useMemo<ImageStyle>(() => {
    if (type === 'three') {
      const size = (containerInfo.width - 10) / 3
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [type, containerInfo])
  const size2 = React.useMemo<ImageStyle>(() => {
    if (type === 'three') {
      const size = ((containerInfo.width - 10) / 3) * 2 + 5
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    } else {
      const size = (containerInfo.width - 5) / 2
      return {width: size, height: size, resizeMode: 'cover', borderRadius: 4}
    }
  }, [type, containerInfo])

  if (type === 'two') {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(0)}
          onPressIn={() => onPressIn?.(0)}
          onLongPress={() => onLongPress?.(0)}>
          <Image source={{uri: uris[0]}} style={size1} />
        </TouchableOpacity>
        <View style={styles.wSpace} />
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(1)}
          onPressIn={() => onPressIn?.(1)}
          onLongPress={() => onLongPress?.(1)}>
          <Image source={{uri: uris[1]}} style={size1} />
        </TouchableOpacity>
      </View>
    )
  }
  if (type === 'three') {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity
          delayPressIn={DELAY_PRESS_IN}
          onPress={() => onPress?.(0)}
          onPressIn={() => onPressIn?.(0)}
          onLongPress={() => onLongPress?.(0)}>
          <Image source={{uri: uris[0]}} style={size2} />
        </TouchableOpacity>
        <View style={styles.wSpace} />
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(1)}
            onPressIn={() => onPressIn?.(1)}
            onLongPress={() => onLongPress?.(1)}>
            <Image source={{uri: uris[1]}} style={size1} />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(2)}
            onPressIn={() => onPressIn?.(2)}
            onLongPress={() => onLongPress?.(2)}>
            <Image source={{uri: uris[2]}} style={size1} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  if (type === 'four') {
    return (
      <View style={styles.flexRow}>
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(0)}
            onPressIn={() => onPressIn?.(0)}
            onLongPress={() => onLongPress?.(0)}>
            <Image source={{uri: uris[0]}} style={size1} />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(2)}
            onPressIn={() => onPressIn?.(2)}
            onLongPress={() => onLongPress?.(2)}>
            <Image source={{uri: uris[2]}} style={size1} />
          </TouchableOpacity>
        </View>
        <View style={styles.wSpace} />
        <View>
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(1)}
            onPressIn={() => onPressIn?.(1)}
            onLongPress={() => onLongPress?.(1)}>
            <Image source={{uri: uris[1]}} style={size1} />
          </TouchableOpacity>
          <View style={styles.hSpace} />
          <TouchableOpacity
            delayPressIn={DELAY_PRESS_IN}
            onPress={() => onPress?.(3)}
            onPressIn={() => onPressIn?.(3)}
            onLongPress={() => onLongPress?.(3)}>
            <Image source={{uri: uris[3]}} style={size1} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  return <View />
}

const styles = StyleSheet.create({
  flexRow: {flexDirection: 'row'},
  wSpace: {width: 5},
  hSpace: {height: 5},
})
