import React from 'react'
import Animated, {useSharedValue} from 'react-native-reanimated'
import {NativeSyntheticEvent, StyleSheet, View} from 'react-native'
import PagerView from 'react-native-pager-view'
import ImageViewerFooter from 'view/com/imageviewer/ImageViewerFooter'
import ImageViewerHeader from 'view/com/imageviewer/ImageViewerHeader'
import ImageViewerItem from 'view/com/imageviewer/ImageViewerItem'
import {gestureHandlerRootHOC} from 'react-native-gesture-handler'
import {useImageViewerDefaults} from 'view/com/imageviewer/useImageViewerDefaults'
import {useImageViewerState} from 'state/imageViewer'

function ImageViewer() {
  const {images, initialIndex, hideFooter} = useImageViewerState()

  const {
    accessoriesVisible,
    setAccessoriesVisible,
    opacity,
    backgroundOpacity,
    accessoryOpacity,
    onCloseViewer,
    containerStyle,
    accessoryStyle,
  } = useImageViewerDefaults()

  const [isScaled, setIsScaled] = React.useState(false)
  const [currentImage, setCurrentImage] = React.useState(images?.[initialIndex])

  const isDragging = useSharedValue(false)

  const onPageSelected = React.useCallback(
    (e: NativeSyntheticEvent<Readonly<{position: number}>>) => {
      setCurrentImage(images?.[e.nativeEvent.position])
    },
    [images],
  )

  const onPageScrollStateChanged = React.useCallback(
    (
      e: NativeSyntheticEvent<
        Readonly<{pageScrollState: 'idle' | 'dragging' | 'settling'}>
      >,
    ) => {
      isDragging.value = e.nativeEvent.pageScrollState !== 'idle'
    },
    [isDragging],
  )

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
        initialPage={initialIndex}
        scrollEnabled={!isScaled}
        overdrag
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}>
        {images?.map((image, i) => (
          <View style={styles.container} key={i}>
            <ImageViewerItem
              image={images[i]}
              index={i}
              initialIndex={initialIndex}
              setIsScaled={setIsScaled}
              setAccessoriesVisible={setAccessoriesVisible}
              onCloseViewer={onCloseViewer}
              opacity={opacity}
              accessoryOpacity={accessoryOpacity}
              backgroundOpacity={backgroundOpacity}
              isDragging={isDragging}
            />
          </View>
        ))}
      </PagerView>
      {!hideFooter && (
        <Animated.View
          style={[styles.accessory, styles.footerAccessory, accessoryStyle]}>
          <ImageViewerFooter
            currentImage={currentImage}
            visible={accessoriesVisible}
          />
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -2, // android
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

export default gestureHandlerRootHOC(ImageViewer)
