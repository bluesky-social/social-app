import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Button} from '#/view/com/Button'
import {H3, P} from '#/view/com/Typography'
import * as Dialog from '#/view/com/Dialog'
import * as Prompt from '#/view/com/Prompt'

export function Dialogs() {
  const control = Dialog.useDialogControl()
  const prompt = Prompt.usePromptControl()

  return (
    <>
      <Button
        type="secondary"
        size="small"
        onPress={() => control.open()}
        accessibilityLabel="Open basic dialog"
        accessibilityHint="Open basic dialog">
        Open basic dialog
      </Button>

      <Button
        type="negative"
        size="small"
        onPress={() => prompt.open()}
        accessibilityLabel="Open prompt"
        accessibilityHint="Open prompt">
        Open prompt
      </Button>

      <Prompt.Outer control={prompt}>
        <Prompt.Title>Are you sure?</Prompt.Title>
        <Prompt.Description>
          This action cannot be undone. This action cannot be undone. This
          action cannot be undone.
        </Prompt.Description>
        <Prompt.Actions>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action>Confirm</Prompt.Action>
        </Prompt.Actions>
      </Prompt.Outer>

      <Dialog.Outer control={control}>
        <Dialog.Inner
          accessibilityLabelledBy="dialog-title"
          accessibilityDescribedBy="dialog-description">
          <Dialog.Handle />
          <View style={[a.gap_md]}>
            <H3 nativeID="dialog-title">Dialog</H3>
            <P nativeID="dialog-description">Description</P>
            <View style={[a.flex_row, a.justify_end]}>
              <Button
                type="primary"
                size="small"
                onPress={() => control.close()}
                accessibilityLabel="Open basic dialog"
                accessibilityHint="Open basic dialog">
                Close basic dialog
              </Button>
            </View>
          </View>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
