import React from 'react'
import Animated from 'react-native-reanimated'
import {Pressable, StyleSheet, View} from 'react-native'
import ImageViewerFooter from 'view/com/imageviewer/ImageViewerFooter'
import ImageViewerHeader from 'view/com/imageviewer/ImageViewerHeader'
import {gestureHandlerRootHOC} from 'react-native-gesture-handler'
import ImageViewerItem from 'view/com/imageviewer/ImageViewerItem'
import {SCREEN_WIDTH} from '@gorhom/bottom-sheet'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useImageViewerDefaults} from 'view/com/imageviewer/useImageViewerDefaults'
import {useImageViewerState} from 'state/imageViewer.tsx'

function ImageViewer() {
  const {isMobile} = useWebMediaQueries()

  const {images, index, hideFooter} = useImageViewerState()

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

  const onPrevPress = React.useCallback(() => {
    setCurrentIndex(prev => {
      if (prev === 0) return prev

      return prev - 1
    })
  }, [])

  const onNextPress = React.useCallback(() => {
    setCurrentIndex(prev => {
      if (prev === images.length - 1) return prev

      return prev + 1
    })
  }, [images])

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[styles.accessory, styles.headerAccessory, accessoryStyle]}>
        <ImageViewerHeader
          onCloseViewer={onCloseViewer}
          visible={accessoriesVisible}
        />
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        style={[styles.scrollButton, styles.leftScrollButton]}
        onPress={onPrevPress}>
        {!isMobile && currentIndex !== 0 && (
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
        )}
      </Pressable>

      <ImageViewerItem
        image={images[currentIndex]}
        initialIndex={index}
        index={index}
        setAccessoriesVisible={setAccessoriesVisible}
        onCloseViewer={onCloseViewer}
        opacity={opacity}
        backgroundOpacity={backgroundOpacity}
        accessoryOpacity={accessoryOpacity}
      />

      <Pressable
        accessibilityRole="button"
        style={[styles.scrollButton, styles.rightScrollButton]}
        onPress={onNextPress}>
        {!isMobile && currentIndex !== images.length - 1 && (
          <View style={styles.scrollButtonInner}>
            <View style={styles.scrollButtonIconContainer}>
              <FontAwesomeIcon icon="chevron-right" size={30} color="white" />
            </View>
          </View>
        )}
      </Pressable>

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

export default gestureHandlerRootHOC(ImageViewer)
