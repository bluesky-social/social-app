/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {
  ComponentType,
  useCallback,
  useRef,
  useMemo,
  useState,
} from 'react'
import {
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Platform,
} from 'react-native'
import {ModalsContainer} from '../../modals/Modal'

import ImageItem from './components/ImageItem/ImageItem'
import ImageDefaultHeader from './components/ImageDefaultHeader'

import {ImageSource} from './@types'
import {Edge, SafeAreaView} from 'react-native-safe-area-context'

type Props = {
  images: ImageSource[]
  keyExtractor?: (imageSrc: ImageSource, index: number) => string
  imageIndex: number
  visible: boolean
  onRequestClose: () => void
  presentationStyle?: ModalProps['presentationStyle']
  animationType?: ModalProps['animationType']
  backgroundColor?: string
  HeaderComponent?: ComponentType<{imageIndex: number}>
  FooterComponent?: ComponentType<{imageIndex: number}>
}

const DEFAULT_BG_COLOR = '#000'
const SCREEN = Dimensions.get('screen')
const SCREEN_WIDTH = SCREEN.width
const INITIAL_POSITION = {x: 0, y: 0}
const ANIMATION_CONFIG = {
  duration: 200,
  useNativeDriver: true,
}

function ImageViewing({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  backgroundColor = DEFAULT_BG_COLOR,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const imageList = useRef<VirtualizedList<ImageSource>>(null)
  const [opacity, setOpacity] = useState(1)
  const [currentImageIndex, setImageIndex] = useState(imageIndex)
  const [headerTranslate] = useState(
    () => new Animated.ValueXY(INITIAL_POSITION),
  )
  const [footerTranslate] = useState(
    () => new Animated.ValueXY(INITIAL_POSITION),
  )

  const toggleBarsVisible = (isVisible: boolean) => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(headerTranslate.y, {...ANIMATION_CONFIG, toValue: 0}),
        Animated.timing(footerTranslate.y, {...ANIMATION_CONFIG, toValue: 0}),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(headerTranslate.y, {
          ...ANIMATION_CONFIG,
          toValue: -300,
        }),
        Animated.timing(footerTranslate.y, {
          ...ANIMATION_CONFIG,
          toValue: 300,
        }),
      ]).start()
    }
  }

  const onRequestCloseEnhanced = () => {
    setOpacity(0)
    onRequestClose()
    setTimeout(() => setOpacity(1), 0)
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: {x: scrollX},
      },
    } = event

    if (SCREEN.width) {
      const nextIndex = Math.round(scrollX / SCREEN.width)
      setImageIndex(nextIndex < 0 ? 0 : nextIndex)
    }
  }

  const onZoom = (isScaled: boolean) => {
    // @ts-ignore
    imageList?.current?.setNativeProps({scrollEnabled: !isScaled})
    toggleBarsVisible(!isScaled)
  }

  const edges = useMemo(() => {
    if (Platform.OS === 'android') {
      return ['top', 'bottom', 'left', 'right'] satisfies Edge[]
    }
    return ['left', 'right'] satisfies Edge[] // iOS, so no top/bottom safe area
  }, [])

  const onLayout = useCallback(() => {
    if (imageIndex) {
      imageList.current?.scrollToIndex({index: imageIndex, animated: false})
    }
  }, [imageList, imageIndex])

  if (!visible) {
    return null
  }

  const headerTransform = headerTranslate.getTranslateTransform()
  const footerTransform = footerTranslate.getTranslateTransform()
  return (
    <SafeAreaView
      style={styles.screen}
      onLayout={onLayout}
      edges={edges}
      aria-modal
      accessibilityViewIsModal>
      <ModalsContainer />
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
    </SafeAreaView>
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
    pointerEvents: 'box-none',
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
