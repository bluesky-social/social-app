import React, {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {
  ImagePickerAsset,
  launchImageLibraryAsync,
  MediaTypeOptions,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useVideoLibraryPermission} from '#/lib/hooks/usePermissions'
import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {VideoClip_Stroke2_Corner0_Rounded as VideoClipIcon} from '#/components/icons/VideoClip'
import * as Prompt from '#/components/Prompt'

const VIDEO_MAX_DURATION = 60

type Props = {
  onSelectVideo: (video: ImagePickerAsset) => void
  disabled?: boolean
  setError: (error: string) => void
}

export function SelectVideoBtn({onSelectVideo, disabled, setError}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const control = Prompt.usePromptControl()
  const {currentAccount} = useSession()

  const onPressSelectVideo = useCallback(async () => {
    if (isNative && !(await requestVideoAccessIfNeeded())) {
      return
    }

    if (!currentAccount?.emailConfirmed) {
      Keyboard.dismiss()
      control.open()
    } else {
      const response = await launchImageLibraryAsync({
        exif: false,
        mediaTypes: MediaTypeOptions.Videos,
        videoMaxDuration: VIDEO_MAX_DURATION,
        quality: 1,
        legacy: true,
        preferredAssetRepresentationMode:
          UIImagePickerPreferredAssetRepresentationMode.Current,
      })
      if (response.assets && response.assets.length > 0) {
        try {
          onSelectVideo(response.assets[0])
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError(_(msg`An error occurred while selecting the video`))
          }
        }
      }
    }
  }, [
    onSelectVideo,
    requestVideoAccessIfNeeded,
    setError,
    _,
    control,
    currentAccount?.emailConfirmed,
  ])

  return (
    <>
      <Button
        testID="openGifBtn"
        onPress={onPressSelectVideo}
        label={_(msg`Select video`)}
        accessibilityHint={_(msg`Opens video picker`)}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled}>
        <VideoClipIcon
          size="lg"
          style={disabled && t.atoms.text_contrast_low}
        />
      </Button>
      <VerifyEmailPrompt control={control} />
    </>
  )
}

function VerifyEmailPrompt({control}: {control: Prompt.PromptControlProps}) {
  const {_} = useLingui()
  const {openModal} = useModalControls()

  return (
    <Prompt.Basic
      control={control}
      title={_(msg`Verified email required`)}
      description={_(
        msg`To upload videos to Bluesky, you must first verify your email.`,
      )}
      confirmButtonCta={_(msg`Verify now`)}
      confirmButtonColor="primary"
      onConfirm={() => {
        control.close(() => {
          openModal({
            name: 'verify-email',
            showReminder: false,
          })
        })
      }}
    />
  )
}
