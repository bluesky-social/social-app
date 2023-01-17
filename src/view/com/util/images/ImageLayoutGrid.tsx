import React from 'react'
import {
  Image,
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'

interface Dim {
  width: number
  height: number
}

export type ImageLayoutGridType = 'two' | 'three' | 'four'

export function ImageLayoutGrid({
  type,
  uris,
  onPress,
  style,
}: {
  type: ImageLayoutGridType
  uris: string[]
  onPress?: (index: number) => void
  style?: StyleProp<ViewStyle>
}) {
  const [containerInfo, setContainerInfo] = React.useState<Dim | undefined>()

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
  containerInfo,
}: {
  type: ImageLayoutGridType
  uris: string[]
  onPress?: (index: number) => void
  containerInfo: Dim
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
        <TouchableWithoutFeedback onPress={() => onPress?.(0)}>
          <Image source={{uri: uris[0]}} style={size1} />
        </TouchableWithoutFeedback>
        <View style={styles.wSpace} />
        <TouchableWithoutFeedback onPress={() => onPress?.(1)}>
          <Image source={{uri: uris[1]}} style={size1} />
        </TouchableWithoutFeedback>
      </View>
    )
  }
  if (type === 'three') {
    return (
      <View style={styles.flexRow}>
        <TouchableWithoutFeedback onPress={() => onPress?.(0)}>
          <Image source={{uri: uris[0]}} style={size2} />
        </TouchableWithoutFeedback>
        <View style={styles.wSpace} />
        <View>
          <TouchableWithoutFeedback onPress={() => onPress?.(1)}>
            <Image source={{uri: uris[1]}} style={size1} />
          </TouchableWithoutFeedback>
          <View style={{height: 5}} />
          <TouchableWithoutFeedback onPress={() => onPress?.(2)}>
            <Image source={{uri: uris[2]}} style={size1} />
          </TouchableWithoutFeedback>
        </View>
      </View>
    )
  }
  if (type === 'four') {
    return (
      <View style={styles.flexRow}>
        <View>
          <TouchableWithoutFeedback onPress={() => onPress?.(0)}>
            <Image source={{uri: uris[0]}} style={size1} />
          </TouchableWithoutFeedback>
          <View style={styles.hSpace} />
          <TouchableWithoutFeedback onPress={() => onPress?.(1)}>
            <Image source={{uri: uris[1]}} style={size1} />
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.wSpace} />
        <View>
          <TouchableWithoutFeedback onPress={() => onPress?.(2)}>
            <Image source={{uri: uris[2]}} style={size1} />
          </TouchableWithoutFeedback>
          <View style={styles.hSpace} />
          <TouchableWithoutFeedback onPress={() => onPress?.(3)}>
            <Image source={{uri: uris[3]}} style={size1} />
          </TouchableWithoutFeedback>
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
