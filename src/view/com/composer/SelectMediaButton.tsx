import {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {
  type ImagePickerAsset,
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_MAX_DURATION_MS, VIDEO_MAX_SIZE} from '#/lib/constants'
import {
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {extractDataUriMime, getDataUriSize} from '#/lib/media/util'
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
  /**
   * If set, this limits the types of assets that can be selected.
   */
  allowedAssetTypes: AssetType | undefined
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
export type AssetType = 'video' | 'image' | 'gif'

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
  FileTooBig = 'FileTooBig',
  MaxGIFs = 'MaxGIFs',
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
    isNative && 'image/heic',
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
 * Attempts to bucket the given asset into one of our known types based on its
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
   * Try to use the `mimeType` reported by `expo-image-picker` first.
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

export enum GetMetadataError {
  FileTooLarge = 'FileTooLarge',
  UnknownExtension = 'UnknownExtension',
  FileCreationFailure = 'FileCreationFailure',
  MetadataExtractionFailure = 'MetadataExtractionFailure',
}

async function getMetadata(
  uri: string,
  mimeType?: string,
): Promise<
  | {
      error: GetMetadataError
      asset: undefined
    }
  | {
      error: undefined
      asset: ImagePickerAsset
    }
> {
  const mime = mimeType || extractDataUriMime(uri)
  const ext = mimeToExt(mime)

  if (!ext) {
    return {
      error: GetMetadataError.UnknownExtension,
      asset: undefined,
    }
  }

  const [, data] = uri.split(',')
  const size = (data.length * 3) / 4
  if (size > VIDEO_MAX_SIZE) {
    return {
      error: GetMetadataError.FileTooLarge,
      asset: undefined,
    }
  }

  const binary = atob(data)
  if (binary.length > VIDEO_MAX_SIZE) {
    return {
      error: GetMetadataError.FileTooLarge,
      asset: undefined,
    }
  }

  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  const file = new File([array], `tmp.${ext}`, {
    type: mime,
  })

  if (!file) {
    return {
      error: GetMetadataError.FileCreationFailure,
      asset: undefined,
    }
  }

  try {
    const asset = await getVideoMetadata(file)
    return {
      error: undefined,
      asset,
    }
  } catch (e) {
    logger.error(`getMetadata: failed to get file metadata`, {
      safeMessage: e instanceof Error ? e.message : String(e),
    })
    return {
      error: GetMetadataError.MetadataExtractionFailure,
      asset: undefined,
    }
  }
}

/**
 * Takes in raw assets from `expo-image-picker` and applies validation. Returns
 * the dominant `AssetType`, any valid assets, and any errors encountered along
 * the way.
 */
async function processImagePickerAssets(
  assets: ImagePickerAsset[],
  {
    selectionCountRemaining,
    allowedAssetTypes,
  }: {
    selectionCountRemaining: number
    allowedAssetTypes: AssetType | undefined
  },
) {
  /*
   * A deduped set of error codes, which we'll use later
   */
  const errors = new Set<SelectedAssetError>()

  /*
   * We only support selecting a single type of media at a time, so this gets
   * set to whatever the first valid asset type is, OR to whatever
   * `allowedAssetTypes` is set to.
   */
  let selectableAssetType: AssetType | undefined

  /*
   * This will hold the assets that we can actually use, after filtering
   */
  let supportedAssets: ValidatedImagePickerAsset[] = []

  for (const asset of assets) {
    /*
     * Some browsers won't even load massive files e.g. Arc
     */
    if (!asset.uri) {
      errors.add(SelectedAssetError.FileTooBig)
      continue
    }

    /*
     * If the file _did_ load, great, we can just check the size here.
     */
    if (asset.file && asset.file.size > VIDEO_MAX_SIZE) {
      errors.add(SelectedAssetError.FileTooBig)
      continue
    }

    /*
     * In other cases e.g. Safari, we don't even get a `file`, so we want to
     * approximate the size and fail early if we can.
     */
    if (getDataUriSize(asset.uri) > VIDEO_MAX_SIZE) {
      errors.add(SelectedAssetError.FileTooBig)
      continue
    }

    const {success, type, mimeType} = classifyImagePickerAsset(asset)

    if (!success) {
      errors.add(SelectedAssetError.Unsupported)
      continue
    }

    /*
     * If we have an `allowedAssetTypes` prop, constrain to that. Otherwise,
     * set this to the first valid asset type we see, and then use that to
     * constrain all remaining selected assets.
     */
    selectableAssetType = allowedAssetTypes || selectableAssetType || type

    // ignore mixed types
    if (type !== selectableAssetType) {
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

    /*
     * All validations passed, we have an asset!
     */
    supportedAssets.push({
      mimeType,
      ...asset,
    })
  }

  if (supportedAssets.length > 0) {
    if (selectableAssetType === 'image') {
      if (supportedAssets.length > selectionCountRemaining) {
        errors.add(SelectedAssetError.MaxImages)
        supportedAssets = supportedAssets.slice(0, selectionCountRemaining)
      }
    } else if (selectableAssetType === 'video') {
      if (supportedAssets.length > 1) {
        errors.add(SelectedAssetError.MaxVideos)
        supportedAssets = supportedAssets.slice(0, 1)
      }

      const selectedVideo = supportedAssets[0]

      if (typeof selectedVideo.duration !== 'number') {
        /*
         * We can only do this on web
         */
        if (isWeb) {
          const {error, asset} = await getMetadata(
            selectedVideo.uri,
            selectedVideo.mimeType,
          )
          if (error) {
            switch (error) {
              case GetMetadataError.FileTooLarge:
                errors.add(SelectedAssetError.FileTooBig)
                supportedAssets = []
                break
              default:
                errors.add(SelectedAssetError.Unsupported)
                supportedAssets = []
                break
            }
          } else {
            selectedVideo.duration = asset.duration
            selectedVideo.width = asset.width
            selectedVideo.height = asset.height
          }
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
    } else if (selectableAssetType === 'gif') {
      if (supportedAssets.length > 1) {
        errors.add(SelectedAssetError.MaxGIFs)
        supportedAssets = supportedAssets.slice(0, 1)
      }
    }
  }

  return {
    type: selectableAssetType!, // set above
    assets: supportedAssets,
    errors,
  }
}

export function SelectMediaButton({
  disabled,
  allowedAssetTypes,
  selectedAssetsCount,
  onSelectAssets,
}: SelectMediaButtonProps) {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const t = useTheme()

  const selectionCountRemaining = MAX_IMAGES - selectedAssetsCount

  const processSelectedAssets = useCallback(
    async (rawAssets: ImagePickerAsset[]) => {
      const {
        type,
        assets,
        errors: errorCodes,
      } = await processImagePickerAssets(rawAssets, {
        selectionCountRemaining,
        allowedAssetTypes,
      })

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
            msg({
              message: `You can select up to ${plural(MAX_IMAGES, {
                other: '# images',
              })} in total.`,
              comment: `Error message for maximum number of images that can be selected to add to a post, currently 4 but may change.`,
            }),
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
          [SelectedAssetError.FileTooBig]: _(
            msg`This file is too large. Maximum size is 100mb.`,
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
    [_, onSelectAssets, selectionCountRemaining, allowedAssetTypes],
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

    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    const {assets, canceled} = await sheetWrapper(
      launchImageLibraryAsync({
        exif: false,
        mediaTypes: ['images', 'videos'],
        quality: 1,
        allowsMultipleSelection: true,
        legacy: true,
        selectionLimit: isIOS ? selectionCountRemaining : undefined,
        preferredAssetRepresentationMode:
          UIImagePickerPreferredAssetRepresentationMode.Current,
        videoMaxDuration: VIDEO_MAX_DURATION_MS / 1000,
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
    selectionCountRemaining,
  ])

  return (
    <Button
      testID="openMediaBtn"
      onPress={onPressSelectMedia}
      label={_(
        msg({
          message: `Add media to post`,
          comment: `Accessibility label for button in composer to add photos or a video to a post`,
        }),
      )}
      accessibilityHint={
        isNative
          ? _(
              msg({
                message: `Opens device gallery to select up to ${plural(
                  MAX_IMAGES,
                  {
                    other: '# images',
                  },
                )}, or a single video.`,
                comment: `Accessibility hint on native for button in composer to add images or a video to a post. Maximum number of images that can be selected is currently 4 but may change.`,
              }),
            )
          : _(
              msg({
                message: `Opens device gallery to select up to ${plural(
                  MAX_IMAGES,
                  {
                    other: '# images',
                  },
                )}, or a single video or GIF.`,
                comment: `Accessibility hint on web for button in composer to add images, a video, or a GIF to a post. Maximum number of images that can be selected is currently 4 but may change.`,
              }),
            )
      }
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
