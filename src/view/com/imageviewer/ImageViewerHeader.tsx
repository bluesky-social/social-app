import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {HITSLOP_10} from 'lib/constants'

interface IProps {
  onCloseViewer: () => void
}

export default function ImageViewerHeader({onCloseViewer}: IProps) {
  // Best way to handle this is to just get the safe area top
  const {top} = useSafeAreaInsets()

  // Use an entering/exiting layout animation
  return (
    <View style={[styles.container, {top: top + 10}]}>
      <Pressable
        accessibilityRole="button"
        onPress={onCloseViewer}
        style={styles.button}
        hitSlop={HITSLOP_10}>
        <FontAwesomeIcon icon="x" color="white" />
      </Pressable>
    </View>
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
