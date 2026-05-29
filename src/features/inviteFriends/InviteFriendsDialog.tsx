import * as Dialog from '#/components/Dialog'
import {InviteFriendsDialogInner} from './InviteFriendsDialogInner'

export function InviteFriendsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <InviteFriendsDialogInner control={control} />
    </Dialog.Outer>
  )
}
