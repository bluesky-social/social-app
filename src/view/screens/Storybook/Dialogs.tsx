import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {H3, P} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {useDialogStateControlContext} from '#/state/dialogs'

export function Dialogs() {
  const control = Dialog.useDialogControl()
  const prompt = Prompt.usePromptControl()
  const {closeAllDialogs} = useDialogStateControlContext()

  return (
    <View style={[a.gap_md]}>
      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          control.open()
          prompt.open()
        }}
        label="Open basic dialog">
        Open basic dialog
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={() => prompt.open()}
        label="Open prompt">
        Open prompt
      </Button>

      <Prompt.Outer control={prompt}>
        <Prompt.Title>This is a prompt</Prompt.Title>
        <Prompt.Description>
          This is a generic prompt component. It accepts a title and a
          description, as well as two actions.
        </Prompt.Description>
        <Prompt.Actions>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action>Confirm</Prompt.Action>
        </Prompt.Actions>
      </Prompt.Outer>

      <Dialog.Outer
        control={control}
        nativeOptions={{sheet: {snapPoints: ['90%']}}}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          accessibilityDescribedBy="dialog-description"
          accessibilityLabelledBy="dialog-title">
          <View style={[a.relative, a.gap_md, a.w_full]}>
            <H3 nativeID="dialog-title">Dialog</H3>
            <P nativeID="dialog-description">
              A scrollable dialog with an input within it.
            </P>
            <Dialog.Input value="" onChangeText={() => {}} label="Type here" />

            <Button
              variant="outline"
              color="secondary"
              size="small"
              onPress={closeAllDialogs}
              label="Close all dialogs">
              Close all dialogs
            </Button>
            <View style={{height: 1000}} />
            <View style={[a.flex_row, a.justify_end]}>
              <Button
                variant="outline"
                color="primary"
                size="small"
                onPress={() => control.close()}
                label="Open basic dialog">
                Close basic dialog
              </Button>
            </View>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </View>
  )
}
