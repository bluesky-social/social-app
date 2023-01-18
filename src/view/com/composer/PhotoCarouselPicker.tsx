import React, {useCallback} from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  openPicker,
  openCamera,
  openCropper,
} from 'react-native-image-crop-picker'
import {
  UserLocalPhotosModel,
  PhotoIdentifier,
} from '../../../state/models/user-local-photos'
import {compressIfNeeded, scaleDownDimensions} from '../../../lib/images'
import {usePalette} from '../../lib/hooks/usePalette'
import {useStores} from '../../../state'

const MAX_WIDTH = 1000
const MAX_HEIGHT = 1000
const MAX_SIZE = 300000

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
  localPhotos: UserLocalPhotosModel
}) => {
  const pal = usePalette('default')
  const store = useStores()
  const handleOpenCamera = useCallback(async () => {
    try {
      const cameraRes = await openCamera({
        mediaType: 'photo',
        cropping: true,
        ...IMAGE_PARAMS,
      })
      const img = await compressIfNeeded(cameraRes, MAX_SIZE)
      onSelectPhotos([...selectedPhotos, img.path])
    } catch (err: any) {
      // ignore
      store.log.warn('Error using camera', err)
    }
  }, [store.log, selectedPhotos, onSelectPhotos])

  const handleSelectPhoto = useCallback(
    async (item: PhotoIdentifier) => {
      try {
        // choose target dimensions based on the original
        // this causes the photo cropper to start with the full image "selected"
        const {width, height} = scaleDownDimensions(
          {width: item.node.image.width, height: item.node.image.height},
          {width: MAX_WIDTH, height: MAX_HEIGHT},
        )
        const cropperRes = await openCropper({
          mediaType: 'photo',
          path: item.node.image.uri,
          ...IMAGE_PARAMS,
          width,
          height,
        })
        const img = await compressIfNeeded(cropperRes, MAX_SIZE)
        onSelectPhotos([...selectedPhotos, img.path])
      } catch (err: any) {
        // ignore
        store.log.warn('Error selecting photo', err)
      }
    },
    [store.log, selectedPhotos, onSelectPhotos],
  )

  const handleOpenGallery = useCallback(() => {
    openPicker({
      multiple: true,
      maxFiles: 4 - selectedPhotos.length,
      mediaType: 'photo',
    }).then(async items => {
      const result = []

      for (const image of items) {
        // choose target dimensions based on the original
        // this causes the photo cropper to start with the full image "selected"
        const {width, height} = scaleDownDimensions(
          {width: image.width, height: image.height},
          {width: MAX_WIDTH, height: MAX_HEIGHT},
        )
        const cropperRes = await openCropper({
          mediaType: 'photo',
          path: image.path,
          ...IMAGE_PARAMS,
          width,
          height,
        })
        const finalImg = await compressIfNeeded(cropperRes, MAX_SIZE)
        result.push(finalImg.path)
      }
      onSelectPhotos([...selectedPhotos, ...result])
    })
  }, [selectedPhotos, onSelectPhotos])

  return (
    <ScrollView
      testID="photoCarouselPickerView"
      horizontal
      style={[pal.view, styles.photosContainer]}
      showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        testID="openCameraButton"
        style={[styles.galleryButton, pal.border, styles.photo]}
        onPress={handleOpenCamera}>
        <FontAwesomeIcon icon="camera" size={24} style={pal.link} />
      </TouchableOpacity>
      <TouchableOpacity
        testID="openGalleryButton"
        style={[styles.galleryButton, pal.border, styles.photo]}
        onPress={handleOpenGallery}>
        <FontAwesomeIcon icon="image" style={pal.link} size={24} />
      </TouchableOpacity>
      {localPhotos.photos.map((item: PhotoIdentifier, index: number) => (
        <TouchableOpacity
          testID="openSelectPhotoButton"
          key={`local-image-${index}`}
          style={[pal.border, styles.photoButton]}
          onPress={() => handleSelectPhoto(item)}>
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
  },
  galleryButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    width: 75,
    height: 75,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 16,
  },
  photo: {
    width: 75,
    height: 75,
    marginRight: 8,
    borderRadius: 16,
  },
})
