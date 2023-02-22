/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {ComponentType, useCallback, useRef, useEffect} from 'react'
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
} from 'react-native'
import {Modal} from '../../modals/Modal'

import ImageItem from './components/ImageItem/ImageItem'
import ImageDefaultHeader from './components/ImageDefaultHeader'

import useAnimatedComponents from './hooks/useAnimatedComponents'
import useImageIndexChange from './hooks/useImageIndexChange'
import useRequestClose from './hooks/useRequestClose'
import {ImageSource} from './@types'

type Props = {
  images: ImageSource[]
  keyExtractor?: (imageSrc: ImageSource, index: number) => string
  imageIndex: number
  visible: boolean
  onRequestClose: () => void
  onLongPress?: (image: ImageSource) => void
  onImageIndexChange?: (imageIndex: number) => void
  presentationStyle?: ModalProps['presentationStyle']
  animationType?: ModalProps['animationType']
  backgroundColor?: string
  swipeToCloseEnabled?: boolean
  doubleTapToZoomEnabled?: boolean
  delayLongPress?: number
  HeaderComponent?: ComponentType<{imageIndex: number}>
  FooterComponent?: ComponentType<{imageIndex: number}>
}

const DEFAULT_BG_COLOR = '#000'
const DEFAULT_DELAY_LONG_PRESS = 800
const SCREEN = Dimensions.get('screen')
const SCREEN_WIDTH = SCREEN.width

function ImageViewing({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onLongPress = () => {},
  onImageIndexChange,
  backgroundColor = DEFAULT_BG_COLOR,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const imageList = useRef<VirtualizedList<ImageSource>>(null)
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose)
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN)
  const [headerTransform, footerTransform, toggleBarsVisible] =
    useAnimatedComponents()

  useEffect(() => {
    if (onImageIndexChange) {
      onImageIndexChange(currentImageIndex)
    }
  }, [currentImageIndex, onImageIndexChange])

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({scrollEnabled: !isScaled})
      toggleBarsVisible(!isScaled)
    },
    [toggleBarsVisible],
  )

  const onLayout = useCallback(() => {
    if (imageIndex) {
      imageList.current?.scrollToIndex({index: imageIndex, animated: false})
    }
  }, [imageList, imageIndex])

  if (!visible) {
    return null
  }

  return (
    <View style={styles.screen} onLayout={onLayout}>
      <Modal />
      <View style={[styles.container, {opacity, backgroundColor}]}>
        <Animated.View style={[styles.header, {transform: headerTransform}]}>
          {typeof HeaderComponent !== 'undefined' ? (
            React.createElement(HeaderComponent, {
              imageIndex: currentImageIndex,
            })
          ) : (
            <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
          )}
        </Animated.View>
        <VirtualizedList
          ref={imageList}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          getItem={(_, index) => images[index]}
          getItemCount={() => images.length}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({item: imageSrc}) => (
            <ImageItem
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={onRequestCloseEnhanced}
              onLongPress={onLongPress}
              delayLongPress={delayLongPress}
              swipeToCloseEnabled={swipeToCloseEnabled}
              doubleTapToZoomEnabled={doubleTapToZoomEnabled}
            />
          )}
          onMomentumScrollEnd={onScroll}
          //@ts-ignore
          keyExtractor={(imageSrc, index) =>
            keyExtractor
              ? keyExtractor(imageSrc, index)
              : typeof imageSrc === 'number'
              ? `${imageSrc}`
              : imageSrc.uri
          }
        />
        {typeof FooterComponent !== 'undefined' && (
          <Animated.View style={[styles.footer, {transform: footerTransform}]}>
            {React.createElement(FooterComponent, {
              imageIndex: currentImageIndex,
            })}
          </Animated.View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    top: 0,
  },
  footer: {
    position: 'absolute',
    width: '100%',
    zIndex: 1,
    bottom: 0,
  },
})

const EnhancedImageViewing = (props: Props) => (
  <ImageViewing key={props.imageIndex} {...props} />
)

export default EnhancedImageViewing
