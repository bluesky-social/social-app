import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ComAtprotoLabelDefs} from '@atproto/api'

import {atoms as a, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {GlobalDialogProps} from '#/components/dialogs'
import {Button} from '#/components/Button'

type Subject =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export interface LabelsOnMeDialogProps {
  subject: Subject
  labels: ComAtprotoLabelDefs.Label[]
}

export function LabelsOnMeDialog({
  params,
  cleanup,
}: GlobalDialogProps<LabelsOnMeDialogProps>) {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const {gtMobile} = useBreakpoints()
  const {subject, labels} = params
  const isAccount = 'did' in subject

  // REQUIRED CLEANUP
  const onClose = React.useCallback(() => cleanup(), [cleanup])

  // TODO
  // const submit = async () => {
  //   try {
  //     const $type = !isAccountReport
  //       ? 'com.atproto.repo.strongRef'
  //       : 'com.atproto.admin.defs#repoRef'
  //     await getAgent().createModerationReport({
  //       reasonType: ComAtprotoModerationDefs.REASONAPPEAL,
  //       subject: {
  //         $type,
  //         ...props,
  //       },
  //       reason: details,
  //     })
  //     Toast.show(_(msg`We'll look into your appeal promptly.`))
  //   } finally {
  //     closeModal()
  //   }
  // }

  return (
    <Dialog.Outer defaultOpen control={control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
          <Trans>Labels on my {isAccount ? 'account' : 'content'}</Trans>
        </Text>
        <Text nativeID="dialog-description" style={[a.text_sm]}>
          <Trans>
            You may appeal these labels if you feel they were placed in error.
          </Trans>
        </Text>
        {labels.map(label => (
          <Text key={`${label.src}-${label.val}`}>{label.val} TODO</Text>
        ))}
        <View style={gtMobile && [a.flex_row, a.justify_end]}>
          <Button
            testID="doneBtn"
            variant="outline"
            color="primary"
            size="small"
            onPress={() => control.close()}
            label={_(msg`Done`)}>
            {_(msg`Done`)}
          </Button>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
