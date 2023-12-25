import React from 'react'
import {Modal, StyleSheet, View} from 'react-native'
import ImageViewer from 'view/com/imageviewer/ImageViewer'
import {useImageViewerState} from 'state/imageViewer'

export default function ImageViewerModal() {
  const {isVisible} = useImageViewerState()

  return (
    <View style={styles.container}>
      <Modal visible={isVisible} transparent hardwareAccelerated>
        <ImageViewer />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
  },
})
