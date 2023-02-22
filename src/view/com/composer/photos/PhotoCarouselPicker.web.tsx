import React, {useCallback} from 'react'
import {StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {
  openPicker,
  openCamera,
  openCropper,
} from '../../util/images/image-crop-picker/ImageCropPicker'
import {compressIfNeeded, scaleDownDimensions} from 'lib/images'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores, RootStoreModel} from 'state/index'

const MAX_WIDTH = 1000
const MAX_HEIGHT = 1000
const MAX_SIZE = 300000

const IMAGE_PARAMS = {
  width: 1000,
  height: 1000,
  freeStyleCropEnabled: true,
}

export async function cropPhoto(
  store: RootStoreModel,
  path: string,
  imgWidth = MAX_WIDTH,
  imgHeight = MAX_HEIGHT,
) {
  // choose target dimensions based on the original
  // this causes the photo cropper to start with the full image "selected"
  const {width, height} = scaleDownDimensions(
    {width: imgWidth, height: imgHeight},
    {width: MAX_WIDTH, height: MAX_HEIGHT},
  )
  const cropperRes = await openCropper(store, {
    mediaType: 'photo',
    path,
    freeStyleCropEnabled: true,
    width,
    height,
  })
  const img = await compressIfNeeded(cropperRes, MAX_SIZE)
  return img.path
}

export const PhotoCarouselPicker = ({
  selectedPhotos,
  onSelectPhotos,
}: {
  selectedPhotos: string[]
  onSelectPhotos: (v: string[]) => void
}) => {
  const pal = usePalette('default')
  const store = useStores()

  const handleOpenCamera = useCallback(async () => {
    try {
      const cameraRes = await openCamera(store, {
        mediaType: 'photo',
        ...IMAGE_PARAMS,
      })
      const img = await compressIfNeeded(cameraRes, MAX_SIZE)
      onSelectPhotos([...selectedPhotos, img.path])
    } catch (err: any) {
      // ignore
      store.log.warn('Error using camera', err)
    }
  }, [store, selectedPhotos, onSelectPhotos])

  const handleOpenGallery = useCallback(() => {
    openPicker(store, {
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
        const cropperRes = await openCropper(store, {
          mediaType: 'photo',
          path: image.path,
          freeStyleCropEnabled: true,
          width,
          height,
        })
        const finalImg = await compressIfNeeded(cropperRes, MAX_SIZE)
        result.push(finalImg.path)
      }
      onSelectPhotos([...selectedPhotos, ...result])
    })
  }, [store, selectedPhotos, onSelectPhotos])

  return (
    <ScrollView
      testID="photoCarouselPickerView"
      horizontal
      style={[pal.view, styles.photosContainer]}
      keyboardShouldPersistTaps="always"
      showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        testID="openCameraButton"
        style={[styles.galleryButton, pal.border, styles.photo]}
        onPress={handleOpenCamera}>
        <FontAwesomeIcon
          icon="camera"
          size={24}
          style={pal.link as FontAwesomeIconStyle}
        />
      </TouchableOpacity>
      <TouchableOpacity
        testID="openGalleryButton"
        style={[styles.galleryButton, pal.border, styles.photo]}
        onPress={handleOpenGallery}>
        <FontAwesomeIcon
          icon="image"
          style={pal.link as FontAwesomeIconStyle}
          size={24}
        />
      </TouchableOpacity>
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
