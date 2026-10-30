import {Trans} from '@lingui/react/macro'

import type * as Dialog from '#/components/Dialog'
import {NotificationSettingsDialog} from '#/components/dialogs/NotificationSettingsDialog'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'

export function ChatNotificationDialogs({
  chatControl,
  chatRequestControl,
}: {
  chatControl: Dialog.DialogControlProps
  chatRequestControl: Dialog.DialogControlProps
}) {
  return (
    <>
      <NotificationSettingsDialog
        control={chatControl}
        name="chat"
        icon={MessageIcon}
        titleText={<Trans>New messages</Trans>}
        subtitleText={
          <Trans>Get notifications when people send you messages.</Trans>
        }
        allowDisableInApp={false}
      />
      <NotificationSettingsDialog
        control={chatRequestControl}
        name="chatRequest"
        icon={EnvelopeIcon}
        titleText={<Trans>New message requests</Trans>}
        subtitleText={
          <Trans>
            Get notifications when people send you message requests.
          </Trans>
        }
        allowDisableInApp={false}
      />
    </>
  )
}
