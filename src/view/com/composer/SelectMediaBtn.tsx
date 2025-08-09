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

// (Note)APiligrim
// The SelectMediaBtn is responsible for supporting the selection of the following media in the Composer:
// up to 4 images
// up to 1 video
// up to 1 GIF (handled like a video - passed to onSelectVideo)

export function SelectMediaBtn({disabled, onAdd, onSelectVideo}: Props) {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const t = useTheme()

  const processSelectedAssets = useCallback(
    async (assets: ImagePickerAsset[]) => {
      function performEarlyValidation(assetList: ImagePickerAsset[]) {
        const images: ImagePickerAsset[] = []
        const videosAndGifs: ImagePickerAsset[] = []
        const invalids: ImagePickerAsset[] = []

        // Categorize assets using basic checks (even without complete metadata)
        for (const asset of assetList) {
          const ext = asset.uri?.split('.').pop()?.toLowerCase()
          const isGif = isGifAsset(asset, ext)
          const isVideo = isVideoAsset(asset)
          const isImage = isImageAsset(asset)

          if (isGif || isVideo) {
            // GIFs and videos are handled the same way (fixing regression)
            videosAndGifs.push(asset)
          } else if (isImage) {
            images.push(asset)
          } else {
            invalids.push(asset)
            console.error('Invalid asset detected:', asset)
          }
        }

        // Determine media type based on selected assets and preserve selection order
        let mediaType: 'image' | 'video' | null = null
        for (const asset of assetList) {
          const ext = asset.uri?.split('.').pop()?.toLowerCase()
          const isGif = isGifAsset(asset, ext)
          const isVideo = isVideoAsset(asset)
          const isImage = isImageAsset(asset)

          if (isGif || isVideo) {
            // GIFs are treated like videos
            mediaType = 'video'
            break
          } else if (isImage) {
            mediaType = 'image'
            break
          }
        }

        let validAssets: ImagePickerAsset[] = []
        let trimmed = false

        if (mediaType === 'image') {
          validAssets = images.slice(0, 4)
          if (images.length > 4) trimmed = true

          if (videosAndGifs.length > 0) {
            toast.show({
              type: 'info',
              content:
                'You can select either images or videos. Taking the images.',
              a11yLabel:
                'You can select either images or videos. Taking the images.',
            })
          }
        } else if (mediaType === 'video') {
          // For videos/GIFs: take only the first one, show toast if mixed media
          validAssets = videosAndGifs.slice(0, 1)

          if (images.length > 0 || videosAndGifs.length > 1) {
            toast.show({
              type: 'info',
              content:
                'You can select either images or videos. Taking the first video.',
              a11yLabel:
                'You can select either images or videos. Taking the first video.',
            })
          }
        }

        return {validAssets, mediaType, trimmed}
      }

      async function normalizeAssets(assetList: ImagePickerAsset[]) {
        const normalizedAssets: ImagePickerAsset[] = []
        const failedAssets: ImagePickerAsset[] = []

        for (const asset of assetList) {
          try {
            let normalizedAsset = asset

            // Check if we need to enrich metadata
            const needsEnrichment =
              !asset.mimeType ||
              (asset.type === 'video' && !asset.duration) ||
              (isGifAsset(asset, asset.uri?.split('.').pop()?.toLowerCase()) &&
                !asset.duration)

            if (needsEnrichment) {
              const enrichedAsset = await getMissingMetadata(asset)
              if (enrichedAsset) {
                normalizedAsset = enrichedAsset
              }

              // Last ditch effort: infer mimeType from extension if still missing
              if (!normalizedAsset.mimeType) {
                normalizedAsset = {
                  ...normalizedAsset,
                  mimeType:
                    normalizedAsset.type === 'image'
                      ? 'image/jpeg'
                      : inferMimeTypeFromURI(normalizedAsset.uri || ''),
                }
              }
            }

            normalizedAssets.push(normalizedAsset)
          } catch (error) {
            console.error('Failed to normalize asset:', asset, error)
            failedAssets.push(asset)
          }
        }

        return {normalizedAssets, failedAssets}
      }

      function performFinalValidation(
        assetList: ImagePickerAsset[],
        mediaType: 'image' | 'video' | null,
      ) {
        const validAssets: ImagePickerAsset[] = []

        for (const asset of assetList) {
          if (mediaType === 'image') {
            // Images just need basic validation
            if (asset.mimeType && asset.mimeType.startsWith('image/')) {
              validAssets.push(asset)
            } else {
              console.error('Image failed final validation:', asset)
            }
          } else if (mediaType === 'video') {
            // Videos and GIFs need duration and format checks
            const isValid = validateVideoOrGIF(asset)
            if (isValid) {
              validAssets.push(asset)
            } else {
              console.error('Video/GIF failed final validation:', asset)
            }
          }
        }

        return validAssets
      }

      // 1. Early validation to detect asset format and count limits
      const {validAssets, mediaType, trimmed} = performEarlyValidation(assets)

      if (validAssets.length === 0) {
        toast.show({
          type: 'error',
          content: 'No valid media files selected',
          a11yLabel: 'No valid media files selected',
        })
        return
      }

      // Show toast if selected files were trimmed
      if (trimmed) {
        toast.show({
          type: 'info',
          content: 'Selection limited to first 4 files.',
          a11yLabel: 'Selection limited to first 4 files.',
        })
      }

      // 2. Normalize assets by adding missing metadata
      const {normalizedAssets, failedAssets} =
        await normalizeAssets(validAssets)

      if (failedAssets.length > 0) {
        console.error('Some assets failed to normalize:', failedAssets)
        if (normalizedAssets.length === 0) {
          toast.show({
            type: 'error',
            content: 'Failed to process selected files',
            a11yLabel: 'Failed to process selected files',
          })
          return
        } else {
          toast.show({
            type: 'info',
            content: 'Some files could not be processed. Using valid files.',
            a11yLabel: 'Some files could not be processed. Using valid files.',
          })
        }
      }

      // 3. Final validation checks on normalized assets
      const finalAssets = performFinalValidation(normalizedAssets, mediaType)

      if (finalAssets.length === 0) {
        toast.show({
          type: 'error',
          content: 'This media type is not supported',
          a11yLabel: 'This media type is not supported',
        })
        return
      }

      // 4. Add finalized assets to the composer
      if (mediaType === 'image') {
        const composerImages = await generateComposerImages(finalAssets)
        onAdd(composerImages)
      } else {
        // Both videos and GIFs get selected with onSelectVideo
        onSelectVideo(finalAssets[0])
      }
    },
    [onAdd, onSelectVideo],
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
          content: 'You need to allow access to your media library.',
          a11yLabel: 'You need to allow access to your media library.',
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
    processSelectedAssets,
  ])

  return (
    <Button
      testID="openMediaBtn"
      onPress={onPressSelectMedia}
      label={_(msg`Media`)}
      accessibilityHint={_(
        msg`Opens device gallery to select images, a video, or a GIF.`,
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

async function generateComposerImages(
  images: ImagePickerAsset[],
): Promise<ComposerImage[]> {
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

  return results
}

function isGifAsset(asset: ImagePickerAsset, ext?: string): boolean {
  return asset.mimeType === 'image/gif' || ext === 'gif'
}

function isVideoAsset(asset: ImagePickerAsset): boolean {
  if (asset.type === 'video') {
    return true
  }
  if (asset.mimeType && asset.mimeType.startsWith('video/')) {
    return true
  }
  if (asset.uri && /\.(mp4|mov|avi|webm|m4v)$/i.test(asset.uri)) {
    return true
  }

  // Check for data URI with video mime type
  if (asset.uri && asset.uri.startsWith('data:video/')) {
    return true
  }

  if (typeof asset.duration === 'number' && asset.duration > 0) {
    return true
  }

  return false
}

function isImageAsset(asset: ImagePickerAsset): boolean {
  if (asset.type === 'image') return true
  if (asset.mimeType && asset.mimeType.startsWith('image/')) return true
  return false
}

function validateVideoOrGIF(asset: ImagePickerAsset): boolean {
  if (!asset) {
    console.error('Asset is null or undefined')
    return false
  }

  if (isWeb) {
    // asset.duration is null for gifs (see the TODO in pickVideo.web.ts)
    if (asset.duration && asset.duration > VIDEO_MAX_DURATION_MS) {
      toast.show({
        type: 'error',
        content: 'Videos must be less than 3 minutes long',
        a11yLabel: 'Videos must be less than 3 minutes long',
      })
      return false
    }
    // compression step on native converts to mp4, so no need to check there
    if (
      asset.mimeType &&
      !SUPPORTED_MIME_TYPES.includes(asset.mimeType as SupportedMimeTypes)
    ) {
      toast.show({
        type: 'error',
        content: 'This video format is not supported',
        a11yLabel: 'This video format is not supported',
      })
      return false
    }
  } else {
    // Check if asset exists and has duration property before accessing it
    if (!asset.duration || typeof asset.duration !== 'number') {
      toast.show({
        type: 'error',
        content: 'Please select a valid video file',
        a11yLabel: 'Please select a valid video file',
      })
      return false
    }
    if (asset.duration > VIDEO_MAX_DURATION_MS) {
      toast.show({
        type: 'error',
        content: 'Videos must be less than 3 minutes long',
        a11yLabel: 'Videos must be less than 3 minutes long',
      })
      return false
    }
  }
  return true
}

function inferMimeTypeFromURI(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'mp4':
      return 'video/mp4'
    case 'mov':
      return 'video/quicktime'
    case 'webm':
      return 'video/webm'
    case 'avi':
      return 'video/x-msvideo'
    case 'gif':
      return 'image/gif'
    default:
      return 'video/mp4'
  }
}

async function getMissingMetadata(
  asset: ImagePickerAsset,
): Promise<ImagePickerAsset | null> {
  if (!isWeb || !asset.uri) return asset

  if (asset.uri.startsWith('data:')) {
    try {
      const mimeTypeMatch = asset.uri.match(/^data:([^;]+)/)
      const extractedMimeType = mimeTypeMatch ? mimeTypeMatch[1] : null

      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const file = new File([blob], 'file', {
        type: blob.type || extractedMimeType || '',
      })

      let enrichedAsset = asset

      // If it's a video, try to get video metadata
      if (
        extractedMimeType?.startsWith('video/') ||
        blob.type.startsWith('video/')
      ) {
        try {
          const videoAsset = await getVideoMetadata(file)
          enrichedAsset = {
            ...asset,
            ...videoAsset,
            mimeType: videoAsset.mimeType || extractedMimeType || blob.type,
            type: 'video',
          }
        } catch (error) {
          console.error(
            ' if getting metadata for a video fails, using basic info',
            error,
          )

          enrichedAsset = {
            ...asset,
            mimeType: extractedMimeType || blob.type,
            type: extractedMimeType?.startsWith('video/')
              ? 'video'
              : asset.type,
          }
        }
      } else {
        // For non-video assets (images and GIFs), setting the mime type
        enrichedAsset = {
          ...asset,
          mimeType: extractedMimeType || blob.type,
        }
      }

      return enrichedAsset
    } catch (error) {
      console.error('Failed to extract metadata:', error)
      return null
    }
  }

  return asset
}
