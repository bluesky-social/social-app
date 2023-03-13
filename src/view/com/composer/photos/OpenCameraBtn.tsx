import React from 'react'
import {TouchableOpacity} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {isDesktopWeb} from 'platform/detection'
import {openCamera} from 'lib/media/picker'
import {compressIfNeeded} from 'lib/media/manip'
import {useCameraPermission} from 'lib/hooks/usePermissions'
import {
  POST_IMG_MAX_WIDTH,
  POST_IMG_MAX_HEIGHT,
  POST_IMG_MAX_SIZE,
} from 'lib/constants'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export function OpenCameraBtn({
  enabled,
  selectedPhotos,
  onSelectPhotos,
}: {
  enabled: boolean
  selectedPhotos: string[]
  onSelectPhotos: (v: string[]) => void
}) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const store = useStores()
  const {requestCameraAccessIfNeeded} = useCameraPermission()

  const onPressTakePicture = React.useCallback(async () => {
    track('Composer:CameraOpened')
    if (!enabled) {
      return
    }
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      const cameraRes = await openCamera(store, {
        mediaType: 'photo',
        width: POST_IMG_MAX_WIDTH,
        height: POST_IMG_MAX_HEIGHT,
        freeStyleCropEnabled: true,
      })
      const img = await compressIfNeeded(cameraRes, POST_IMG_MAX_SIZE)
      onSelectPhotos([...selectedPhotos, img.path])
    } catch (err: any) {
      // ignore
      store.log.warn('Error using camera', err)
    }
  }, [
    track,
    store,
    onSelectPhotos,
    selectedPhotos,
    enabled,
    requestCameraAccessIfNeeded,
  ])

  if (isDesktopWeb) {
    return <></>
  }

  return (
    <TouchableOpacity
      testID="openCameraButton"
      onPress={onPressTakePicture}
      style={[s.pl5]}
      hitSlop={HITSLOP}>
      <FontAwesomeIcon
        icon="camera"
        style={(enabled ? pal.link : pal.textLight) as FontAwesomeIconStyle}
        size={24}
      />
    </TouchableOpacity>
  )
}
