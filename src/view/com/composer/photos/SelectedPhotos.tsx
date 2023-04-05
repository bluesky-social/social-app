import React, {Dispatch, useCallback} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Image} from 'expo-image'
import {colors} from 'lib/styles'
import {SelectedPhoto} from 'lib/media/types'
import {openCropper} from 'lib/media/picker'
import {useStores} from 'state/index'
import {scaleDownDimensions} from 'lib/media/util'
import {POST_IMG_MAX} from 'lib/constants'

type Props = {
  selectedPhotos: SelectedPhoto[]
  setSelectedPhotos: Dispatch<React.SetStateAction<SelectedPhoto[]>>
}

export const SelectedPhotos = ({selectedPhotos, setSelectedPhotos}: Props) => {
  const store = useStores()

  const getImageStyle = useCallback(() => {
    switch (selectedPhotos.length) {
      case 1:
        return styles.image250
      case 2:
        return styles.image175
      default:
        return styles.image85
    }
  }, [selectedPhotos])

  const imageStyle = getImageStyle()

  const handleRemovePhoto = useCallback(
    (image: SelectedPhoto) => {
      setSelectedPhotos(prevPhotos =>
        prevPhotos.filter(
          filterItem => filterItem.original.path !== image.original.path,
        ),
      )
    },
    [setSelectedPhotos],
  )

  const handleEditPhoto = useCallback(
    async (image: SelectedPhoto) => {
      const {width, height} = scaleDownDimensions(image.original, POST_IMG_MAX)

      const cropped = await openCropper(store, {
        mediaType: 'photo',
        path: image.original.path,
        freeStyleCropEnabled: true,
        width,
        height,
      })

      setSelectedPhotos(prevPhotos => {
        return prevPhotos.map(photo =>
          photo.original.path === image.original.path
            ? {
                original: image.original,
                cropped,
              }
            : photo,
        )
      })
    },
    [store, setSelectedPhotos],
  )

  return selectedPhotos.length !== 0 ? (
    <View testID="selectedPhotosView" style={styles.gallery}>
      {selectedPhotos.length !== 0 &&
        selectedPhotos.map(image => {
          const photo = 'cropped' in image ? image.cropped : image.original

          return (
            <View
              key={`selected-image-${photo.path}`}
              style={[styles.imageContainer, imageStyle]}>
              <View style={styles.imageControls}>
                <TouchableOpacity
                  testID="cropPhotoButton"
                  onPress={() => {
                    handleEditPhoto(image)
                  }}
                  style={styles.imageControl}>
                  <FontAwesomeIcon
                    icon="pen"
                    size={12}
                    style={{color: colors.white}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  testID="removePhotoButton"
                  onPress={() => handleRemovePhoto(image)}
                  style={styles.imageControl}>
                  <FontAwesomeIcon
                    icon="xmark"
                    size={16}
                    style={{color: colors.white}}
                  />
                </TouchableOpacity>
              </View>

              <Image
                testID="selectedPhotoImage"
                style={[styles.image, imageStyle]}
                source={{uri: photo.path}}
              />
            </View>
          )
        })}
    </View>
  ) : null
}

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 16,
  },
  imageContainer: {
    margin: 2,
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 8,
  },
  image250: {
    width: 250,
    height: 250,
  },
  image175: {
    width: 175,
    height: 175,
  },
  image85: {
    width: 85,
    height: 85,
  },
  imageControls: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    top: 8,
    right: 8,
    zIndex: 1,
  },
  imageControl: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
