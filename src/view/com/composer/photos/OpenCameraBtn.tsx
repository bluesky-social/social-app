import React, {useCallback} from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import * as MediaLibrary from 'expo-media-library'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useAnalytics} from 'lib/analytics/analytics'
import {HITSLOP_10, POST_IMG_MAX} from 'lib/constants'
import {usePalette} from 'lib/hooks/usePalette'
import {useCameraPermission} from 'lib/hooks/usePermissions'
import {openCamera} from 'lib/media/picker'
import {isMobileWeb, isNative} from 'platform/detection'
import {GalleryModel} from 'state/models/media/gallery'

type Props = {
  gallery: GalleryModel
}

export function OpenCameraBtn({gallery}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const [mediaPermissionRes, requestMediaPermission] =
    MediaLibrary.usePermissions()

  const onPressTakePicture = useCallback(async () => {
    track('Composer:CameraOpened')
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      if (!mediaPermissionRes?.granted && mediaPermissionRes?.canAskAgain) {
        await requestMediaPermission()
      }

      const img = await openCamera({
        width: POST_IMG_MAX.width,
        height: POST_IMG_MAX.height,
        freeStyleCropEnabled: true,
      })

      // If we don't have permissions it's fine, we just wont save it. The post itself will still have access to
      // the image even without these permissions
      if (mediaPermissionRes) {
        await MediaLibrary.createAssetAsync(img.path)
      }
      gallery.add(img)
    } catch (err: any) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }, [
    gallery,
    track,
    requestCameraAccessIfNeeded,
    mediaPermissionRes,
    requestMediaPermission,
  ])

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
