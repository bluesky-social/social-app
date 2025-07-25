import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {ComposerImage, createComposerImage} from '#/state/gallery'
import {getDataUriSize} from '#/lib/media/util'
import {getVideoMetadata} from '#/view/com/composer/videos/pickVideo'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'
import {isNative, isWeb} from '#/platform/detection'
import {msg} from '@lingui/macro'
import {type ImagePickerAsset, launchImageLibraryAsync} from 'expo-image-picker'
import {useCallback} from 'react'
import {useLingui} from '@lingui/react'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {validateAndSelectVideo} from '#/view/com/composer/videos/SelectVideoBtn'
import {
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import * as Toast from '#/view/com/util/Toast'

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
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        return
      }
    }

    // Use expo-image-picker for both native and web to ensure consistent behavior
    const response = await sheetWrapper(
      launchImageLibraryAsync({
        exif: false,
        mediaTypes: ['images', 'videos'],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 0, // No platform limit - we'll handle validation ourselves
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
    size,
    onAdd,
    onSelectVideo,
    setError,
    sheetWrapper,
    _,
  ])

  const processSelectedAssets = useCallback(
    async (assets: ImagePickerAsset[]) => {
      const images: ImagePickerAsset[] = []
      const videos: ImagePickerAsset[] = []
      let firstMediaType: 'image' | 'video' | null = null

      // Separate images and videos with comprehensive detection
      for (const asset of assets) {
        // On web, expo-image-picker might not set metadata properly
        // If we have a data URI but no metadata, we need to extract it manually
        if (
          isWeb &&
          asset.uri &&
          asset.uri.startsWith('data:') &&
          !asset.mimeType &&
          !asset.duration
        ) {
          try {
            // Convert data URI back to File to get metadata
            const response = await fetch(asset.uri)
            const blob = await response.blob()
            const file = new File([blob], 'video', {type: blob.type})

            // Use the same metadata extraction as the working SelectVideoBtn
            const videoAsset = await getVideoMetadata(file)

            // Replace the asset with properly extracted metadata
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
          asset.uri && /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(asset.uri)
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
          Toast.show(
            _(
              msg`You can select either images or videos, but not both. Taking the video and discarding ${images.length} image${images.length > 1 ? 's' : ''}.`,
            ),
            'info',
          )
          const video = videos[0]

          // Ensure video has proper metadata
          if (!video.mimeType && video.uri) {
            const extension = video.uri.split('.').pop()?.toLowerCase()
            if (extension === 'mp4') video.mimeType = 'video/mp4'
            else if (extension === 'mov') video.mimeType = 'video/quicktime'
            else if (extension === 'webm') video.mimeType = 'video/webm'
            else if (extension === 'avi') video.mimeType = 'video/x-msvideo'
          }

          await validateAndSelectVideo(video, onSelectVideo, setError, _)
          return
        } else {
          Toast.show(
            _(
              msg`You can select either images or videos, but not both. Taking the first ${Math.min(4, images.length)} image${Math.min(4, images.length) > 1 ? 's' : ''} and discarding ${videos.length} video${videos.length > 1 ? 's' : ''}.`,
            ),
            'info',
          )
          const imagesToProcess = images.slice(0, 4)
          await handleImageSelection(imagesToProcess, size, onAdd, _)
          return
        }
      }

      if (videos.length > 1) {
        Toast.show(
          _(
            msg`You can only upload 1 video at a time. Using the first video selected.`,
          ),
          'info',
        )
        const video = videos[0]

        if (!video.mimeType && video.uri) {
          const extension = video.uri.split('.').pop()?.toLowerCase()
          if (extension === 'mp4') video.mimeType = 'video/mp4'
          else if (extension === 'mov') video.mimeType = 'video/quicktime'
          else if (extension === 'webm') video.mimeType = 'video/webm'
          else if (extension === 'avi') video.mimeType = 'video/x-msvideo'
        }

        await validateAndSelectVideo(video, onSelectVideo, setError, _)
        return
      }

      if (videos.length === 1) {
        const video = videos[0]

        // Ensure video has proper metadata
        if (!video.mimeType && video.uri) {
          const extension = video.uri.split('.').pop()?.toLowerCase()
          if (extension === 'mp4') video.mimeType = 'video/mp4'
          else if (extension === 'mov') video.mimeType = 'video/quicktime'
          else if (extension === 'webm') video.mimeType = 'video/webm'
          else if (extension === 'avi') video.mimeType = 'video/x-msvideo'
        }

        await validateAndSelectVideo(video, onSelectVideo, setError, _)
        return
      }

      if (images.length > 0) {
        const maxAllowed = 4 - size

        if (images.length > 4) {
          Toast.show(
            _(msg`You can only upload up to 4 images at a time.`),
            'info',
          )
          await handleImageSelection(images.slice(0, 4), size, onAdd, _)
          return
        }

        if (size + images.length > 4) {
          const discarded = size + images.length - 4

          Toast.show(
            _(
              msg`You can only upload up to 4 images total. ${discarded} image${discarded > 1 ? 's' : ''} discarded.`,
            ),
            'info',
          )
          await handleImageSelection(
            images.slice(0, maxAllowed),
            size,
            onAdd,
            _,
          )
          return
        }

        await handleImageSelection(images, size, onAdd, _)
      }
    },
    [size, onAdd, onSelectVideo, setError, _],
  )

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

async function handleImageSelection(
  images: ImagePickerAsset[],
  currentSize: number,
  onAdd: (next: ComposerImage[]) => void,
  _: any,
) {
  // Transform ImagePickerAsset to ImageMeta format (like openPicker does)
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
