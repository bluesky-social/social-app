import {type ReactNode} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {shareImageModal} from '#/lib/media/manip'
import {useSaveImageToMediaLibrary} from '#/lib/media/save-image'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {IS_IOS} from '#/env'
import * as ContextMenu from '../../../../modules/expo-bluesky-context-menu'

/**
 * Wraps an image embed with the iOS peek-and-menu interaction. On non-iOS
 * platforms this renders children unchanged.
 *
 * The aspect ratio is consumed by the native side to size the preview
 * viewController correctly — which is what makes the lift animation clean
 * for portrait/panorama images.
 */
export function ImageContextMenu({
  fullsizeUri,
  aspectRatio,
  borderRadius,
  onPreviewPress,
  children,
}: {
  fullsizeUri: string
  /** width / height; defaults to 1 if missing. */
  aspectRatio: number | undefined
  borderRadius?: number
  onPreviewPress?: () => void
  children: ReactNode
}) {
  const {_} = useLingui()
  const saveImage = useSaveImageToMediaLibrary()

  if (!IS_IOS) {
    return children
  }

  const handleSave = () => {
    void saveImage(fullsizeUri)
  }
  const handleShare = () => {
    void shareImageModal({uri: fullsizeUri})
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        preview={{
          type: 'image',
          uri: fullsizeUri,
          aspectRatio: aspectRatio && aspectRatio > 0 ? aspectRatio : 1,
        }}
        borderRadius={borderRadius}
        onPreviewPress={onPreviewPress}>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Menu>
        <ContextMenu.MenuItem id="save" onSelect={handleSave}>
          <ContextMenu.MenuItemIcon icon={DownloadIcon} />
          <ContextMenu.MenuItemText>
            {_(msg`Save image`)}
          </ContextMenu.MenuItemText>
        </ContextMenu.MenuItem>
        <ContextMenu.MenuItem id="share" onSelect={handleShare}>
          <ContextMenu.MenuItemIcon icon={ShareIcon} />
          <ContextMenu.MenuItemText>{_(msg`Share`)}</ContextMenu.MenuItemText>
        </ContextMenu.MenuItem>
      </ContextMenu.Menu>
    </ContextMenu.Root>
  )
}
