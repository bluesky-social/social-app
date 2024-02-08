import React from 'react'
import {View} from 'react-native'

import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {GlobalDialogProps} from '#/components/dialogs'

export type ReportDialogProps =
  | {
      type: 'post'
      uri: string
      cid: string
    }
  | {
      type: 'user'
      did: string
    }

export function ReportDialog(props: GlobalDialogProps<ReportDialogProps>) {
  const control = Dialog.useDialogControl()

  const onClose = React.useCallback(() => {
    props.cleanup()
  }, [props])

  return (
    <Dialog.Outer defaultOpen control={control} onClose={onClose}>
      <Dialog.Inner label="Report Dialog">
        <View style={{height: 500}}>
          <Text>hello {JSON.stringify(props)}</Text>
        </View>
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
