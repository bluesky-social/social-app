import {Keyboard} from 'react-native'

import {
  useCameraPermission,
  usePhotoLibraryPermission,
  useVideoLibraryPermission,
} from '#/lib/hooks/usePermissions'
import {openCamera, openUnifiedPicker} from '#/lib/media/picker'
import {MAX_GALLERY_IMAGES} from '#/view/com/composer/state/composer'
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type ComposePromptOpenOptions} from './context'

/**
 * Press handlers for the pill's camera and gallery buttons. Picks media
 * first, then opens the composer with it via `open`.
 */
export function useComposePromptMedia(
  open: ((options?: ComposePromptOpenOptions) => void) | undefined,
) {
  const ax = useAnalytics()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()
  const sheetWrapper = useSheetWrapper()

  const onPressGallery = async () => {
    if (!open) return
    ax.metric('composerPrompt:gallery:press', {})

    // On web, open the composer with the gallery picker auto-opening
    if (!IS_NATIVE) {
      open({openGallery: true})
      return
    }

    try {
      const [photoAccess, videoAccess] = await Promise.all([
        requestPhotoAccessIfNeeded(),
        requestVideoAccessIfNeeded(),
      ])

      if (!photoAccess && !videoAccess) {
        return
      }

      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }

      const {assets, canceled} = await sheetWrapper(
        openUnifiedPicker({selectionCountRemaining: MAX_GALLERY_IMAGES}),
      )

      if (canceled) {
        return
      }

      const imageUris = assets
        .filter(asset => asset.mimeType?.startsWith('image/'))
        .slice(0, MAX_GALLERY_IMAGES)
        .map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }))

      if (imageUris.length > 0) {
        open({imageUris})
      }
    } catch (err: unknown) {
      if (!String(err).toLowerCase().includes('cancel')) {
        ax.logger.error('Error opening image picker', {error: err})
      }
    }
  }

  const onPressCamera = async () => {
    if (!open) return
    ax.metric('composerPrompt:camera:press', {})

    try {
      if (!(await requestCameraAccessIfNeeded())) {
        return
      }

      if (IS_NATIVE && Keyboard.isVisible()) {
        Keyboard.dismiss()
      }

      const image = await openCamera({
        mediaTypes: 'images',
      })
      if (!image) {
        return
      }

      /*
       * Statement form rather than a ternary: React Compiler cannot lower a
       * conditional expression inside a `try`.
       */
      let imageUris
      if (IS_NATIVE) {
        imageUris = [
          {
            uri: image.path,
            width: image.width,
            height: image.height,
          },
        ]
      }
      open({imageUris})
    } catch (err: unknown) {
      if (!String(err).toLowerCase().includes('cancel')) {
        ax.logger.error('Error opening camera', {error: err})
      }
    }
  }

  return {onPressGallery, onPressCamera}
}
