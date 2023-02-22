import React, {useCallback} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import Image from 'view/com/util/images/Image'
import {colors} from 'lib/styles'

export const SelectedPhoto = ({
  selectedPhotos,
  onSelectPhotos,
}: {
  selectedPhotos: string[]
  onSelectPhotos: (v: string[]) => void
}) => {
  const imageStyle =
    selectedPhotos.length === 1
      ? styles.image250
      : selectedPhotos.length === 2
      ? styles.image175
      : styles.image85

  const handleRemovePhoto = useCallback(
    item => {
      onSelectPhotos(selectedPhotos.filter(filterItem => filterItem !== item))
    },
    [selectedPhotos, onSelectPhotos],
  )

  return selectedPhotos.length !== 0 ? (
    <View testID="selectedPhotosView" style={styles.gallery}>
      {selectedPhotos.length !== 0 &&
        selectedPhotos.map((item, index) => (
          <View
            key={`selected-image-${index}`}
            style={[styles.imageContainer, imageStyle]}>
            <TouchableOpacity
              testID="removePhotoButton"
              onPress={() => handleRemovePhoto(item)}
              style={styles.removePhotoButton}>
              <FontAwesomeIcon
                icon="xmark"
                size={16}
                style={{color: colors.white}}
              />
            </TouchableOpacity>

            <Image
              testID="selectedPhotoImage"
              style={[styles.image, imageStyle]}
              source={{uri: item}}
            />
          </View>
        ))}
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
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    zIndex: 1,
    borderColor: colors.gray4,
    borderWidth: 0.5,
  },
})
