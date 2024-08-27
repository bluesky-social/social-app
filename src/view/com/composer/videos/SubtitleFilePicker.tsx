import React, {useId} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CC_Stroke2_Corner0_Rounded as CCIcon} from '#/components/icons/CC'
import {Loader} from '#/components/Loader'

export function SubtitleFilePicker({
  onSelectFile,
  pending,
}: {
  onSelectFile: (file: File) => void
  pending: boolean
}) {
  const {_} = useLingui()
  const id = useId()

  const handlePick = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0]
    if (file) {
      if (file.type === 'text/vtt') {
        onSelectFile(file)
      } else {
        Toast.show(_(msg`Only WebVTT (.vtt) files are supported`))
      }
    }
  }

  return (
    <View>
      <input style={a.hidden} id={id} onChange={handlePick} />
      <label htmlFor={id}>
        <Button
          label={_('Select subtitle file (.vtt)')}
          size="medium"
          color="primary"
          variant="solid"
          disabled={pending}>
          <ButtonIcon icon={CCIcon} />
          <ButtonText>
            <Trans>Upload subtitle file (.vtt)</Trans>
          </ButtonText>
          {pending && <Loader />}
        </Button>
      </label>
    </View>
  )
}
