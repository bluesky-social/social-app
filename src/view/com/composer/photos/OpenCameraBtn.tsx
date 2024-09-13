import React, {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {
  ImagePickerAsset,
  launchCameraAsync,
  MediaTypeOptions,
  UIImagePickerPresentationStyle,
} from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {POST_IMG_MAX} from '#/lib/constants'
import {useCameraPermission} from '#/lib/hooks/usePermissions'
import {openCamera} from '#/lib/media/picker'
import {logger} from '#/logger'
import {isMobileWeb, isNative} from '#/platform/detection'
import {GalleryModel} from '#/state/models/media/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Camera_Stroke2_Corner0_Rounded as Camera} from '#/components/icons/Camera'
import {FilmCamera_Stroke2_Corner0_Rounded as FilmCamera} from '#/components/icons/FilmCamera'

const VIDEO_MAX_DURATION = 60

type Props = {
  gallery: GalleryModel
  disabled?: boolean
  selectVideo: (video: ImagePickerAsset) => void
}

export function OpenCameraBtn({gallery, disabled, selectVideo}: Props) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const [mediaPermissionRes, requestMediaPermission] =
    MediaLibrary.usePermissions({granularPermissions: ['photo']})
  const t = useTheme()
  const control = Dialog.useDialogControl()

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
    } catch (err) {
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

  const onPressTakeVideo = useCallback(async () => {
    try {
      const response = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Videos,
        quality: 0.8,
        videoMaxDuration: VIDEO_MAX_DURATION,
        exif: false,
        presentationStyle: UIImagePickerPresentationStyle.PAGE_SHEET,
      })

      if (!response.canceled && response.assets[0]) {
        selectVideo(response.assets[0])
      }
    } catch (err) {
      // ignore
      logger.warn('Error using camera', {error: err})
    }
  }, [selectVideo])

  const shouldShowCameraButton = isNative || isMobileWeb
  if (!shouldShowCameraButton) {
    return null
  }

  if (isMobileWeb) {
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

  return (
    <>
      <Button
        testID="openCameraButton"
        onPress={() => {
          Keyboard.dismiss()
          control.open()
        }}
        label={_(msg`Camera`)}
        accessibilityHint={_(msg`Take a photo or video with your camera`)}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled}>
        <Camera size="lg" style={disabled && t.atoms.text_contrast_low} />
      </Button>
      <Dialog.Outer control={control} testID="selectCameraModeDialog">
        <Dialog.Handle />
        <Dialog.Inner label={_(msg`Camera Mode`)} style={a.gap_md}>
          <Button
            label={_(msg`Take a photo`)}
            variant="solid"
            color="secondary"
            size="large"
            onPress={() => control.close(onPressTakePicture)}>
            <ButtonIcon icon={Camera} />
            <ButtonText>
              <Trans>Photo</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Take a video`)}
            variant="solid"
            color="secondary"
            size="large"
            onPress={() => control.close(onPressTakeVideo)}>
            <ButtonIcon icon={FilmCamera} />
            <ButtonText>
              <Trans>Video</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Cancel`)}
            variant="ghost"
            color="secondary"
            size="medium"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
