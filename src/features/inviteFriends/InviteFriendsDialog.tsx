import * as Dialog from '#/components/Dialog'
import {InviteFriendsDialogInner} from './InviteFriendsDialogInner'

export function InviteFriendsDialog({
  control,
  onClose,
}: {
  control: Dialog.DialogControlProps
  onClose?: () => void
}) {
  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <InviteFriendsDialogInner control={control} />
    </Dialog.Outer>
  )
}
