import React, {useState} from 'react'
import {ImageStyle, Keyboard, LayoutChangeEvent} from 'react-native'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Image} from 'expo-image'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {observer} from 'mobx-react-lite'

import {useModalControls} from '#/state/modals'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Dimensions} from 'lib/media/types'
import {colors, s} from 'lib/styles'
import {isNative} from 'platform/detection'
import {GalleryModel} from 'state/models/media/gallery'
import {Text} from 'view/com/util/text/Text'
import {useTheme} from '#/alf'

const IMAGE_GAP = 8

interface GalleryProps {
  gallery: GalleryModel
}

export const Gallery = (props: GalleryProps) => {
  const [containerInfo, setContainerInfo] = useState<Dimensions | undefined>()

  const onLayout = (evt: LayoutChangeEvent) => {
    const {width, height} = evt.nativeEvent.layout
    setContainerInfo({
      width,
      height,
    })
  }

  return (
    <View onLayout={onLayout}>
      {containerInfo ? (
        <GalleryInner {...props} containerInfo={containerInfo} />
      ) : undefined}
    </View>
  )
}

interface GalleryInnerProps extends GalleryProps {
  containerInfo: Dimensions
}

const GalleryInner = observer(function GalleryImpl({
  gallery,
  containerInfo,
}: GalleryInnerProps) {
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const {openModal} = useModalControls()
  const t = useTheme()

  let side: number

  if (gallery.size === 1) {
    side = 250
  } else {
    side = (containerInfo.width - IMAGE_GAP * (gallery.size - 1)) / gallery.size
  }

  const imageStyle = {
    height: side,
    width: side,
  }

  const isOverflow = isMobile && gallery.size > 2

  const altTextControlStyle = isOverflow
    ? {
        left: 4,
        bottom: 4,
      }
    : !isMobile && gallery.size < 3
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
      : !isMobile && gallery.size < 3
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
              accessibilityLabel={_(msg`Add alt text`)}
              accessibilityHint=""
              onPress={() => {
                Keyboard.dismiss()
                openModal({
                  name: 'alt-text-image',
                  image,
                })
              }}
              style={[styles.altTextControl, altTextControlStyle]}>
              {image.altText.length > 0 ? (
                <FontAwesomeIcon
                  icon="check"
                  size={10}
                  style={{color: t.palette.white}}
                />
              ) : (
                <FontAwesomeIcon
                  icon="plus"
                  size={10}
                  style={{color: t.palette.white}}
                />
              )}
              <Text style={styles.altTextControlLabel} accessible={false}>
                <Trans>ALT</Trans>
              </Text>
            </TouchableOpacity>
            <View style={imageControlsStyle}>
              <TouchableOpacity
                testID="editPhotoButton"
                accessibilityRole="button"
                accessibilityLabel={_(msg`Edit image`)}
                accessibilityHint=""
                onPress={() => {
                  if (isNative) {
                    gallery.crop(image)
                  } else {
                    openModal({
                      name: 'edit-image',
                      image,
                      gallery,
                    })
                  }
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
                accessibilityLabel={_(msg`Remove image`)}
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
              accessibilityLabel={_(msg`Add alt text`)}
              accessibilityHint=""
              onPress={() => {
                Keyboard.dismiss()
                openModal({
                  name: 'alt-text-image',
                  image,
                })
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
      <AltTextReminder />
    </>
  ) : null
})

export function AltTextReminder() {
  const t = useTheme()
  return (
    <View style={[styles.reminder]}>
      <View style={[styles.infoIcon, t.atoms.bg_contrast_25]}>
        <FontAwesomeIcon icon="info" size={12} color={t.atoms.text.color} />
      </View>
      <Text type="sm" style={[t.atoms.text_contrast_medium, s.flex1]}>
        <Trans>
          Alt text describes images for blind and low-vision users, and helps
          give context to everyone.
        </Trans>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  gallery: {
    flex: 1,
    flexDirection: 'row',
    gap: IMAGE_GAP,
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
    gap: 4,
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
