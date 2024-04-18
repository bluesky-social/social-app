import React, {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {GifSelectDialog} from '#/components/dialogs/GifSelect'
import {GifSquare_Stroke2_Corner0_Rounded as Gif} from '#/components/icons/Gif'

type Props = {
  onClose: () => void
  onSelectGif: (url: string) => void
  disabled?: boolean
}

export function SelectGifBtn({onClose, onSelectGif, disabled}: Props) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const control = useDialogControl()
  const t = useTheme()

  const onPressSelectGif = useCallback(async () => {
    track('Composer:GifSelectOpened')

    Keyboard.dismiss()
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
        color="primary"
        disabled={disabled}>
        <Gif size="lg" style={disabled && t.atoms.text_contrast_low} />
      </Button>

      <GifSelectDialog
        control={control}
        onClose={onClose}
        onSelectGif={onSelectGif}
      />
    </>
  )
}
