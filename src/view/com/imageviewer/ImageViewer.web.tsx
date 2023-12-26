import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
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

  const {images, initialIndex, hideFooter} = useImageViewerState()
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
    setIsScaled,
  } = useImageViewerDefaults()

  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)

  const scrollViewRef = React.useRef<ScrollView>(null)
  const previousScrollOffset = React.useRef(0)

  // This is used both when we open the viewer and when we change items on desktop
  const scrollToImage = React.useCallback(
    (index: number, animated = true) => {
      scrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated,
      })

      setCurrentIndex(index)
    },
    [screenWidth],
  )

  const onPrevPress = React.useCallback(() => {
    if (currentIndex === 0) return

    scrollToImage(currentIndex - 1, isMobile)
  }, [currentIndex, scrollToImage, isMobile])

  const onNextPress = React.useCallback(() => {
    if (currentIndex === images.length - 1) return

    scrollToImage(currentIndex + 1, isMobile)
  }, [currentIndex, images, scrollToImage, isMobile])

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseViewer()
      } else if (e.key === 'ArrowLeft') {
        onPrevPress()
      } else if (e.key === 'ArrowRight') {
        onNextPress()
      }
    },
    [onCloseViewer, onPrevPress, onNextPress],
  )

  React.useEffect(() => {
    // Set the initial index (no initial index on a scrollview)
    scrollToImage(initialIndex, false)

    // Disabling this warning. We only want this to run whenever the viewer opens. scrollToImage isn't stable and will
    // change whenever the window size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // Add keydown listener
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

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

      const newIndex = x / screenWidth
      setCurrentIndex(newIndex)
    },
    [screenWidth],
  )

  const onDragStart = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
    },
    [],
  )

  return (
    <div draggable={false} onDragStart={onDragStart}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View
          style={[styles.accessory, styles.headerAccessory, accessoryStyle]}>
          <ImageViewerHeader onCloseViewer={onCloseViewer} visible={true} />
        </Animated.View>

        {currentIndex !== 0 && accessoriesVisible && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.sidebar, styles.leftSidebar]}>
            <Pressable
              onPress={onPrevPress}
              style={styles.scrollButton}
              accessibilityRole="button"
              accessibilityLabel="Previous Image"
              accessibilityHint="Navigates to the previous image">
              <FontAwesomeIcon
                icon="chevron-right"
                size={30}
                color="white"
                style={styles.chevronLeft}
              />
            </Pressable>
          </Animated.View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={screenWidth}
          disableIntervalMomentum
          ref={scrollViewRef}
          scrollEnabled={false}
          scrollEventThrottle={0}
          onScroll={isMobile ? onScroll : undefined}
          style={{flex: 1}}
          contentContainerStyle={{flex: 1}}>
          {images.map((image, i) => (
            <View key={i} style={{height: screenHeight, width: screenWidth}}>
              <ImageViewerItem
                image={image}
                initialIndex={initialIndex}
                index={i}
                setAccessoriesVisible={setAccessoriesVisible}
                onCloseViewer={onCloseViewer}
                opacity={opacity}
                backgroundOpacity={backgroundOpacity}
                accessoryOpacity={accessoryOpacity}
                setIsScaled={setIsScaled}
              />
            </View>
          ))}
        </ScrollView>

        {currentIndex !== images.length - 1 && accessoriesVisible && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.sidebar, styles.rightSidebar]}>
            <Pressable
              onPress={onNextPress}
              style={styles.scrollButton}
              accessibilityRole="button"
              accessibilityLabel="Next Image"
              accessibilityHint="Navigates to the next image">
              <FontAwesomeIcon icon="chevron-right" size={30} color="white" />
            </Pressable>
          </Animated.View>
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
    </div>
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
  sidebar: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: SCREEN_WIDTH > 600 ? 150 : 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSidebar: {
    left: 0,
  },
  rightSidebar: {
    right: 0,
  },
  scrollButton: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chevronLeft: {
    transform: [{rotateZ: '180deg'}], // I promise I'm not crazy...but why is chevron-left not working? TODO
  },
})

export default ImageViewer
