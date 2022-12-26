import React, {useCallback} from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {
  openPicker,
  openCamera,
  openCropper,
} from 'react-native-image-crop-picker'
import {compressIfNeeded} from '../../../lib/images'

const IMAGE_PARAMS = {
  width: 1000,
  height: 1000,
  freeStyleCropEnabled: true,
  forceJpg: true, // ios only
  compressImageQuality: 1.0,
}

export const PhotoCarouselPicker = ({
  selectedPhotos,
  onSelectPhotos,
  localPhotos,
}: {
  selectedPhotos: string[]
  onSelectPhotos: (v: string[]) => void
  localPhotos: any
}) => {
  const handleOpenCamera = useCallback(async () => {
    try {
      const cameraRes = await openCamera({
        mediaType: 'photo',
        cropping: true,
        ...IMAGE_PARAMS,
      })
      const uri = await compressIfNeeded(cameraRes, 300000)
      onSelectPhotos([uri, ...selectedPhotos])
    } catch (err) {
      // ignore
      console.log('Error using camera', err)
    }
  }, [selectedPhotos, onSelectPhotos])

  const handleSelectPhoto = useCallback(
    async (uri: string) => {
      try {
        const cropperRes = await openCropper({
          mediaType: 'photo',
          path: uri,
          ...IMAGE_PARAMS,
        })
        const finalUri = await compressIfNeeded(cropperRes, 300000)
        onSelectPhotos([finalUri, ...selectedPhotos])
      } catch (err) {
        // ignore
        console.log('Error selecting photo', err)
      }
    },
    [selectedPhotos, onSelectPhotos],
  )

  const handleOpenGallery = useCallback(() => {
    openPicker({
      multiple: true,
      maxFiles: 4 - selectedPhotos.length,
      mediaType: 'photo',
    }).then(async items => {
      const result = []

      for (const image of items) {
        const cropperRes = await openCropper({
          mediaType: 'photo',
          path: image.path,
          ...IMAGE_PARAMS,
        })
        const finalUri = await compressIfNeeded(cropperRes, 300000)
        result.push(finalUri)
      }
      onSelectPhotos([...result, ...selectedPhotos])
    })
  }, [selectedPhotos, onSelectPhotos])

  return (
    <ScrollView
      horizontal
      style={styles.photosContainer}
      showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        style={[styles.galleryButton, styles.photo]}
        onPress={handleOpenCamera}>
        <FontAwesomeIcon
          icon="camera"
          size={24}
          style={{color: colors.blue3}}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.galleryButton, styles.photo]}
        onPress={handleOpenGallery}>
        <FontAwesomeIcon icon="image" style={{color: colors.blue3}} size={24} />
      </TouchableOpacity>
      {localPhotos.photos.map((item: any, index: number) => (
        <TouchableOpacity
          key={`local-image-${index}`}
          style={styles.photoButton}
          onPress={() => handleSelectPhoto(item.node.image.uri)}>
          <Image style={styles.photo} source={{uri: item.node.image.uri}} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  photosContainer: {
    width: '100%',
    maxHeight: 96,
    padding: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  galleryButton: {
    borderWidth: 1,
    borderColor: colors.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    width: 75,
    height: 75,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: colors.gray3,
  },
  photo: {
    width: 75,
    height: 75,
    marginRight: 8,
    borderRadius: 16,
  },
})
