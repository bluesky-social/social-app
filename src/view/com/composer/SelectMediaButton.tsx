import {useCallback} from 'react'
import {
  type ImagePickerAsset,
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_MAX_DURATION_MS} from '#/lib/constants'
import {
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {extractDataUriMime} from '#/lib/media/util'
import {mimeToExt} from '#/lib/media/video/util'
import {logger} from '#/logger'
import {isIOS, isNative, isWeb} from '#/platform/detection'
import {MAX_IMAGES} from '#/view/com/composer/state/composer'
import {getVideoMetadata} from '#/view/com/composer/videos/pickVideo'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import * as toast from '#/components/Toast'

export type SelectMediaButtonProps = {
  disabled?: boolean
  selectedAssetsCount: number
  onSelectAssets: (props: {
    type: AssetType
    assets: ImagePickerAsset[]
    errors: string[]
  }) => void
}

/**
 * Generic asset classes, or buckets, that we support.
 */
type AssetType = 'video' | 'image' | 'gif'

/**
 * Shadows `ImagePickerAsset` from `expo-image-picker`, but with a guaranteed `mimeType`
 */
type ValidatedImagePickerAsset = Omit<ImagePickerAsset, 'mimeType'> & {
  mimeType: string
}

/**
 * Codes for known validation states
 */
enum SelectedAssetError {
  Unsupported = 'Unsupported',
  MixedTypes = 'MixedTypes',
  MaxImages = 'MaxImages',
  MaxVideos = 'MaxVideos',
  VideoTooLong = 'VideoTooLong',
  MaxGIFs = 'MaxGIFs',
  NoGifsOnNative = 'NoGifsOnNative',
}

/**
 * Supported video mime types. This differs slightly from
 * `SUPPORTED_MIME_TYPES` from `#/lib/constants` because we only care about
 * videos here.
 */
const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/quicktime',
] as const
type SupportedVideoMimeType = (typeof SUPPORTED_VIDEO_MIME_TYPES)[number]
function isSupportedVideoMimeType(
  mimeType: string,
): mimeType is SupportedVideoMimeType {
  return SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType as SupportedVideoMimeType)
}

/**
 * Supported image mime types.
 */
const SUPPORTED_IMAGE_MIME_TYPES = (
  [
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    isIOS && 'image/heic',
  ] as const
).filter(Boolean)
type SupportedImageMimeType = Exclude<
  (typeof SUPPORTED_IMAGE_MIME_TYPES)[number],
  boolean
>
function isSupportedImageMimeType(
  mimeType: string,
): mimeType is SupportedImageMimeType {
  return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType)
}

/**
 * This is a last-ditch effort type thing here, try not to rely on this.
 */
const extensionToMimeType: Record<
  string,
  SupportedVideoMimeType | SupportedImageMimeType
> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  webp: 'image/webp',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  heic: 'image/heic',
}

/**
 * Attemps to bucket the given asset into one of our known types based on its
 * `mimeType`. If `mimeType` is not available, we try to infer it through
 * various means.
 */
function classifyImagePickerAsset(asset: ImagePickerAsset):
  | {
      success: true
      type: AssetType
      mimeType: string
    }
  | {
      success: false
      type: undefined
      mimeType: undefined
    } {
  /*
   * Try to use the `mimeType` reported by Expo's library first.
   */
  let mimeType = asset.mimeType

  if (!mimeType) {
    /*
     * We can try to infer this from the data-uri.
     */
    const maybeMimeType = extractDataUriMime(asset.uri)

    if (
      maybeMimeType.startsWith('image/') ||
      maybeMimeType.startsWith('video/')
    ) {
      mimeType = maybeMimeType
    } else if (maybeMimeType.startsWith('file/')) {
      /*
       * On the off-chance we get a `file/*` mime, try to infer from the
       * extension.
       */
      const extension = asset.uri.split('.').pop()?.toLowerCase()
      mimeType = extensionToMimeType[extension || '']
    }
  }

  if (!mimeType) {
    return {
      success: false,
      type: undefined,
      mimeType: undefined,
    }
  }

  /*
   * Distill this down into a type "class".
   */
  let type: AssetType | undefined
  if (mimeType === 'image/gif') {
    type = 'gif'
  } else if (mimeType?.startsWith('video/')) {
    type = 'video'
  } else if (mimeType?.startsWith('image/')) {
    type = 'image'
  }

  // console.log({
  //   asset,
  //   type,
  //   mimeType,
  // })

  /*
   * If we weren't able to find a valid type, we don't support this asset.
   */
  if (!type) {
    return {
      success: false,
      type: undefined,
      mimeType: undefined,
    }
  }

  return {
    success: true,
    type,
    mimeType,
  }
}

