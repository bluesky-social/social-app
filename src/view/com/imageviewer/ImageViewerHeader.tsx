import React from 'react'
import {Pressable, StyleSheet} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {HITSLOP_10} from 'lib/constants'

interface IProps {
  onCloseViewer: () => void
  visible: boolean
}

export default function ImageViewerHeader({onCloseViewer, visible}: IProps) {
  // Best way to handle this is to just get the safe area top
  const {top} = useSafeAreaInsets()

  // Don't render if not visible
  if (!visible) return null

  // Use an entering/exiting layout animation
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.container, {top: top + 10}]}>
      <Pressable
        accessibilityRole="button"
        onPress={onCloseViewer}
        style={styles.button}
        hitSlop={HITSLOP_10}>
        <FontAwesomeIcon icon="x" color="white" />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },

  button: {
    position: 'absolute',
    right: 15,
    padding: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
})
