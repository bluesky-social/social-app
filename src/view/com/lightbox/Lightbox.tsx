import React from 'react'
import {Dimensions, LayoutAnimation, StyleSheet, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import * as MediaLibrary from 'expo-media-library'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {saveImageToMediaLibrary, shareImageModal} from '#/lib/media/manip'
import {colors, s} from '#/lib/styles'
import {isIOS} from '#/platform/detection'
import {
  ImagesLightbox,
  ProfileImageLightbox,
  useLightbox,
  useLightboxControls,
} from '#/state/lightbox'
import {ScrollView} from '#/view/com/util/Views'
import {Button} from '../util/forms/Button'
import {Text} from '../util/text/Text'
import * as Toast from '../util/Toast'
import ImageView from './ImageViewing'

const SCREEN_HEIGHT = Dimensions.get('window').height

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
  const {_} = useLingui()
  const {activeLightbox} = useLightbox()
  const [isAltExpanded, setAltExpanded] = React.useState(false)
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  })
  const insets = useSafeAreaInsets()
  const svMaxHeight = SCREEN_HEIGHT - insets.top - 50
  const isMomentumScrolling = React.useRef(false)

  const saveImageToAlbumWithToasts = React.useCallback(
    async (uri: string) => {
      if (!permissionResponse || permissionResponse.granted === false) {
        Toast.show(
          _(msg`Permission to access camera roll is required.`),
          'info',
        )
        if (permissionResponse?.canAskAgain) {
          requestPermission()
        } else {
          Toast.show(
            _(
              msg`Permission to access camera roll was denied. Please enable it in your system settings.`,
            ),
            'xmark',
          )
        }
        return
      }

      try {
        await saveImageToMediaLibrary({uri})
        Toast.show(_(msg`Saved to your camera roll`))
      } catch (e: any) {
        Toast.show(_(msg`Failed to save image: ${String(e)}`), 'xmark')
      }
    },
    [permissionResponse, requestPermission, _],
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
    <ScrollView
      style={[
        {
          backgroundColor: '#000d',
        },
        {maxHeight: svMaxHeight},
      ]}
      scrollEnabled={isAltExpanded}
      onMomentumScrollBegin={() => {
        isMomentumScrolling.current = true
      }}
      onMomentumScrollEnd={() => {
        isMomentumScrolling.current = false
      }}
      contentContainerStyle={{
        paddingTop: 16,
        paddingBottom: insets.bottom + 10,
        paddingHorizontal: 24,
      }}>
      {altText ? (
        <View accessibilityRole="button" style={styles.footerText}>
          <Text
            style={[s.gray3]}
            numberOfLines={isAltExpanded ? undefined : 3}
            selectable
            onPress={() => {
              if (isMomentumScrolling.current) {
                return
              }
              LayoutAnimation.configureNext({
                duration: 450,
                update: {type: 'spring', springDamping: 1},
              })
              setAltExpanded(prev => !prev)
            }}
            onLongPress={() => {}}>
            {altText}
          </Text>
        </View>
      ) : null}
      <View style={styles.footerBtns}>
        <Button
          type="primary-outline"
          style={styles.footerBtn}
          onPress={() => saveImageToAlbumWithToasts(uri)}>
          <FontAwesomeIcon icon={['far', 'floppy-disk']} style={s.white} />
          <Text type="xl" style={s.white}>
            <Trans context="action">Save</Trans>
          </Text>
        </Button>
        <Button
          type="primary-outline"
          style={styles.footerBtn}
          onPress={() => shareImageModal({uri})}>
          <FontAwesomeIcon icon="arrow-up-from-bracket" style={s.white} />
          <Text type="xl" style={s.white}>
            <Trans context="action">Share</Trans>
          </Text>
        </Button>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
