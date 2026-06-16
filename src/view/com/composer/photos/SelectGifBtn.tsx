import {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {GifSquare_Stroke2_Corner0_Rounded as GifIcon} from '#/components/icons/Gif'
import {useAnalytics} from '#/analytics'
import {GifPickerDialog} from '#/features/gifPicker/GifPickerDialog'
import {type Gif} from '#/features/gifPicker/types'

type Props = {
  onClose?: () => void
  onSelectGif: (gif: Gif) => void
  disabled?: boolean
}

export function SelectGifBtn({onClose, onSelectGif, disabled}: Props) {
  const ax = useAnalytics()
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const t = useTheme()

  const onPressSelectGif = useCallback(() => {
    ax.metric('composer:gif:open', {})
    Keyboard.dismiss()
    control.open()
  }, [ax, control])

  return (
    <>
      <Button
        testID="openGifBtn"
        onPress={onPressSelectGif}
        label={_(
          msg({
            message: 'Select GIF',
            comment:
              'Accessibility label for the button in the post composer that opens the GIF picker dialog.',
          }),
        )}
        accessibilityHint={_(
          msg({
            message: 'Opens the GIF picker dialog',
            comment:
              'Accessibility hint announced after the GIF picker button label, describing what activating it will do.',
          }),
        )}
        style={a.p_sm}
        variant="ghost"
        shape="round"
        color="primary"
        disabled={disabled}>
        <GifIcon size="lg" style={disabled && t.atoms.text_contrast_low} />
      </Button>

      <GifPickerDialog
        control={control}
        onClose={onClose}
        onSelectGif={onSelectGif}
      />
    </>
  )
}
