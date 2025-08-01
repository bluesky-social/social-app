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
import {isNative, isWeb} from '#/platform/detection'
import {type ComposerImage, createComposerImage} from '#/state/gallery'
import {getVideoMetadata} from '#/view/com/composer/videos/pickVideo'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'
import {toast} from '#/components/Toast'

type Props = {
  size: number
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
  onSelectVideo: (asset: ImagePickerAsset) => void
  setError: (error: string) => void
}

export function validateAndSelectVideo(
  asset: ImagePickerAsset,
  onSelectVideo: (asset: ImagePickerAsset) => void,
  setError: (error: string) => void,
  _: any,
) {
  try {
    if (isWeb) {
      // asset.duration is null for gifs (see the TODO in pickVideo.web.ts)
      if (asset.duration && asset.duration > VIDEO_MAX_DURATION_MS) {
        throw Error(_(msg`Videos must be less than 3 minutes long`))
      }
      // compression step on native converts to mp4, so no need to check there
      if (
        asset.mimeType &&
        !SUPPORTED_MIME_TYPES.includes(asset.mimeType as SupportedMimeTypes)
      ) {
        throw Error(_(msg`Unsupported video type: ${asset.mimeType}`))
      }
    } else {
      if (typeof asset.duration !== 'number') {
        throw Error(_(msg`Asset is not a video`))
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

  const processSelectedAssets = useCallback(
    async (assets: ImagePickerAsset[]) => {
      const limitedAssets = assets.slice(0, 4)

      if (assets.length > 4) {
        toast.show({
          type: 'info',
          content: _(msg`Using the first 4 images.`),
          a11yLabel: _(msg`Using the first 4 images.`),
        })
      }

      const images: ImagePickerAsset[] = []
      const videos: ImagePickerAsset[] = []
      let firstMediaType: 'image' | 'video' | null = null

      for (const asset of limitedAssets) {
        if (
          // APiligrim
          // On web, pasted/dragged content may have data URIs without proper metadata
          // This happens with clipboard paste, drag & drop, or browser inconsistencies
          // We need to fetch and analyze the blob to extract missing video metadata
          isWeb &&
          asset.uri &&
          asset.uri.startsWith('data:') &&
          !asset.mimeType &&
          !asset.duration
        ) {
          try {
            const response = await fetch(asset.uri)
            const blob = await response.blob()
            const file = new File([blob], 'video', {type: blob.type})

            const videoAsset = await getVideoMetadata(file)

            Object.assign(asset, {
              mimeType: videoAsset.mimeType,
              duration: videoAsset.duration,
              width: videoAsset.width,
              height: videoAsset.height,
              type: videoAsset.mimeType?.startsWith('video/')
                ? 'video'
                : asset.type,
            })
          } catch (error) {
            console.error('Failed to extract metadata:', error)
          }
        }

        const typeCheck = asset.type === 'video'
        const mimeCheck = asset.mimeType && asset.mimeType.startsWith('video/')
        const extensionCheck =
          asset.uri && /\.(mp4|mov|avi|webm|m4v)$/i.test(asset.uri)
        const durationCheck =
          typeof asset.duration === 'number' && asset.duration > 0

        const isVideo =
          typeCheck || mimeCheck || extensionCheck || durationCheck

        if (isVideo) {
          videos.push(asset)
          if (firstMediaType === null) firstMediaType = 'video'
        } else {
          images.push(asset)
          if (firstMediaType === null) firstMediaType = 'image'
        }
      }

      if (videos.length > 0 && images.length > 0) {
        if (firstMediaType === 'video') {
          toast.show({
            type: 'info',
            content: _(
              msg`You can select either images or videos. Taking the first video.`,
            ),
            a11yLabel: _(
              msg`You can select either images or videos. Taking the first video.`,
            ),
          })
          const video = ensureVideoMimeType(videos[0])

          await validateAndSelectVideo(video, onSelectVideo, setError, _)
          return
        } else {
          toast.show({
            type: 'info',
            content: _(msg`Taking first 4 images and discarding videos.`),
            a11yLabel: _(msg`Taking first 4 images and discarding videos.`),
          })
          const imagesToProcess = images.slice(0, 4)
          await handleImageSelection(imagesToProcess, onAdd, _)
          return
        }
      }

      if (videos.length > 1) {
        toast.show({
          type: 'info',
          content: _(msg`Using the first video selected.`),
          a11yLabel: _(msg`Using the first video selected.`),
        })
        const video = ensureVideoMimeType(videos[0])

        await validateAndSelectVideo(video, onSelectVideo, setError, _)
        return
      }

      if (videos.length === 1) {
        const video = ensureVideoMimeType(videos[0])

        await validateAndSelectVideo(video, onSelectVideo, setError, _)
        return
      }

      if (images.length > 0) {
        const maxAllowed = 4 - size

        if (images.length > 4) {
          toast.show({
            type: 'info',
            content: _(msg`You can only upload up to 4 images at a time.`),
            a11yLabel: _(msg`You can only upload up to 4 images at a time.`),
          })
          await handleImageSelection(images.slice(0, 4), onAdd, size)
          return
        }

        if (size + images.length > 4) {
          toast.show({
            type: 'info',
            content: _(msg`You can only upload up to 4 images.`),
            a11yLabel: _(msg`You can only upload up to 4 images.`),
          })
          await handleImageSelection(images.slice(0, maxAllowed), onAdd, _)
          return
        }

        await handleImageSelection(images, onAdd, _)
      }
    },
    [_, onAdd, onSelectVideo, setError, size],
  )

  const onPressSelectMedia = useCallback(async () => {
    if (isNative) {
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        toast.show({
          type: 'error',
          content: _(msg`You need to allow access to your media library.`),
          a11yLabel: _(msg`You need to allow access to your media library.`),
        })
        return
      }
    }

    //APiligrim
    //Note: selectionLimit doesn't work reliably on Android, so we handle limiting in code
    const response = await sheetWrapper(
      launchImageLibraryAsync({
        exif: false,
        mediaTypes: ['images', 'videos'],
        quality: 1,
        allowsMultipleSelection: true,
        legacy: true,
      }),
    )

    if (!response.assets || response.assets.length === 0) {
      return
    }

    await processSelectedAssets(response.assets)
  }, [
    requestPhotoAccessIfNeeded,
    requestVideoAccessIfNeeded,
    sheetWrapper,
    _,
    processSelectedAssets,
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
      <Image
        size="lg"
        style={disabled && t.atoms.text_contrast_low}
        accessibilityIgnoresInvertColors={true}
      />
    </Button>
  )
}

async function handleImageSelection(
  images: ImagePickerAsset[],
  onAdd: (next: ComposerImage[]) => void,
  _: any,
) {
  const imageMetas = images.map(image => ({
    mime: image.mimeType || 'image/jpeg',
    height: image.height,
    width: image.width,
    path: image.uri,
    size: getDataUriSize(image.uri),
  }))

  const results = await Promise.all(
    imageMetas.map(img => createComposerImage(img)),
  )

  onAdd(results)
}

type ValidatedVideoAsset = ImagePickerAsset & {
  mimeType: string
}

function ensureVideoMimeType(asset: ImagePickerAsset): ValidatedVideoAsset {
  if (asset.mimeType) {
    return asset as ValidatedVideoAsset
  }

  if (!asset.uri) {
    return {...asset, mimeType: 'video/mp4'} as ValidatedVideoAsset
  }

  const extension = asset.uri.split('.').pop()?.toLowerCase()
  let mimeType: string

  switch (extension) {
    case 'mp4':
      mimeType = 'video/mp4'
      break
    case 'mov':
      mimeType = 'video/quicktime'
      break
    case 'webm':
      mimeType = 'video/webm'
      break
    case 'avi':
      mimeType = 'video/x-msvideo'
      break
    default:
      mimeType = 'video/mp4'
  }

  return {...asset, mimeType} as ValidatedVideoAsset
}
