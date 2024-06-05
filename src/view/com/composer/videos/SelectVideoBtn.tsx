import React, {useCallback} from 'react'
import {
  ImagePickerAsset,
  launchImageLibraryAsync,
  MediaTypeOptions,
} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {VideoClip_Stroke2_Corner0_Rounded as VideoClipIcon} from '#/components/icons/VideoClip'

const VIDEO_MAX_DURATION = 90

type Props = {
  onSelectVideo: (video: ImagePickerAsset) => void
  disabled?: boolean
  pending: boolean
  setPending: (pending: boolean) => void
}

export function SelectVideoBtn({
  onSelectVideo,
  disabled,
  pending,
  setPending,
}: Props) {
  const {_} = useLingui()
  const t = useTheme()

  const onPressSelectVideo = useCallback(async () => {
    try {
      setPending(true)
      const response = await launchImageLibraryAsync({
        exif: false,
        mediaTypes: MediaTypeOptions.Videos,
        videoMaxDuration: VIDEO_MAX_DURATION,
        quality: 1,
      })
      if (response.assets && response.assets.length > 0) {
        onSelectVideo(response.assets[0])
      }
    } finally {
      setPending(false)
    }
  }, [onSelectVideo, setPending])

  return (
    <>
      <Button
        testID="openGifBtn"
        onPress={onPressSelectVideo}
        label={_(msg`Select GIF`)}
        accessibilityHint={_(msg`Opens GIF select dialog`)}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled || pending}>
        <VideoClipIcon
          size="lg"
          style={(disabled || pending) && t.atoms.text_contrast_low}
        />
      </Button>
    </>
  )
}
