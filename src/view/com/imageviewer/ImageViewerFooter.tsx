import React from 'react'
import * as MediaLibrary from 'expo-media-library'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import * as Toast from 'view/com/util/Toast'
import {saveImageToMediaLibrary, shareImageModal} from 'lib/media/manip'
import {Platform, Pressable, StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {colors, s} from 'lib/styles'
import {Button} from 'view/com/util/forms/Button'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {isIOS} from 'platform/detection'
import {useImageViewer} from 'view/com/imageviewer/ImageViewerContext'

const IS_MOBILE = Platform.OS !== 'web'

interface IProps {
  visible: boolean
}

export function ImageViewerFooter({visible}: IProps) {
  const {state} = useImageViewer()
  const {images, index} = state

  const currentImage = React.useMemo(() => images?.[index], [images, index])

  const [isAltExpanded, setAltExpanded] = React.useState(false)
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions()

  const onExpandAlt = React.useCallback(() => {
    setAltExpanded(prev => !prev)
  }, [])

  const onSaveImagePress = React.useCallback(async () => {
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
      await saveImageToMediaLibrary({uri: currentImage!.fullsize})
      Toast.show('Saved to your camera roll.')
    } catch (e: any) {
      Toast.show(`Failed to save image: ${String(e)}`)
    }
  }, [permissionResponse, requestPermission, currentImage])

  const onShareImagePress = React.useCallback(async () => {
    shareImageModal({uri: currentImage!.fullsize})
  }, [currentImage])

  if (!visible) return null

  return (
    <Animated.View style={[styles.footer]} entering={FadeIn} exiting={FadeOut}>
      {currentImage?.alt ? (
        <Pressable onPress={onExpandAlt} accessibilityRole="button">
          <Text
            style={[s.gray3, styles.footerText]}
            numberOfLines={isAltExpanded ? undefined : 3}>
            {currentImage?.alt}
          </Text>
        </Pressable>
      ) : null}
      {IS_MOBILE && (
        <>
          <View style={styles.footerBtns}>
            <Button
              type="primary-outline"
              style={styles.footerBtn}
              onPress={onSaveImagePress}>
              <FontAwesomeIcon icon={['far', 'floppy-disk']} style={s.white} />
              <Text type="xl" style={s.white}>
                Save
              </Text>
            </Button>
            <Button
              type="primary-outline"
              style={styles.footerBtn}
              onPress={onShareImagePress}>
              <FontAwesomeIcon icon="arrow-up-from-bracket" style={s.white} />
              <Text type="xl" style={s.white}>
                Share
              </Text>
            </Button>
          </View>
        </>
      )}
    </Animated.View>
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
