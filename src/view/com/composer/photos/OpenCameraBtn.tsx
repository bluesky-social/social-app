import React, {useCallback} from 'react'
import {TouchableOpacity, StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'
import {openCamera} from 'lib/media/picker'
import {useCameraPermission} from 'lib/hooks/usePermissions'
import {HITSLOP_10, POST_IMG_MAX} from 'lib/constants'
import {GalleryModel} from 'state/models/media/gallery'

type Props = {
  gallery: GalleryModel
}

export function OpenCameraBtn({gallery}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const store = useStores()
  const {requestCameraAccessIfNeeded} = useCameraPermission()

  const onPressTakePicture = useCallback(async () => {
    track('Composer:CameraOpened')
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }

      const img = await openCamera(store, {
        width: POST_IMG_MAX.width,
        height: POST_IMG_MAX.height,
        freeStyleCropEnabled: true,
      })

      gallery.add(img)
    } catch (err: any) {
      // ignore
      store.log.warn('Error using camera', err)
    }
  }, [gallery, track, store, requestCameraAccessIfNeeded])

  if (isDesktopWeb) {
    return null
  }

  return (
    <TouchableOpacity
      testID="openCameraButton"
      onPress={onPressTakePicture}
      style={styles.button}
      hitSlop={HITSLOP_10}
      accessibilityRole="button"
      accessibilityLabel="Camera"
      accessibilityHint="Opens camera on device">
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
