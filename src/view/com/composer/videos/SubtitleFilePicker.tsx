import React, {useRef} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CC_Stroke2_Corner0_Rounded as CCIcon} from '#/components/icons/CC'

export function SubtitleFilePicker({
  onSelectFile,
  disabled,
}: {
  onSelectFile: (file: File) => void
  disabled?: boolean
}) {
  const {_} = useLingui()
  const ref = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    ref.current?.click()
  }

  const handlePick = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = evt.target.files?.[0]
    if (selectedFile) {
      if (
        selectedFile.type === 'text/vtt' ||
        // HACK: sometimes the mime type is just straight-up missing
        // best we can do is check the file extension and hope for the best
        selectedFile.name.endsWith('.vtt')
      ) {
        onSelectFile(selectedFile)
      } else {
        logger.error('Invalid subtitle file type', {
          safeMessage: `File: ${selectedFile.name} (${selectedFile.type})`,
        })
        Toast.show(_(msg`Only WebVTT (.vtt) files are supported`))
      }
    }
  }

  return (
    <View style={a.gap_lg}>
      <input
        type="file"
        accept=".vtt"
        ref={ref}
        style={a.hidden}
        onChange={handlePick}
        disabled={disabled}
        aria-disabled={disabled}
      />
      <View style={a.flex_row}>
        <Button
          onPress={handleClick}
          label={_(msg`Select subtitle file (.vtt)`)}
          size="large"
          color="primary"
          variant="solid"
          disabled={disabled}>
          <ButtonIcon icon={CCIcon} />
          <ButtonText>
            <Trans>Select subtitle file (.vtt)</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
