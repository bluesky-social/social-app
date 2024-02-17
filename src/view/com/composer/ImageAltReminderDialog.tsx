import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {Button} from '#/components/Button'

export const ImageAltReminderDialog = React.memo(
  function ImageAltReminderDialog({
    control,
    onContinue,
  }: {
    control: Dialog.DialogOuterProps['control']
    onContinue: () => void
  }) {
    const {_} = useLingui()

    return (
      <Prompt.Outer control={control}>
        <Prompt.Title>Don't forget to make your image accessible.</Prompt.Title>
        <Prompt.Description>
          <Trans>
            Alt text describes images for blind and low-vision users, and helps
            give context to everyone. Good alt text are concise yet detailed,
            with text in the image being written out or summarized.
          </Trans>
        </Prompt.Description>
        <View style={[a.w_full, {flexDirection: 'row-reverse'}, a.gap_sm]}>
          <Button
            variant="solid"
            color="primary"
            size="small"
            onPress={() => control.close()}
            label={_(msg`Add description`)}>
            {_(msg`Add description`)}
          </Button>
          <Button
            variant="outline"
            color="primary"
            size="small"
            onPress={() => {
              control.close()
              onContinue()
            }}
            label={_(msg`Not this time`)}>
            {_(msg`Not this time`)}
          </Button>
        </View>
      </Prompt.Outer>
    )
  },
)
