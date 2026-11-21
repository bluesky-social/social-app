import {useLingui} from '@lingui/react/macro'

import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {Asset, usePermissions} from '#/lib/media/media-library'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import * as Toast from '#/components/Toast'
import {IS_ANDROID, IS_NATIVE, IS_WEB_MOBILE} from '#/env'
import {type OpenCameraBtnProps} from './OpenCameraBtn.shared'

export function OpenCameraBtn({disabled, onAdd}: OpenCameraBtnProps) {
  const {t: l} = useLingui()
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

      // Modern Android can save app-owned photos without library read access.
      if (IS_ANDROID || canSaveToMediaLibrary) {
        try {
          await Asset.create(img.path)
        } catch (err) {
          logger.warn('Failed to save camera image to media library', {
            safeMessage: err,
          })
        }
      }

      const res = await createComposerImage(img).catch((err: unknown) => {
        // Copying the photo only really fails when the device is out of space.
        logger.error('Failed to add camera photo', {safeMessage: err})
        Toast.show(
          l`Couldn’t add the photo. Your device might be out of storage.`,
          {type: 'error'},
        )
      })
      if (!res) {
        return
      }

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
