import React, {useCallback} from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {
  openPicker,
  openCamera,
  openCropper,
} from 'react-native-image-crop-picker'

const IMAGE_PARAMS = {
  width: 500,
  height: 500,
  freeStyleCropEnabled: true,
  forceJpg: true, // ios only
  compressImageQuality: 0.7,
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
  const handleOpenCamera = useCallback(() => {
    openCamera({
      mediaType: 'photo',
      cropping: true,
      ...IMAGE_PARAMS,
    }).then(
      item => {
        onSelectPhotos([item.path, ...selectedPhotos])
      },
      _err => {
        // ignore
      },
    )
  }, [selectedPhotos, onSelectPhotos])

  const handleSelectPhoto = useCallback(
    async (uri: string) => {
      const img = await openCropper({
        mediaType: 'photo',
        path: uri,
        ...IMAGE_PARAMS,
      })
      onSelectPhotos([img.path, ...selectedPhotos])
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

      for await (const image of items) {
        const img = await openCropper({
          mediaType: 'photo',
          path: image.path,
          ...IMAGE_PARAMS,
        })
        result.push(img.path)
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
