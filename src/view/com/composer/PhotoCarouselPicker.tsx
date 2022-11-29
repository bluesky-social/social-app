import React, {useCallback} from 'react'
import {Image, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {
  openPicker,
  openCamera,
  openCropper,
} from 'react-native-image-crop-picker'

export const PhotoCarouselPicker = ({
  selectedPhotos,
  setSelectedPhotos,
  localPhotos,
}: {
  selectedPhotos: string[]
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>
  localPhotos: any
}) => {
  const handleOpenCamera = useCallback(() => {
    openCamera({
      mediaType: 'photo',
      cropping: true,
      width: 1000,
      height: 1000,
    }).then(item => {
      setSelectedPhotos([item.path, ...selectedPhotos])
    })
  }, [selectedPhotos, setSelectedPhotos])

  const handleSelectPhoto = useCallback(
    async (uri: string) => {
      const img = await openCropper({
        mediaType: 'photo',
        path: uri,
        width: 1000,
        height: 1000,
      })
      setSelectedPhotos([img.path, ...selectedPhotos])
    },
    [selectedPhotos, setSelectedPhotos],
  )

  const handleOpenGallery = useCallback(() => {
    openPicker({
      multiple: true,
      maxFiles: 4,
      mediaType: 'photo',
    }).then(async items => {
      const result = []

      for await (const image of items) {
        const img = await openCropper({
          mediaType: 'photo',
          path: image.path,
          width: 1000,
          height: 1000,
        })
        result.push(img.path)
      }
      setSelectedPhotos([
        // ...items.reduce(
        //   (accum, cur) => accum.concat(cur.sourceURL!),
        //   [] as string[],
        // ),
        ...result,
        ...selectedPhotos,
      ])
    })
  }, [selectedPhotos, setSelectedPhotos])

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
      {localPhotos.photos.map((item: any, index: number) => (
        <TouchableOpacity
          key={`local-image-${index}`}
          style={styles.photoButton}
          onPress={() => handleSelectPhoto(item.node.image.uri)}>
          <Image style={styles.photo} source={{uri: item.node.image.uri}} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.galleryButton, styles.photo]}
        onPress={handleOpenGallery}>
        <FontAwesomeIcon icon="image" style={{color: colors.blue3}} size={24} />
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
