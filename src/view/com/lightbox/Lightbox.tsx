import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import ImageView from './ImageViewing'
import {shareImageModal, saveImageToMediaLibrary} from 'lib/media/manip'
import * as Toast from '../util/Toast'
import {Text} from '../util/text/Text'
import {s, colors} from 'lib/styles'
import {Button} from '../util/forms/Button'
import {isIOS} from 'platform/detection'
import * as MediaLibrary from 'expo-media-library'
import {
  useLightbox,
  useLightboxControls,
  ProfileImageLightbox,
  ImagesLightbox,
} from '#/state/lightbox'

export function Lightbox() {
  const {activeLightbox} = useLightbox()
  const {closeLightbox} = useLightboxControls()
  const onClose = React.useCallback(() => {
    closeLightbox()
  }, [closeLightbox])

  if (!activeLightbox) {
    return null
  } else if (activeLightbox.name === 'profile-image') {
    const opts = activeLightbox as ProfileImageLightbox
    return (
      <ImageView
        images={[{uri: opts.profile.avatar || ''}]}
        initialImageIndex={0}
        visible
        onRequestClose={onClose}
        FooterComponent={LightboxFooter}
      />
    )
  } else if (activeLightbox.name === 'images') {
    const opts = activeLightbox as ImagesLightbox
    return (
      <ImageView
        images={opts.images.map(img => ({...img}))}
        initialImageIndex={opts.index}
        visible
        onRequestClose={onClose}
        FooterComponent={LightboxFooter}
      />
    )
  } else {
    return null
  }
}

function LightboxFooter({imageIndex}: {imageIndex: number}) {
  const {activeLightbox} = useLightbox()
  const [isAltExpanded, setAltExpanded] = React.useState(false)
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions()

  const saveImageToAlbumWithToasts = React.useCallback(
    async (uri: string) => {
      if (!permissionResponse || permissionResponse.granted === false) {
        Toast.show('Permission to access camera roll is required.')
        if (permissionResponse?.canAskAgain) {
          requestPermission()
        } else {
          Toast.show(
            'Permission to access camera roll was denied. Please enable it in your system settings.',
          )
        }
        return
      }

      try {
        await saveImageToMediaLibrary({uri})
        Toast.show('Saved to your camera roll.')
      } catch (e: any) {
        Toast.show(`Failed to save image: ${String(e)}`)
      }
    },
    [permissionResponse, requestPermission],
  )

  const lightbox = activeLightbox
  if (!lightbox) {
    return null
  }

  let altText = ''
  let uri = ''
  if (lightbox.name === 'images') {
    const opts = lightbox as ImagesLightbox
    uri = opts.images[imageIndex].uri
    altText = opts.images[imageIndex].alt || ''
  } else if (lightbox.name === 'profile-image') {
    const opts = lightbox as ProfileImageLightbox
    uri = opts.profile.avatar || ''
  }

  return (
    <View style={[styles.footer]}>
      {altText ? (
        <Pressable
          onPress={() => setAltExpanded(!isAltExpanded)}
          accessibilityRole="button">
          <Text
            style={[s.gray3, styles.footerText]}
            numberOfLines={isAltExpanded ? undefined : 3}>
            {altText}
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.footerBtns}>
        <Button
          type="primary-outline"
          style={styles.footerBtn}
          onPress={() => saveImageToAlbumWithToasts(uri)}>
          <FontAwesomeIcon icon={['far', 'floppy-disk']} style={s.white} />
          <Text type="xl" style={s.white}>
            Save
          </Text>
        </Button>
        <Button
          type="primary-outline"
          style={styles.footerBtn}
          onPress={() => shareImageModal({uri})}>
          <FontAwesomeIcon icon="arrow-up-from-bracket" style={s.white} />
          <Text type="xl" style={s.white}>
            Share
          </Text>
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: 16,
    paddingBottom: isIOS ? 40 : 24,
    paddingHorizontal: 24,
    backgroundColor: '#000d',
  },
  footerText: {
    paddingBottom: isIOS ? 20 : 16,
  },
  footerBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderColor: colors.white,
  },
})
