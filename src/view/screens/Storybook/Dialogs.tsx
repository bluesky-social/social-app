import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {H3, P} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'

export function Dialogs() {
  const control = Dialog.useDialogControl()
  const prompt = Prompt.usePromptControl()

  return (
    <>
      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => control.open()}
        accessibilityLabel="Open basic dialog"
        accessibilityHint="Open basic dialog">
        Open basic dialog
      </Button>

      <Button
        variant="solid"
        color="primary"
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

      <Dialog.Outer
        control={control}
        nativeOptions={{sheet: {snapPoints: ['90%']}}}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          accessibilityLabelledBy="dialog-title"
          accessibilityDescribedBy="dialog-description">
          <View style={[a.relative, a.gap_md, a.w_full]}>
            <H3 nativeID="dialog-title">Dialog</H3>
            <P nativeID="dialog-description">Description</P>
            <Dialog.InputText
              testID=""
              value=""
              onChange={() => {}}
              placeholder="Type here"
              accessibilityLabel="Type"
              accessibilityHint="Type"
            />
            <View style={{height: 1000}} />
            <View style={[a.flex_row, a.justify_end]}>
              <Button
                variant="outline"
                color="primary"
                size="small"
                onPress={() => control.close()}
                accessibilityLabel="Open basic dialog"
                accessibilityHint="Open basic dialog">
                Close basic dialog
              </Button>
            </View>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
