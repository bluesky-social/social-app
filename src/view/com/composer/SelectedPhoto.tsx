import React from 'react'
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'

export const SelectedPhoto = ({
  selectedPhotos,
  setSelectedPhotos,
}: {
  selectedPhotos: string[]
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>
}) => {
  const imageStyle =
    selectedPhotos.length === 1
      ? styles.image250
      : selectedPhotos.length === 2
      ? styles.image175
      : styles.image85

  return selectedPhotos.length !== 0 ? (
    <View style={styles.imageContainer}>
      {selectedPhotos.length !== 0 &&
        selectedPhotos.map((item, index) => (
          <View
            key={`selected-image-${index}`}
            style={[styles.image, imageStyle]}>
            <TouchableOpacity
              onPress={() => {
                setSelectedPhotos(
                  selectedPhotos.filter(filterItem => filterItem !== item),
                )
              }}
              style={styles.removePhotoButton}>
              <FontAwesomeIcon
                icon="xmark"
                size={16}
                style={{color: colors.white}}
              />
            </TouchableOpacity>

            <Image style={[styles.image, imageStyle]} source={{uri: item}} />
          </View>
        ))}
    </View>
  ) : null
}

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 16,
  },
  image: {
    borderRadius: 8,
    margin: 2,
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
  },
})
