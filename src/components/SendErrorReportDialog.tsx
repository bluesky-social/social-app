import {useState} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/logger'
import {sendErrorReport} from '#/logger/reporting/sendErrorReport'
import {useSession} from '#/state/session'
import {atoms as a, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function SendErrorReportDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <SendErrorReportDialogInner />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function SendErrorReportDialogInner() {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const {currentAccount} = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const {mutate: onSubmit, isPending} = useMutation({
    mutationFn: async () => {
      sendErrorReport({
        title,
        description,
        handle: currentAccount?.handle ?? '',
      })
    },
    onSuccess: () => {
      control.close(() => {
        Toast.show(l`Report sent`)
      })
    },
    onError: error => {
      logger.error('Error sending user report', {safeMessage: error})
      Toast.show(l`Failed to send report`, {type: 'error'})
    },
  })

  const canSubmit = title.trim().length > 0 && !isPending

  return (
    <Dialog.ScrollableInner
      label={l`Send error report`}
      style={web({maxWidth: 420})}>
      <View style={[a.gap_lg]}>
        <Text style={[a.text_2xl, a.font_semi_bold]}>
          {l`Send error report`}
        </Text>
        <View style={[a.gap_md]}>
          <View>
            <TextField.LabelText>{l`Title`}</TextField.LabelText>
            <TextField.Root>
              <TextField.Input
                label={l`Title (100 characters max)`}
                value={title}
                onChangeText={value => setTitle(value.slice(0, 100))}
              />
            </TextField.Root>
          </View>
          <View>
            <TextField.LabelText>{l`Description`}</TextField.LabelText>
            <TextField.Input
              multiline
              numberOfLines={8}
              label={l`Description (1000 characters max)`}
              value={description}
              onChangeText={value => setDescription(value.slice(0, 1000))}
            />
          </View>
        </View>
        <View style={[a.gap_sm]}>
          <Button
            label={l`Submit`}
            size="large"
            color="primary"
            disabled={!canSubmit}
            onPress={() => onSubmit()}>
            <ButtonText>{l`Submit`}</ButtonText>
          </Button>
          <Button
            label={l`Cancel`}
            size="large"
            color="secondary"
            onPress={() => control.close()}>
            <ButtonText>{l`Cancel`}</ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
