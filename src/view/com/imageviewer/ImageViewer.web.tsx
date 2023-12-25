import React from 'react'
import Animated from 'react-native-reanimated'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import ImageViewerFooter from 'view/com/imageviewer/ImageViewerFooter'
import ImageViewerHeader from 'view/com/imageviewer/ImageViewerHeader'
import ImageViewerItem from 'view/com/imageviewer/ImageViewerItem'
import {SCREEN_WIDTH} from '@gorhom/bottom-sheet'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useImageViewerDefaults} from 'view/com/imageviewer/useImageViewerDefaults'
import {useImageViewerState} from 'state/imageViewer'

function ImageViewer() {
  const {isMobile} = useWebMediaQueries()

  const {images, index, hideFooter} = useImageViewerState()
  const {height: screenHeight, width: screenWidth} = useWindowDimensions()

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

  const [currentIndex, setCurrentIndex] = React.useState(index)

  const scrollViewRef = React.useRef<ScrollView>(null)
  const previousScrollOffset = React.useRef(0)

  // This is used both when we open the viewer and when we change items on desktop
  const scrollToImage = React.useCallback(
    (i: number, animated = true) => {
      scrollViewRef.current?.scrollTo({
        x: i * screenWidth,
        animated,
      })

      setCurrentIndex(i)
    },
    [screenWidth],
  )

  // Set the initial index (no initial index on a scrollview)
  React.useEffect(() => {
    scrollToImage(index, false)
    // Disabling this warning. We only want this to run whenever the viewer opens. scrollToImage isn't stable and will
    // change whenever the window size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPrevPress = React.useCallback(() => {
    scrollToImage(currentIndex - 1)
  }, [currentIndex, scrollToImage])

  const onNextPress = React.useCallback(() => {
    scrollToImage(currentIndex + 1)
  }, [currentIndex, scrollToImage])

  // Fun! This handles the scroll event so that we can update the current index.
  // 1. Get the new offset
  // 2. If the offset has not changed, do nothing. Also, if the offset is not a multiple of the screen width, do nothing.
  // 3. Update the previous scroll offset (even if we set the throttle to zero, this still gets called a few times)
  // 4. Calculate the new index and update state
  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {x} = e.nativeEvent.contentOffset
      if (previousScrollOffset.current === x || x % screenWidth !== 0) return
      previousScrollOffset.current = x

      const newIndex = Math.round(x / screenWidth)
      setCurrentIndex(newIndex)
    },
    [screenWidth],
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

      {currentIndex !== 0 && !isMobile && (
        <Pressable
          accessibilityRole="button"
          style={[styles.scrollButton, styles.leftScrollButton]}
          onPress={onPrevPress}>
          <View style={styles.scrollButtonInner}>
            <View style={styles.scrollButtonIconContainer}>
              <FontAwesomeIcon
                icon="chevron-right"
                size={30}
                color="white"
                style={styles.chevronLeft}
              />
            </View>
          </View>
        </Pressable>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={screenWidth}
        disableIntervalMomentum
        ref={scrollViewRef}
        scrollEnabled={isMobile}
        scrollEventThrottle={0}
        onScroll={isMobile ? onScroll : undefined}>
        {images.map((image, i) => (
          <View key={i} style={{height: screenHeight, width: screenWidth}}>
            <ImageViewerItem
              image={image}
              initialIndex={index}
              index={i}
              setAccessoriesVisible={setAccessoriesVisible}
              onCloseViewer={onCloseViewer}
              opacity={opacity}
              backgroundOpacity={backgroundOpacity}
              accessoryOpacity={accessoryOpacity}
            />
          </View>
        ))}
      </ScrollView>

      {currentIndex !== images.length - 1 && !isMobile && (
        <Pressable
          accessibilityRole="button"
          style={[styles.scrollButton, styles.rightScrollButton]}
          onPress={onNextPress}>
          {!isMobile && (
            <View style={styles.scrollButtonInner}>
              <View style={styles.scrollButtonIconContainer}>
                <FontAwesomeIcon icon="chevron-right" size={30} color="white" />
              </View>
            </View>
          )}
        </Pressable>
      )}

      {!hideFooter && (
        <Animated.View
          style={[styles.accessory, styles.footerAccessory, accessoryStyle]}>
          <ImageViewerFooter
            currentImage={images[currentIndex]}
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
  },
  accessory: {
    position: 'absolute',
    zIndex: 2,
    left: 0,
    right: 0,
  },
  headerAccessory: {
    top: 0,
  },
  footerAccessory: {
    bottom: 0,
  },
  scrollButton: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: SCREEN_WIDTH > 600 ? 150 : 80,
  },
  scrollButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftScrollButton: {
    left: 0,
  },
  rightScrollButton: {
    right: 0,
  },
  scrollButtonIconContainer: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollButtonIcon: {
    color: 'white',
  },
  chevronLeft: {
    transform: [{rotateZ: '180deg'}], // I promise I'm not crazy...but why is chevron-left not working? TODO
  },
})

export default ImageViewer
