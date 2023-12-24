import React from 'react'
import {useImageViewer} from 'view/com/imageviewer/ImageViewerContext'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {NativeSyntheticEvent, StyleSheet, View} from 'react-native'
import {ImageViewerHeader} from 'view/com/imageviewer/ImageViewerHeader'
import {ImageViewerFooter} from 'view/com/imageviewer/ImageViewerFooter'
import {ImageViewerItem} from 'view/com/imageviewer/ImageViewerItem'
import PagerView from 'react-native-pager-view'
import {gestureHandlerRootHOC} from 'react-native-gesture-handler'

function ImageViewerInner() {
  const {state, dispatch} = useImageViewer()
  const {images, index, isVisible, measurement} = state

  const [isScaled, setIsScaled] = React.useState(false)
  const [accessoriesVisible, setAccessoriesVisible] = React.useState(true)
  const [currentImage, setCurrentImage] = React.useState(images?.[index])

  const opacity = useSharedValue(1)
  const backgroundOpacity = useSharedValue(0)
  const accessoryOpacity = useSharedValue(0)

  // Reset the viewer whenever it closes
  React.useEffect(() => {
    if (isVisible) return

    opacity.value = 1
    backgroundOpacity.value = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  const onCloseViewer = React.useCallback(() => {
    accessoryOpacity.value = withTiming(0, {duration: 200})
    opacity.value = withTiming(0, {duration: 200}, () => {
      runOnJS(dispatch)({
        type: 'setVisible',
        payload: false,
      })
    })
  }, [accessoryOpacity, dispatch, opacity])

  const onPageSelected = React.useCallback(
    (e: NativeSyntheticEvent<Readonly<{position: number}>>) => {
      setCurrentImage(images?.[e.nativeEvent.position])
    },
    [images],
  )

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }))

  const accessoryStyle = useAnimatedStyle(() => ({
    opacity: accessoryOpacity.value,
  }))

  if (!currentImage) return null

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[styles.accessory, styles.headerAccessory, accessoryStyle]}>
        <ImageViewerHeader
          onCloseViewer={onCloseViewer}
          visible={accessoriesVisible}
        />
      </Animated.View>
      <PagerView
        style={styles.container}
        initialPage={index}
        scrollEnabled={!isScaled}
        overdrag
        onPageSelected={onPageSelected}>
        {images?.map((image, i) => (
          <View style={styles.container} key={i}>
            <ImageViewerItem
              image={images[i]}
              index={i}
              initialIndex={index}
              measurement={measurement}
              isVisible={isVisible}
              setIsScaled={setIsScaled}
              setAccessoriesVisible={setAccessoriesVisible}
              onCloseViewer={onCloseViewer}
              opacity={opacity}
              accessoryOpacity={accessoryOpacity}
              backgroundOpacity={backgroundOpacity}
            />
          </View>
        ))}
      </PagerView>
      <Animated.View
        style={[styles.accessory, styles.footerAccessory, accessoryStyle]}>
        <ImageViewerFooter
          currentImage={currentImage}
          visible={accessoriesVisible}
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -2, // for android >_<
  },
  accessory: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
  },
  headerAccessory: {
    top: 0,
  },
  footerAccessory: {
    bottom: 0,
  },
})

export const ImageViewer = gestureHandlerRootHOC(ImageViewerInner)
