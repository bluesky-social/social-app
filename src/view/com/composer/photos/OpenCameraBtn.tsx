import React, {useCallback} from 'react'
import {TouchableOpacity, StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {openCamera} from 'lib/media/picker'
import {useCameraPermission} from 'lib/hooks/usePermissions'
import {HITSLOP_10, POST_IMG_MAX} from 'lib/constants'
import {GalleryModel} from 'state/models/media/gallery'
import {isMobileWeb, isNative} from 'platform/detection'
import {logger} from '#/logger'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

type Props = {
  gallery: GalleryModel
}

export function OpenCameraBtn({gallery}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()

  const onPressTakePicture = useCallback(async () => {
    track('Composer:CameraOpened')
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }

      const img = await openCamera({
        width: POST_IMG_MAX.width,
        height: POST_IMG_MAX.height,
        freeStyleCropEnabled: true,
      })

      gallery.add(img)
    } catch (err: any) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }, [gallery, track, requestCameraAccessIfNeeded])

  const shouldShowCameraButton = isNative || isMobileWeb
  if (!shouldShowCameraButton) {
    return null
  }

  return (
    <TouchableOpacity
      testID="openCameraButton"
      onPress={onPressTakePicture}
      style={styles.button}
      hitSlop={HITSLOP_10}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Camera`)}
      accessibilityHint={_(msg`Opens camera on device`)}>
      <FontAwesomeIcon
        icon="camera"
        style={pal.link as FontAwesomeIconStyle}
        size={24}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
  },
})
