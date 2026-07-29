import {useCallback} from 'react'
import * as MediaLibrary from 'expo-media-library'
import {useLingui} from '@lingui/react/macro'

import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {IS_NATIVE, IS_WEB_MOBILE} from '#/env'
import {type OpenCameraBtnProps} from './OpenCameraBtn.shared'

export function OpenCameraBtn({disabled, onAdd}: OpenCameraBtnProps) {
  const {t: l} = useLingui()
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
        aspect: [1, 1],
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

  const shouldShowCameraButton = IS_NATIVE || IS_WEB_MOBILE
  if (!shouldShowCameraButton) {
    return null
  }

  return (
    <Button
      testID="openCameraButton"
      onPress={onPressTakePicture}
      label={l`Camera`}
      accessibilityHint={l`Opens camera on device`}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Camera size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
