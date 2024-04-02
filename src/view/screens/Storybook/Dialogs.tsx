import React from 'react'
import {View} from 'react-native'

import {useDialogStateControlContext} from '#/state/dialogs'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {H3, P} from '#/components/Typography'

export function Dialogs() {
  const scrollable = Dialog.useDialogControl()
  const basic = Dialog.useDialogControl()
  const prompt = Prompt.usePromptControl()
  const {closeAllDialogs} = useDialogStateControlContext()

  return (
    <View style={[a.gap_md]}>
      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          scrollable.open()
          prompt.open()
          basic.open()
        }}
        label="Open basic dialog">
        Open all dialogs
      </Button>

      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          scrollable.open()
        }}
        label="Open basic dialog">
        Open scrollable dialog
      </Button>

      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          basic.open()
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
          <Prompt.Action onPress={() => {}}>Confirm</Prompt.Action>
        </Prompt.Actions>
      </Prompt.Outer>

      <Dialog.Outer control={basic}>
        <Dialog.Handle />

        <Dialog.Inner label="test">
          <H3 nativeID="dialog-title">Dialog</H3>
          <P nativeID="dialog-description">A basic dialog</P>
        </Dialog.Inner>
      </Dialog.Outer>

      <Dialog.Outer
        control={scrollable}
        nativeOptions={{sheet: {snapPoints: ['100%']}}}>
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
                onPress={() =>
                  scrollable.close(() => {
                    console.log('CLOSED')
                  })
                }
                label="Open basic dialog">
                Close dialog
              </Button>
            </View>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </View>
  )
}
