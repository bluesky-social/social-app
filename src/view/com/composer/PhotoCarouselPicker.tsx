import React from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
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
  return localPhotos.photos != null &&
    inputText === '' &&
    selectedPhotos.length === 0 ? (
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
          <Image style={styles.photo} source={{uri: item.node.image.uri}} />
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
        <FontAwesomeIcon icon="image" style={{color: colors.blue3}} size={24} />
      </TouchableOpacity>
    </ScrollView>
  ) : null
})

const styles = StyleSheet.create({
  photosContainer: {
    width: '100%',
    maxHeight: 96,
    padding: 8,
    overflow: 'hidden',
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
