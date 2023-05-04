import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import ImageView from './ImageViewing'
import {useStores} from 'state/index'
import * as models from 'state/models/ui/shell'
import {saveImageModal} from 'lib/media/manip'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../util/text/Text'
import {s, colors} from 'lib/styles'
import {Button} from '../util/forms/Button'

export const Lightbox = observer(function Lightbox() {
  const store = useStores()

  const onClose = React.useCallback(() => {
    store.shell.closeLightbox()
  }, [store])

  const onPressShare = React.useCallback((uri: string) => {
    saveImageModal({uri})
  }, [])

  const LightboxFooter = React.useCallback(
    ({imageIndex}: {imageIndex: number}) => {
      const pal = usePalette('default')

      const lightbox = store.shell.activeLightbox
      if (!lightbox) {
        return null
      }

      let altText = ''
      let uri
      if (lightbox.name === 'images') {
        const opts = store.shell.activeLightbox as models.ImagesLightbox
        uri = opts.images[imageIndex].uri
        altText = opts.images[imageIndex].alt
      } else if (store.shell.activeLightbox.name === 'profile-image') {
        const opts = store.shell.activeLightbox as models.ProfileImageLightbox
        uri = opts.profileView.avatar
      }

      return (
        <View style={[styles.footer]}>
          {altText ? (
            <Text style={[s.gray3, styles.footerText]} numberOfLines={3}>
              {altText}
            </Text>
          ) : null}
          <View style={styles.footerBtns}>
            <Button
              type="primary-outline"
              style={styles.footerBtn}
              onPress={() => saveImageModal({uri})}>
              <FontAwesomeIcon icon="arrow-up-from-bracket" style={s.white} />
              <Text type="xl" style={s.white}>
                Share
              </Text>
            </Button>
          </View>
        </View>
      )
    },
    [store.shell.activeLightbox],
  )

  if (!store.shell.activeLightbox) {
    return null
  } else if (store.shell.activeLightbox.name === 'profile-image') {
    const opts = store.shell.activeLightbox as models.ProfileImageLightbox
    return (
      <ImageView
        images={[{uri: opts.profileView.avatar}]}
        imageIndex={0}
        visible
        onRequestClose={onClose}
        FooterComponent={LightboxFooter}
      />
    )
  } else if (store.shell.activeLightbox.name === 'images') {
    const opts = store.shell.activeLightbox as models.ImagesLightbox
    return (
      <ImageView
        images={opts.images.map(({uri}) => ({uri}))}
        imageIndex={opts.index}
        visible
        onRequestClose={onClose}
        FooterComponent={LightboxFooter}
      />
    )
  } else {
    return null
  }
})

const styles = StyleSheet.create({
  footer: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#000d',
  },
  footerText: {
    paddingBottom: 16,
  },
  footerBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderColor: colors.white,
  },
})
