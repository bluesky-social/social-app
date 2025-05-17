import {useCallback} from 'react'
import * as MediaLibrary from 'expo-media-library'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_IMG_MAX} from '#/lib/constants'
import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {isMobileWeb, isNative} from '#/platform/detection'
import {ComposerImage, createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'

type Props = {
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
}

export function OpenCameraBtn({disabled, onAdd}: Props) {
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const [mediaPermissionRes, requestMediaPermission] =
    MediaLibrary.usePermissions({granularPermissions: ['photo']})
  const t = useTheme()

  const onPressTakePicture = useCallback(async () => {
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      if (!mediaPermissionRes?.granted && mediaPermissionRes?.canAskAgain) {
        await requestMediaPermission()
      }

      const img = await openCamera({
        aspect: [POST_IMG_MAX.width, POST_IMG_MAX.height],
      })

      // If we don't have permissions it's fine, we just wont save it. The post itself will still have access to
      // the image even without these permissions
      if (mediaPermissionRes) {
        await MediaLibrary.createAssetAsync(img.path)
      }

      const res = await createComposerImage(img)

      onAdd([res])
    } catch (err: any) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }, [
    onAdd,
    requestCameraAccessIfNeeded,
    mediaPermissionRes,
    requestMediaPermission,
  ])

  const shouldShowCameraButton = isNative || isMobileWeb
  if (!shouldShowCameraButton) {
    return null
  }

  return (
    <Button
      testID="openCameraButton"
      onPress={onPressTakePicture}
      label={_(msg`Camera`)}
      accessibilityHint={_(msg`Opens camera on device`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Camera size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
