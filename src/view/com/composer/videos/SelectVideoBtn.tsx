import {useCallback} from 'react'
import {type ImagePickerAsset} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  SUPPORTED_MIME_TYPES,
  type SupportedMimeTypes,
  VIDEO_MAX_DURATION_MS,
} from '#/lib/constants'
import {useVideoLibraryPermission} from '#/lib/hooks/usePermissions'
import {isWeb} from '#/platform/detection'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {VideoClip_Stroke2_Corner0_Rounded as VideoClipIcon} from '#/components/icons/VideoClip'
import {pickVideo} from './pickVideo'

type Props = {
  onSelectVideo: (video: ImagePickerAsset) => void
  disabled?: boolean
  setError: (error: string) => void
}

export function SelectVideoBtn({onSelectVideo, disabled, setError}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()

  const onPressSelectVideo = useCallback(async () => {
    if (isNative && !(await requestVideoAccessIfNeeded())) {
      return
    }

    const response = await pickVideo()
    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0]
      try {
        if (isWeb) {
          // asset.duration is null for gifs (see the TODO in pickVideo.web.ts)
          if (asset.duration && asset.duration > VIDEO_MAX_DURATION_MS) {
            throw Error(_(msg`Videos must be less than 3 minutes long`))
          }
          // compression step on native converts to mp4, so no need to check there
          if (
            !SUPPORTED_MIME_TYPES.includes(asset.mimeType as SupportedMimeTypes)
          ) {
            throw Error(_(msg`Unsupported video type: ${asset.mimeType}`))
          }
        } else {
          if (typeof asset.duration !== 'number') {
            throw Error('Asset is not a video')
          }
          if (asset.duration > VIDEO_MAX_DURATION_MS) {
            throw Error(_(msg`Videos must be less than 3 minutes long`))
          }
        }
        onSelectVideo(asset)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError(_(msg`An error occurred while selecting the video`))
        }
      }
    }
  }, [requestVideoAccessIfNeeded, setError, _, onSelectVideo])

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
    </>
  )
}
