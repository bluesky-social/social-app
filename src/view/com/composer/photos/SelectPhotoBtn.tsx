/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */
import React, {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {usePhotoLibraryPermission} from '#/lib/hooks/usePermissions'
import {openPicker} from '#/lib/media/picker'
import {isNative} from '#/platform/detection'
import {ComposerImage, createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'

type Props = {
  size: number
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
}

export function SelectPhotoBtn({size, disabled, onAdd}: Props) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const t = useTheme()

  const onPressSelectPhotos = useCallback(async () => {
    track('Composer:GalleryOpened')

    if (isNative && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    const images = await openPicker({
      selectionLimit: 4 - size,
      allowsMultipleSelection: true,
    })

    const results = await Promise.all(
      images.map(img => createComposerImage(img)),
    )

    onAdd(results)
  }, [track, requestPhotoAccessIfNeeded, size, onAdd])

  return (
    <Button
      testID="openGalleryBtn"
      onPress={onPressSelectPhotos}
      label={_(msg`Gallery`)}
      accessibilityHint={_(msg`Opens device photo gallery`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}>
      <Image size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
