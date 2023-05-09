import React, {useCallback} from 'react'
import {ImageStyle, Keyboard} from 'react-native'
import {GalleryModel} from 'state/models/media/gallery'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from 'lib/styles'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {ImageModel} from 'state/models/media/image'
import {Image} from 'expo-image'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {openAltTextModal} from 'lib/media/alt-text'
import {useStores} from 'state/index'

interface Props {
  gallery: GalleryModel
}

export const Gallery = observer(function ({gallery}: Props) {
  const store = useStores()
  const getImageStyle = useCallback(() => {
    let side: number

    if (gallery.size === 1) {
      side = 250
    } else {
      side = (isDesktopWeb ? 560 : 350) / gallery.size
    }

    return {
      height: side,
      width: side,
    }
  }, [gallery])

  const imageStyle = getImageStyle()
  const handleAddImageAltText = useCallback(
    (image: ImageModel) => {
      Keyboard.dismiss()
      openAltTextModal(store, image)
    },
    [store],
  )
  const handleRemovePhoto = useCallback(
    (image: ImageModel) => {
      gallery.remove(image)
    },
    [gallery],
  )

  const handleEditPhoto = useCallback(
    (image: ImageModel) => {
      gallery.edit(image)
    },
    [gallery],
  )

  const isOverflow = !isDesktopWeb && gallery.size > 2

  const imageControlLabelStyle = {
    borderRadius: 5,
    paddingHorizontal: 10,
    position: 'absolute' as const,
    width: 46,
    zIndex: 1,
    ...(isOverflow
      ? {
          left: 4,
          bottom: 4,
        }
      : isDesktopWeb && gallery.size < 3
      ? {
          left: 8,
          top: 8,
        }
      : {
          left: 4,
          top: 4,
        }),
  }

  const imageControlsSubgroupStyle = {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    position: 'absolute' as const,
    ...(isOverflow
      ? {
          top: 4,
          right: 4,
          gap: 4,
        }
      : isDesktopWeb && gallery.size < 3
      ? {
          top: 8,
          right: 8,
          gap: 8,
        }
      : {
          top: 4,
          right: 4,
          gap: 4,
        }),
    zIndex: 1,
  }

  return !gallery.isEmpty ? (
    <View testID="selectedPhotosView" style={styles.gallery}>
      {gallery.images.map(image =>
        image.compressed !== undefined ? (
          <View key={`selected-image-${image.path}`} style={[imageStyle]}>
            <TouchableOpacity
              testID="altTextButton"
              accessibilityRole="button"
              accessibilityLabel="Add alt text"
              accessibilityHint="Opens modal for inputting image alt text"
              onPress={() => {
                handleAddImageAltText(image)
              }}
              style={[styles.imageControl, imageControlLabelStyle]}>
              <Text style={styles.imageControlTextContent}>ALT</Text>
            </TouchableOpacity>
            <View style={imageControlsSubgroupStyle}>
              <TouchableOpacity
                testID="editPhotoButton"
                accessibilityRole="button"
                accessibilityLabel="Edit image"
                accessibilityHint=""
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
                accessibilityRole="button"
                accessibilityLabel="Remove image"
                accessibilityHint=""
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
              style={[styles.image, imageStyle] as ImageStyle}
              source={{
                uri: image.compressed.path,
              }}
              accessible={true}
              accessibilityIgnoresInvertColors
            />
          </View>
        ) : null,
      )}
    </View>
  ) : null
})

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  image: {
    resizeMode: 'cover',
    borderRadius: 8,
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
  imageControlTextContent: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
})
