/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, {ComponentType, useMemo, useState} from 'react'
import {Animated, StyleSheet, View, ModalProps, Platform} from 'react-native'

import ImageItem from './components/ImageItem/ImageItem'
import ImageDefaultHeader from './components/ImageDefaultHeader'

import {ImageSource} from './@types'
import {Edge, SafeAreaView} from 'react-native-safe-area-context'
import PagerView from 'react-native-pager-view'

type Props = {
  images: ImageSource[]
  initialImageIndex: number
  visible: boolean
  onRequestClose: () => void
  presentationStyle?: ModalProps['presentationStyle']
  animationType?: ModalProps['animationType']
  backgroundColor?: string
  HeaderComponent?: ComponentType<{imageIndex: number}>
  FooterComponent?: ComponentType<{imageIndex: number}>
}

const DEFAULT_BG_COLOR = '#000'
const INITIAL_POSITION = {x: 0, y: 0}
const ANIMATION_CONFIG = {
  duration: 200,
  useNativeDriver: true,
}

function ImageViewing({
  images,
  initialImageIndex,
  visible,
  onRequestClose,
  backgroundColor = DEFAULT_BG_COLOR,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const [isScaled, setIsScaled] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageIndex, setImageIndex] = useState(initialImageIndex)
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

  const onZoom = (nextIsScaled: boolean) => {
    toggleBarsVisible(!nextIsScaled)
    setIsScaled(false)
  }

  const edges = useMemo(() => {
    if (Platform.OS === 'android') {
      return ['top', 'bottom', 'left', 'right'] satisfies Edge[]
    }
    return ['left', 'right'] satisfies Edge[] // iOS, so no top/bottom safe area
  }, [])

  if (!visible) {
    return null
  }

  const headerTransform = headerTranslate.getTranslateTransform()
  const footerTransform = footerTranslate.getTranslateTransform()
  return (
    <SafeAreaView
      style={styles.screen}
      edges={edges}
      aria-modal
      accessibilityViewIsModal>
      <View style={[styles.container, {backgroundColor}]}>
        <Animated.View style={[styles.header, {transform: headerTransform}]}>
          {typeof HeaderComponent !== 'undefined' ? (
            React.createElement(HeaderComponent, {
              imageIndex,
            })
          ) : (
            <ImageDefaultHeader onRequestClose={onRequestClose} />
          )}
        </Animated.View>
        <PagerView
          scrollEnabled={!isScaled}
          initialPage={initialImageIndex}
          onPageSelected={e => {
            setImageIndex(e.nativeEvent.position)
            setIsScaled(false)
          }}
          onPageScrollStateChanged={e => {
            setIsDragging(e.nativeEvent.pageScrollState !== 'idle')
          }}
          overdrag={true}
          style={styles.pager}>
          {images.map(imageSrc => (
            <View key={imageSrc.uri}>
              <ImageItem
                onZoom={onZoom}
                imageSrc={imageSrc}
                onRequestClose={onRequestClose}
                isScrollViewBeingDragged={isDragging}
              />
            </View>
          ))}
        </PagerView>
        {typeof FooterComponent !== 'undefined' && (
          <Animated.View style={[styles.footer, {transform: footerTransform}]}>
            {React.createElement(FooterComponent, {
              imageIndex,
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
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  pager: {
    flex: 1,
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
  <ImageViewing key={props.initialImageIndex} {...props} />
)

export default EnhancedImageViewing
