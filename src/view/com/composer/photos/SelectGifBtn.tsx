import {useCallback, useRef} from 'react'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {type Gif} from '#/state/queries/tenor'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {GifSelectDialog} from '#/components/dialogs/GifSelect'
import {GifSquare_Stroke2_Corner0_Rounded as GifIcon} from '#/components/icons/Gif'
import {useAnalytics} from '#/analytics'

type Props = {
  onClose?: () => void
  onSelectGif: (gif: Gif) => void
  disabled?: boolean
}

export function SelectGifBtn({onClose, onSelectGif, disabled}: Props) {
  const ax = useAnalytics()
  const {_} = useLingui()
  const ref = useRef<{open: () => void}>(null)
  const t = useTheme()

  const onPressSelectGif = useCallback(async () => {
    ax.metric('composer:gif:open', {})
    Keyboard.dismiss()
    ref.current?.open()
  }, [ax])

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
        <GifIcon size="lg" style={disabled && t.atoms.text_contrast_low} />
      </Button>

      <GifSelectDialog
        controlRef={ref}
        onClose={onClose}
        onSelectGif={onSelectGif}
      />
    </>
  )
}