/*
 * WEB ONLY. On web, certain file formats (like `.mov`) don't give us a
 * duration or dimensions, so we need to load the file manually to extract
 * this.
 */
async function getAdditionalVideoMetadata(asset: ValidatedImagePickerAsset) {
  if (isNative) return asset
  const file = await fetch(asset.uri)
    .then(res => res.blob())
    .then(
      blob =>
        new File([blob], `tmp.${mimeToExt(asset.mimeType)}`, {
          type: asset.mimeType,
        }),
    )
  return await getVideoMetadata(file)
}

/**
 * Takes in raw assets from `expo-image-picker` and applies validation. Returns
 * the dominant `AssetType`, any valid assets, and any errors encountered along
 * the way.
 */
async function processImagePickerAssets(
  assets: ImagePickerAsset[],
  {
    selectionLimit,
  }: {
    selectionLimit: number
  },
) {
  /*
   * A deduped set of error codes, which we'll use later
   */
  const errors = new Set<SelectedAssetError>()

  /*
   * We only support selecting a single type of media at a time, so this
   * gets set to whatever the first asset type is.
   */
  let primaryMediaType: AssetType | undefined

  /*
   * This will hold the assets that we can actually use, after filtering
   */
  let supportedAssets: ValidatedImagePickerAsset[] = []

  for (const asset of assets) {
    const {success, type, mimeType} = classifyImagePickerAsset(asset)

    if (!success) {
      errors.add(SelectedAssetError.Unsupported)
      continue
    }

    // set the primary media type to the first valid asset type
    primaryMediaType = primaryMediaType || type

    // ignore mixed types
    if (type !== primaryMediaType) {
      errors.add(SelectedAssetError.MixedTypes)
      continue
    }

    if (type === 'video') {
      /**
       * We don't care too much about mimeType at this point on native,
       * since the `processVideo` step later on will convert to `.mp4`.
       */
      if (isWeb && !isSupportedVideoMimeType(mimeType)) {
        errors.add(SelectedAssetError.Unsupported)
        continue
      }
    }

    if (type === 'image') {
      if (!isSupportedImageMimeType(mimeType)) {
        errors.add(SelectedAssetError.Unsupported)
        continue
      }
    }

    if (type === 'gif') {
      if (isNative) {
        errors.add(SelectedAssetError.NoGifsOnNative)
        continue
      }
    }

    /*
     * All validations passed, we have an asset!
     */
    supportedAssets.push({
      mimeType,
      ...asset,
    })
  }

  if (primaryMediaType === 'image') {
    if (supportedAssets.length > selectionLimit) {
      errors.add(SelectedAssetError.MaxImages)
      supportedAssets = supportedAssets.slice(0, selectionLimit)
    }
  } else if (primaryMediaType === 'video') {
    if (supportedAssets.length > 1) {
      errors.add(SelectedAssetError.MaxVideos)
      supportedAssets = supportedAssets.slice(0, 1)
    }

    const selectedVideo = supportedAssets[0]

    if (typeof selectedVideo.duration !== 'number') {
      try {
        const metadata = await getAdditionalVideoMetadata(selectedVideo)
        selectedVideo.duration = metadata.duration
        selectedVideo.width = metadata.width
        selectedVideo.height = metadata.height
      } catch (e: any) {
        logger.error(`processSelectedAssets: failed to get video metadata`, {
          safeMessage: e.message,
        })
        errors.add(SelectedAssetError.Unsupported)
        supportedAssets = []
      }
    } else {
      /*
       * The `duration` is in seconds on web, but in milliseconds on
       * native. We normalize to milliseconds.
       */
      if (isWeb) {
        selectedVideo.duration = selectedVideo.duration * 1000
      }
    }

    if (
      selectedVideo.duration &&
      selectedVideo.duration > VIDEO_MAX_DURATION_MS
    ) {
      errors.add(SelectedAssetError.VideoTooLong)
      supportedAssets = []
    }
  } else if (primaryMediaType === 'gif') {
    if (supportedAssets.length > 1) {
      errors.add(SelectedAssetError.MaxGIFs)
      supportedAssets = supportedAssets.slice(0, 1)
    }
  }

  return {
    type: primaryMediaType!, // set above
    assets: supportedAssets,
    errors,
  }
}

