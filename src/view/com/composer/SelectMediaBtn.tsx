import {useCallback} from 'react'
import {
  type ImagePickerAsset,
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {extractDataUriMime} from '#/lib/media/util'
import {isIOS, isNative} from '#/platform/detection'
import {MAX_IMAGES} from '#/view/com/composer/state/composer'
// import {getVideoMetadata} from '#/view/com/composer/videos/pickVideo'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'
import {toast} from '#/components/Toast'

export type Props = {
  size: number
  disabled?: boolean
  setError: (error: string) => void
  selectedAssetsCount: number
  onSelectAssets: (props: {
    type: SelectedAsset['type']
    assets: ImagePickerAsset[]
    errors: string[]
  }) => void
}

export type SelectedAsset = {
  asset: ImagePickerAsset
  type: 'video' | 'image' | 'gif'
}

export enum SelectedAssetError {
  Unsupported = 'Unsupported',
  MixedTypes = 'MixedTypes',
  MaxImages = 'MaxImages',
  MaxVideos = 'MaxVideos',
  MaxGIFs = 'MaxGIFs',
}

const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'video/quicktime',
] as const
export type SupportedVideoMimeType = (typeof SUPPORTED_VIDEO_MIME_TYPES)[number]

const SUPPORTED_IMAGE_MIME_TYPES = (
  [
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    isIOS && 'image/heic',
  ] as const
).filter(Boolean)
export type SupportedImageMimeType = Exclude<
  (typeof SUPPORTED_IMAGE_MIME_TYPES)[number],
  boolean
>

const extensionToMimeType: Record<
  string,
  SupportedVideoMimeType | SupportedImageMimeType
> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  heic: 'image/heic',
}

function getImagePickerAssetType(asset: ImagePickerAsset):
  | {
      success: true
      type: SelectedAsset['type']
      mimeType: string
    }
  | {
      success: false
      type: undefined
      mimeType: undefined
    } {
  let mimeType = asset.mimeType

  if (!mimeType) {
    const maybeMimeType = extractDataUriMime(asset.uri)

    if (
      maybeMimeType.startsWith('image/') ||
      maybeMimeType.startsWith('video/')
    ) {
      mimeType = maybeMimeType
    } else if (maybeMimeType.startsWith('file/')) {
      const extension = asset.uri.split('.').pop()?.toLowerCase()
      mimeType = extensionToMimeType[extension || '']
    }
  }

  let type: SelectedAsset['type'] | undefined

  if (mimeType === 'image/gif') {
    type = 'gif'
  } else if (
    mimeType?.startsWith('video/') &&
    SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType as SupportedVideoMimeType)
  ) {
    type = 'video'
  } else if (
    mimeType?.startsWith('image/') &&
    SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType)
  ) {
    type = 'image'
  }

  if (!type || !mimeType) {
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

export function SelectMediaBtn({
  disabled,
  selectedAssetsCount,
  onSelectAssets,
}: Props) {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const t = useTheme()

  const selectionLimit = MAX_IMAGES - selectedAssetsCount

  const processSelectedAssets = useCallback(
    async (assets: ImagePickerAsset[]) => {
      const errors = new Set<SelectedAssetError>()
      let supportedAssets: ImagePickerAsset[] = []
      let primaryMediaType: SelectedAsset['type'] | undefined

      for (const asset of assets) {
        const {success, type, mimeType} = getImagePickerAssetType(asset)

        if (!success) {
          errors.add(SelectedAssetError.Unsupported)
          continue
        }

        // set the primary media type to the first valid asset type
        primaryMediaType = primaryMediaType || type

        if (type !== primaryMediaType) {
          // Selecting a mix of media types is not allowed
          errors.add(SelectedAssetError.MixedTypes)
          continue
        }

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
      } else {
        if (supportedAssets.length > 1) {
          if (primaryMediaType === 'video') {
            errors.add(SelectedAssetError.MaxVideos)
          } else if (primaryMediaType === 'gif') {
            errors.add(SelectedAssetError.MaxGIFs)
          }

          supportedAssets = supportedAssets.slice(0, 1)
        }
      }

      onSelectAssets({
        type: primaryMediaType!,
        assets: supportedAssets,
        errors: Array.from(errors).map(error => {
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
            [SelectedAssetError.MaxGIFs]: _(
              msg`You can only select one GIF at a time.`,
            ),
          }[error]
        }),
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
        toast.show({
          type: 'error',
          content: 'You need to allow access to your media library.',
          a11yLabel: 'You need to allow access to your media library.',
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
        selectionLimit,
        preferredAssetRepresentationMode:
          UIImagePickerPreferredAssetRepresentationMode.Current,
      }),
    )

    if (canceled) return

    await processSelectedAssets(assets)
  }, [
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
      <Image
        size="lg"
        style={disabled && t.atoms.text_contrast_low}
        accessibilityIgnoresInvertColors={true}
      />
    </Button>
  )
}
