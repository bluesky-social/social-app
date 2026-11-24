import {Admonitions} from '#/view/screens/Storybook/Admonitions'
import {Dialogs} from '#/view/screens/Storybook/Dialogs'
import {Menus} from '#/view/screens/Storybook/Menus'
import {NewPostsPill} from '#/view/screens/Storybook/NewPostsPill'
import {Toasts} from '#/view/screens/Storybook/Toasts'
import {Tooltips} from '#/view/screens/Storybook/Tooltips'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InviteFriendsDialog} from '#/features/inviteFriends'

export default function OverlaysFeedbackPage() {
  const inviteFriendsControl = Dialog.useDialogControl()

  return (
    <>
      <NewPostsPill />
      <Toasts />
      <Tooltips />
      <Dialogs />
      <Menus />
      <Admonitions />
      <Button
        color="primary"
        size="large"
        onPress={() => inviteFriendsControl.open()}
        label="Open invite friends sheet (APP-2142)">
        <ButtonText>Open invite friends sheet (APP-2142)</ButtonText>
      </Button>
      <InviteFriendsDialog control={inviteFriendsControl} />
    </>
  )
}
