import React from 'react'
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {openPicker, openCamera} from 'react-native-image-crop-picker'
import {observer} from 'mobx-react-lite'

export const PhotoCarouselPicker = observer(function PhotoCarouselPicker({
  selectedPhotos,
  setSelectedPhotos,
  inputText,
  localPhotos,
}: {
  selectedPhotos: string[]
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>
  inputText: string
  localPhotos: any
}) {
  return (
    <>
      {selectedPhotos.length !== 0 && (
        <View style={styles.selectedImageContainer}>
          {selectedPhotos.length !== 0 &&
            selectedPhotos.map((item, index) => (
              <View
                key={`selected-image-${index}`}
                style={[
                  styles.selectedImage,
                  selectedPhotos.length === 1
                    ? styles.selectedImage250
                    : selectedPhotos.length === 2
                    ? styles.selectedImage175
                    : styles.selectedImage85,
                ]}>
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

                <Image
                  style={[
                    styles.selectedImage,
                    selectedPhotos.length === 1
                      ? styles.selectedImage250
                      : selectedPhotos.length === 2
                      ? styles.selectedImage175
                      : styles.selectedImage85,
                  ]}
                  source={{uri: item}}
                />
              </View>
            ))}
        </View>
      )}
      {localPhotos.photos != null &&
        inputText === '' &&
        selectedPhotos.length === 0 && (
          <ScrollView
            horizontal
            style={styles.photosContainer}
            showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.galleryButton, styles.photo]}
              onPress={() => {
                openCamera({multiple: true, maxFiles: 4}).then()
              }}>
              <FontAwesomeIcon
                icon="camera"
                size={24}
                style={{color: colors.blue3}}
              />
            </TouchableOpacity>
            {localPhotos.photos.map((item: any, index: number) => (
              <TouchableOpacity
                key={`local-image-${index}`}
                style={styles.photoButton}
                onPress={() => {
                  setSelectedPhotos([item.node.image.uri, ...selectedPhotos])
                }}>
                <Image
                  style={styles.photo}
                  source={{uri: item.node.image.uri}}
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.galleryButton, styles.photo]}
              onPress={() => {
                openPicker({multiple: true, maxFiles: 4}).then(items => {
                  setSelectedPhotos([
                    ...items.reduce(
                      (accum, cur) => accum.concat(cur.sourceURL!),
                      [] as string[],
                    ),
                    ...selectedPhotos,
                  ])
                })
              }}>
              <FontAwesomeIcon
                icon="image"
                style={{color: colors.blue3}}
                size={24}
              />
            </TouchableOpacity>
          </ScrollView>
        )}
      <View style={styles.separator} />
    </>
  )
})

const styles = StyleSheet.create({
  selectedImageContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 16,
  },
  selectedImage: {
    borderRadius: 8,
    margin: 2,
  },
  selectedImage250: {
    width: 250,
    height: 250,
  },
  selectedImage175: {
    width: 175,
    height: 175,
  },
  selectedImage85: {
    width: 85,
    height: 85,
  },
  photosContainer: {
    width: '100%',
    maxHeight: 96,
    padding: 8,
    overflow: 'hidden',
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
  separator: {
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
})
