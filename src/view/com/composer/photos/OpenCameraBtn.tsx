import {useCallback} from 'react'
import {type ImagePickerAsset} from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_IMG_MAX, VIDEO_MAX_DURATION_MS} from '#/lib/constants'
import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {type ComposerImage, createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {IS_NATIVE, IS_WEB_MOBILE} from '#/env'

type Props = {
  disabled?: boolean
  onAddImage: (next: ComposerImage[]) => void
  onAddVideo: (asset: ImagePickerAsset) => void
}

export function OpenCameraBtn({disabled, onAddImage, onAddVideo}: Props) {
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const [mediaPermissionRes, requestMediaPermission] =
    MediaLibrary.usePermissions({granularPermissions: ['photo', 'video']})
  const t = useTheme()

  const onPressTakePicture = useCallback(async () => {
    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }
      if (!mediaPermissionRes?.granted && mediaPermissionRes?.canAskAgain) {
        await requestMediaPermission()
      }

      const result = await openCamera({
        mediaTypes: ['images', 'videos'],
        aspect: [POST_IMG_MAX.width, POST_IMG_MAX.height],
        videoMaxDuration: VIDEO_MAX_DURATION_MS / 1000,
      })

      // If we don't have permissions it's fine, we just wont save it. The post itself will still have access to
      // the image even without these permissions
      if (mediaPermissionRes) {
        await MediaLibrary.createAssetAsync(result.path)
      }

      if (result.mime.startsWith('image')) {
        const img = await createComposerImage(result)
        onAddImage([img])
      } else if (result.mime.startsWith('video')) {
        onAddVideo(result.asset)
      }
    } catch (err: any) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }, [
    onAddImage,
    onAddVideo,
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
