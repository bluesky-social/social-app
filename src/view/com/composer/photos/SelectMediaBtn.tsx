/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */
import {useCallback} from 'react'
import {type ImagePickerAsset, launchImageLibraryAsync} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  SUPPORTED_MIME_TYPES,
  type SupportedMimeTypes,
  VIDEO_MAX_DURATION_MS,
} from '#/lib/constants'
import {
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {getDataUriSize} from '#/lib/media/util'
import {openPicker} from '#/lib/media/picker'
import {isNative, isWeb} from '#/platform/detection'
import {ComposerImage, createComposerImage} from '#/state/gallery'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'

type Props = {
  size: number
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
  onSelectVideo: (asset: ImagePickerAsset) => void
  setError: (error: string) => void
}

export function SelectMediaBtn({
  size,
  disabled,
  onAdd,
  onSelectVideo,
  setError,
}: Props) {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const t = useTheme()
  const sheetWrapper = useSheetWrapper()

  const onPressSelectMedia = useCallback(async () => {
    if (isNative) {
      // Request both photo and video permissions
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        return
      }
    }

    const response = await sheetWrapper(
      launchImageLibraryAsync({
        exif: false,
        mediaTypes: ['images', 'videos'],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 0,
        legacy: true,
      }),
    )

    if (!response.assets || response.assets.length === 0) {
      return
    }

    const assets = response.assets
    const images: ImagePickerAsset[] = []
    const videos: ImagePickerAsset[] = []

    for (const asset of assets) {
      if (asset.type === 'video') {
        videos.push(asset)
      } else {
        images.push(asset)
      }
    }

    if (videos.length > 1) {
      Toast.show(_(msg`You can only upload one video at a time`), 'xmark')
      return
    }

    if (images.length > 4) {
      Toast.show(_(msg`You can only upload 4 images at a time`), 'xmark')
      return
    }

    if (videos.length > 0 && images.length > 0) {
      Toast.show(
        _(msg`You can select either images or a video, but not both`),
        'xmark',
      )
      return
    }

    if (videos.length === 1) {
      const video = videos[0]

      try {
        if (isWeb) {
          if (video.duration && video.duration > VIDEO_MAX_DURATION_MS) {
            throw Error(_(msg`Videos must be less than 3 minutes long`))
          }
          // compression step on native converts to mp4, so no need to check there
          if (
            video.mimeType &&
            !SUPPORTED_MIME_TYPES.includes(video.mimeType as SupportedMimeTypes)
          ) {
            throw Error(_(msg`Unsupported video type: ${video.mimeType}`))
          }
        } else {
          if (typeof video.duration !== 'number') {
            throw Error('Asset is not a video')
          }
          if (video.duration > VIDEO_MAX_DURATION_MS) {
            throw Error(_(msg`Videos must be less than 3 minutes long`))
          }
        }
        onSelectVideo(video)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError(_(msg`An error occurred while selecting the video`))
        }
      }
      return
    }

    if (images.length > 0) {
      // Check if adding these images would exceed the total limit
      if (size + images.length > 4) {
        Toast.show(_(msg`You can only upload 4 images at a time`), 'xmark')
        return
      }

      // Use the same logic as openPicker for processing images
      const processedImages = images
        .filter(asset => {
          if (asset.mimeType?.startsWith('image/')) return true
          Toast.show(_(msg`Only image files are supported`), 'xmark')
          return false
        })
        .map(image => ({
          mime: image.mimeType || 'image/jpeg',
          height: image.height,
          width: image.width,
          path: image.uri,
          size: getDataUriSize(image.uri),
        }))

      const results = await Promise.all(
        processedImages.map(img => createComposerImage(img)),
      )

      onAdd(results)
    }
  }, [
    requestPhotoAccessIfNeeded,
    requestVideoAccessIfNeeded,
    size,
    onAdd,
    onSelectVideo,
    setError,
    sheetWrapper,
    _,
  ])

  return (
    <Button
      testID="openMediaBtn"
      onPress={onPressSelectMedia}
      label={_(msg`Media`)}
      accessibilityHint={_(
        msg`Opens device gallery to select images or videos`,
      )}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Image size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
