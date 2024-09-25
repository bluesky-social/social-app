/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */
import React, {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {usePhotoLibraryPermission} from '#/lib/hooks/usePermissions'
import {isNative} from '#/platform/detection'
import {GalleryModel} from '#/state/models/media/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'

type Props = {
  gallery: GalleryModel
  disabled?: boolean
}

export function SelectPhotoBtn({gallery, disabled}: Props) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const t = useTheme()

  const onPressSelectPhotos = useCallback(async () => {
    track('Composer:GalleryOpened')

    if (isNative && !(await requestPhotoAccessIfNeeded())) {
      return
    }

    gallery.pick()
  }, [track, requestPhotoAccessIfNeeded, gallery])

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