export function SelectMediaButton({
  disabled,
  selectedAssetsCount,
  onSelectAssets,
}: SelectMediaButtonProps) {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const t = useTheme()

  const selectionLimit = MAX_IMAGES - selectedAssetsCount

  const processSelectedAssets = useCallback(
    async (rawAssets: ImagePickerAsset[]) => {
      const {
        type,
        assets,
        errors: errorCodes,
      } = await processImagePickerAssets(rawAssets, {selectionLimit})

      /*
       * Convert error codes to user-friendly messages.
       */
      const errors = Array.from(errorCodes).map(error => {
        return {
          [SelectedAssetError.Unsupported]: _(
            msg`One or more of your selected files are not supported.`,
          ),
          [SelectedAssetError.MixedTypes]: _(
            msg`Selecting multiple media types is not supported.`,
          ),
          [SelectedAssetError.MaxImages]: _(
            msg`You can select up to ${MAX_IMAGES} total images.`,
          ),
          [SelectedAssetError.MaxVideos]: _(
            msg`You can only select one video at a time.`,
          ),
          [SelectedAssetError.VideoTooLong]: _(
            msg`Videos must be less than 3 minutes long.`,
          ),
          [SelectedAssetError.MaxGIFs]: _(
            msg`You can only select one GIF at a time.`,
          ),
          [SelectedAssetError.NoGifsOnNative]: _(
            msg`GIFs are only supported on web at this time.`,
          ),
        }[error]
      })

      /*
       * Report the selected assets and any errors back to the
       * composer.
       */
      onSelectAssets({
        type,
        assets,
        errors,
      })
    },
    [_, onSelectAssets, selectionLimit],
  )

  const onPressSelectMedia = useCallback(async () => {
    if (isNative) {
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        toast.show(_(msg`You need to allow access to your media library.`), {
          type: 'error',
        })
        return
      }
    }

    const {assets, canceled} = await sheetWrapper(
      launchImageLibraryAsync({
        exif: false,
        mediaTypes: ['images', 'videos'],
        quality: 1,
        allowsMultipleSelection: true,
        legacy: true,
        selectionLimit: isIOS ? selectionLimit : undefined,
        preferredAssetRepresentationMode:
          UIImagePickerPreferredAssetRepresentationMode.Current,
      }),
    )

    if (canceled) return

    await processSelectedAssets(assets)
  }, [
    _,
    requestPhotoAccessIfNeeded,
    requestVideoAccessIfNeeded,
    sheetWrapper,
    processSelectedAssets,
    selectionLimit,
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
      <ImageIcon
        size="lg"
        style={disabled && t.atoms.text_contrast_low}
        accessibilityIgnoresInvertColors={true}
      />
    </Button>
  )
}
