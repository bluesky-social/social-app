import React, {useCallback} from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from 'lib/analytics'
import {
  openPicker,
  openCamera,
  openCropper,
  cropAndCompressFlow,
} from '../../../../lib/media/picker'
import {
  UserLocalPhotosModel,
  PhotoIdentifier,
} from 'state/models/user-local-photos'
import {compressIfNeeded} from 'lib/media/manip'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {
  requestPhotoAccessIfNeeded,
  requestCameraAccessIfNeeded,
} from 'lib/permissions'
import {
  POST_IMG_MAX_WIDTH,
  POST_IMG_MAX_HEIGHT,
  POST_IMG_MAX_SIZE,
} from 'lib/constants'

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
      const cameraRes = await openCamera(store, {
        mediaType: 'photo',
        width: POST_IMG_MAX_WIDTH,
        height: POST_IMG_MAX_HEIGHT,
        freeStyleCropEnabled: true,
      })
      const img = await compressIfNeeded(cameraRes, POST_IMG_MAX_SIZE)
      onSelectPhotos([...selectedPhotos, img.path])
    } catch (err: any) {
      // ignore
      store.log.warn('Error using camera', err)
    }
  }, [store, selectedPhotos, onSelectPhotos])

  const handleSelectPhoto = useCallback(
    async (item: PhotoIdentifier) => {
      track('PhotoCarouselPicker:PhotoSelected')
      try {
        const imgPath = await cropAndCompressFlow(
          store,
          item.node.image.uri,
          {
            width: item.node.image.width,
            height: item.node.image.height,
          },
          {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
          POST_IMG_MAX_SIZE,
        )
        onSelectPhotos([...selectedPhotos, imgPath])
      } catch (err: any) {
        // ignore
        store.log.warn('Error selecting photo', err)
      }
    },
    [track, store, onSelectPhotos, selectedPhotos],
  )

  const handleOpenGallery = useCallback(async () => {
    track('PhotoCarouselPicker:GalleryOpened')
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await openPicker(store, {
      multiple: true,
      maxFiles: 4 - selectedPhotos.length,
      mediaType: 'photo',
    })
    const result = []
    for (const image of items) {
      result.push(
        await cropAndCompressFlow(
          store,
          image.path,
          image,
          {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
          POST_IMG_MAX_SIZE,
        ),
      )
    }
    onSelectPhotos([...selectedPhotos, ...result])
  }, [track, store, selectedPhotos, onSelectPhotos])

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
