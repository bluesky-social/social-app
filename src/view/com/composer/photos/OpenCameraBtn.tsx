import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {Asset, usePermissions} from '#/lib/media/media-library'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {IS_NATIVE, IS_WEB_MOBILE} from '#/env'
import {type OpenCameraBtnProps} from './OpenCameraBtn.shared'

export function OpenCameraBtn({disabled, onAdd}: OpenCameraBtnProps) {
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const [mediaPermissionRes, requestMediaPermission] = usePermissions({
    granularPermissions: ['photo'],
  })
  const t = useTheme()

  const mediaGranted = mediaPermissionRes?.granted
  const mediaCanAskAgain = mediaPermissionRes?.canAskAgain

  /*
   * No useCallback: with the diagnostics above resolved this component compiles,
   * so React Compiler memoizes it, and the hand-written deps were what it could
   * not preserve.
   */
  const onPressTakePicture = async () => {
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      let canSaveToMediaLibrary = mediaGranted === true
      if (!mediaGranted) {
        if (mediaCanAskAgain) {
          const permission = await requestMediaPermission()
          canSaveToMediaLibrary = permission.granted
        }
      }

      const img = await openCamera({
        aspect: [1, 1],
      })
      if (!img) {
        return
      }

      if (canSaveToMediaLibrary) {
        try {
          await Asset.create(img.path)
        } catch (err) {
          logger.warn('Failed to save camera image to media library', {
            safeMessage: err,
          })
        }
      }

      const res = await createComposerImage(img)

      onAdd([res])
    } catch (err: any) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }

  const shouldShowCameraButton = IS_NATIVE || IS_WEB_MOBILE
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
