import React, {Dispatch, useCallback, SetStateAction} from 'react'
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
import {useCameraPermission} from 'lib/hooks/usePermissions'
import {SelectedPhoto} from 'lib/media/types'
import {POST_IMG_MAX} from 'lib/constants'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

type Props = {
  enabled: boolean
  setSelectedPhotos: Dispatch<SetStateAction<SelectedPhoto[]>>
}

export function OpenCameraBtn({enabled, setSelectedPhotos}: Props) {
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const store = useStores()
  const {requestCameraAccessIfNeeded} = useCameraPermission()

  const onPressTakePicture = useCallback(async () => {
    track('Composer:CameraOpened')
    if (!enabled) {
      return
    }
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      const img = await openCamera(store, {
        mediaType: 'photo',
        width: POST_IMG_MAX.width,
        height: POST_IMG_MAX.height,
        freeStyleCropEnabled: true,
      })

      setSelectedPhotos(prevPhotos => [
        ...prevPhotos,
        {
          original: img,
        },
      ])
    } catch (err: any) {
      // ignore
      store.log.warn('Error using camera', err)
    }
  }, [track, store, setSelectedPhotos, enabled, requestCameraAccessIfNeeded])

  if (isDesktopWeb) {
    return null
  }

  return (
    <TouchableOpacity
      testID="openCameraButton"
      onPress={onPressTakePicture}
      style={[s.pl5]}
      hitSlop={HITSLOP}>
      <FontAwesomeIcon
        icon="camera"
        style={
          (enabled
            ? pal.link
            : [pal.textLight, s.dimmed]) as FontAwesomeIconStyle
        }
        size={24}
      />
    </TouchableOpacity>
  )
}
