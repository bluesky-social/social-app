import React, {useCallback} from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from '@segment/analytics-react-native'
import {
  openPicker,
  openCamera,
  openCropper,
} from 'react-native-image-crop-picker'
import {
  UserLocalPhotosModel,
  PhotoIdentifier,
} from '../../../state/models/user-local-photos'
import {
  requestPhotoAccessIfNeeded,
  requestCameraAccessIfNeeded,
} from '../../../lib/permissions'
import {
  compressIfNeeded,
  moveToPremanantPath,
  scaleDownDimensions,
} from '../../../lib/images'
import {usePalette} from '../../lib/hooks/usePalette'
import {useStores} from '../../../state'

const MAX_WIDTH = 2000
const MAX_HEIGHT = 2000
const MAX_SIZE = 1000000

const IMAGE_PARAMS = {
  width: 2000,
  height: 2000,
  freeStyleCropEnabled: true,
  forceJpg: true, // ios only
  compressImageQuality: 1.0,
}

export async function cropPhoto(
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
  const cropperRes = await openCropper({
    mediaType: 'photo',
    path,
    ...IMAGE_PARAMS,
    width,
    height,
  })

  const img = await compressIfNeeded(cropperRes, MAX_SIZE)
  const permanentPath = await moveToPremanantPath(img.path)
  return permanentPath
}

export const PhotoCarouselPicker = ({
  selectedPhotos,
  onSelectPhotos,
}: {
  selectedPhotos: string[]
  onSelectPhotos: (v: string[]) => void
}) => {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const [isSetup, setIsSetup] = React.useState<boolean>(false)

  const localPhotos = React.useMemo<UserLocalPhotosModel>(
    () => new UserLocalPhotosModel(store),
    [store],
  )

  React.useEffect(() => {
    // initial setup
    localPhotos.setup().then(() => {
      setIsSetup(true)
    })
  }, [localPhotos])

  const handleOpenCamera = useCallback(async () => {
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
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
      track('PhotoCarouselPicker:PhotoSelected')
      try {
        const imgPath = await cropPhoto(
          item.node.image.uri,
          item.node.image.width,
          item.node.image.height,
        )
        onSelectPhotos([...selectedPhotos, imgPath])
      } catch (err: any) {
        // ignore
        store.log.warn('Error selecting photo', err)
      }
    },
    [track, onSelectPhotos, selectedPhotos, store.log],
  )

  const handleOpenGallery = useCallback(async () => {
    track('PhotoCarouselPicker:GalleryOpened')
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await openPicker({
      multiple: true,
      maxFiles: 4 - selectedPhotos.length,
      mediaType: 'photo',
    })
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
      const permanentPath = await moveToPremanantPath(finalImg.path)
      result.push(permanentPath)
    }
    onSelectPhotos([...selectedPhotos, ...result])
  }, [track, selectedPhotos, onSelectPhotos])

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
        <FontAwesomeIcon icon="camera" size={24} style={pal.link} />
      </TouchableOpacity>
      <TouchableOpacity
        testID="openGalleryButton"
        style={[styles.galleryButton, pal.border, styles.photo]}
        onPress={handleOpenGallery}>
        <FontAwesomeIcon icon="image" style={pal.link} size={24} />
      </TouchableOpacity>
      {isSetup &&
        localPhotos.photos.map((item: PhotoIdentifier, index: number) => (
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
