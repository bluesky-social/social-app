/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */
import React, {useCallback} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {GalleryModel} from '#/state/models/media/gallery'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {GifSelectDialog} from '#/components/dialogs/GifSelect'
import {Image_Stroke2_Corner0_Rounded as Image} from '#/components/icons/Image'

type Props = {
  gallery: GalleryModel
}

export function SelectGifBtn({}: Props) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const control = useDialogControl()

  const onPressSelectGif = useCallback(async () => {
    track('Composer:GifSelectOpened')

    control.open()
  }, [track, control])

  return (
    <>
      <Button
        testID="openGifBtn"
        onPress={onPressSelectGif}
        label={_(msg`Select GIF`)}
        accessibilityHint={_(msg`Opens GIF select dialog`)}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary">
        <Image size="lg" />
      </Button>

      <GifSelectDialog control={control} />
    </>
  )
}
