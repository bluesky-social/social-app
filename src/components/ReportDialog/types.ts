import * as Dialog from '#/components/Dialog'

export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control']
  params:
    | {
        type: 'post' | 'list' | 'feedgen' | 'starterpack' | 'other'
        uri: string
        cid: string
      }
    | {
        type: 'account'
        did: string
      }
    | {type: 'convoMessage'}
}
