/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */

import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePhotoLibraryPermission} from '#/lib/hooks/usePermissions'
import {openPicker} from '#/lib/media/picker'
import {isNative} from '#/platform/detection'
import {ComposerImage, createComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'
import {MAX_IMAGES} from '../state'

export const SelectPhotoBtn = ({
  disabled,
  size,
  onAdd,
}: {
  size: number
  disabled?: boolean
  onAdd: (next: ComposerImage[]) => void
}) => {
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const t = useTheme()

  const onPressSelectPhotos = React.useCallback(async () => {
    if (isNative && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    const images = await openPicker({
      selectionLimit: MAX_IMAGES - size,
      allowsMultipleSelection: true,
    })

    const results = await Promise.all(
      images.map(img => createComposerImage(img)),
    )

    onAdd(results)
  }, [requestPhotoAccessIfNeeded, size, onAdd])

  return (
    <Button
      testID="openGalleryBtn"
      label={_(msg`Gallery`)}
      accessibilityHint={_(msg`Opens device photo gallery`)}
      style={a.p_sm}
      variant="ghost"
      shape="round"
      color="primary"
      disabled={disabled}
      onPress={onPressSelectPhotos}>
      <Image size="lg" style={disabled && t.atoms.text_contrast_low} />
    </Button>
  )
}
