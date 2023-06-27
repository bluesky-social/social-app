import React from 'react'
import {ImageStyle, Keyboard} from 'react-native'
import {GalleryModel} from 'state/models/media/gallery'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {s, colors} from 'lib/styles'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {openAltTextModal} from 'lib/media/alt-text'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'

interface Props {
  gallery: GalleryModel
}

export const Gallery = observer(function ({gallery}: Props) {
  const store = useStores()
  const pal = usePalette('default')

  let side: number

  if (gallery.size === 1) {
    side = 250
  } else {
    side = (isDesktopWeb ? 560 : 350) / gallery.size
  }

  const imageStyle = {
    height: side,
    width: side,
  }

  const isOverflow = !isDesktopWeb && gallery.size > 2

  const altTextControlStyle = isOverflow
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
      }

  const imageControlsStyle = {
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
    <>
      <View testID="selectedPhotosView" style={styles.gallery}>
        {gallery.images.map(image => (
          <View key={`selected-image-${image.path}`} style={[imageStyle]}>
            <TouchableOpacity
              testID="altTextButton"
              accessibilityRole="button"
              accessibilityLabel="Add alt text"
              accessibilityHint=""
              onPress={() => {
                Keyboard.dismiss()
                openAltTextModal(store, image)
              }}
              style={[styles.altTextControl, altTextControlStyle]}>
              <Text style={styles.altTextControlLabel}>ALT</Text>
              {image.altText.length > 0 ? (
                <FontAwesomeIcon
                  icon="check"
                  size={10}
                  style={{color: colors.green3}}
                />
              ) : undefined}
            </TouchableOpacity>
            <View style={imageControlsStyle}>
              <TouchableOpacity
                testID="editPhotoButton"
                accessibilityRole="button"
                accessibilityLabel="Edit image"
                accessibilityHint=""
                onPress={() => gallery.edit(image)}
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
                onPress={() => gallery.remove(image)}
                style={styles.imageControl}>
                <FontAwesomeIcon
                  icon="xmark"
                  size={16}
                  style={{color: colors.white}}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add alt text"
              accessibilityHint=""
              onPress={() => {
                Keyboard.dismiss()
                openAltTextModal(store, image)
              }}
              style={styles.altTextHiddenRegion}
            />

            <Image
              testID="selectedPhotoImage"
              style={[styles.image, imageStyle] as ImageStyle}
              source={{
                uri: image.cropped?.path ?? image.path,
              }}
              accessible={true}
              accessibilityIgnoresInvertColors
            />
          </View>
        ))}
      </View>
      <View style={[styles.reminder]}>
        <View style={[styles.infoIcon, pal.viewLight]}>
          <FontAwesomeIcon icon="info" size={12} color={pal.colors.text} />
        </View>
        <Text type="sm" style={[pal.textLight, s.flex1]}>
          Alt text describes images for blind and low-vision users, and helps
          give context to everyone.
        </Text>
      </View>
    </>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  altTextControl: {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  altTextControlLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  altTextHiddenRegion: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 4,
    top: 30,
    zIndex: 1,
  },

  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 14,
  },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
