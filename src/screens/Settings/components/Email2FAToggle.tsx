import React from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import {
  EmailDialog,
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import * as Prompt from '#/components/Prompt'
import {DisableEmail2FADialog} from './DisableEmail2FADialog'
import * as SettingsList from './SettingsList'

export function Email2FAToggle() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const disableDialogControl = useDialogControl()
  const enableDialogControl = useDialogControl()
  const agent = useAgent()
  const emailDialogControl = useEmailDialogControl()

  const enableEmailAuthFactor = React.useCallback(async () => {
    if (currentAccount?.email) {
      await agent.com.atproto.server.updateEmail({
        email: currentAccount.email,
        emailAuthFactor: true,
      })
      await agent.resumeSession(agent.session!)
    }
  }, [currentAccount, agent])

  const onToggle = React.useCallback(() => {
    if (!currentAccount) {
      return
    }
    if (currentAccount.emailAuthFactor) {
      disableDialogControl.open()
    } else {
      if (!currentAccount.emailConfirmed) {
        emailDialogControl.open({
          id: EmailDialogScreenID.Verify,
          hideInitialCodeButton: true,
          instructions: [
            <Trans key="2fa">
              You need to verify your email address before you can enable email
              2FA.
            </Trans>,
          ],
        })
        return
      }
      enableDialogControl.open()
    }
  }, [
    currentAccount,
    enableDialogControl,
    disableDialogControl,
    emailDialogControl,
  ])

  return (
    <>
      <DisableEmail2FADialog control={disableDialogControl} />
      <Prompt.Basic
        control={enableDialogControl}
        title={_(msg`Enable Email 2FA`)}
        description={_(msg`Require an email code to sign in to your account.`)}
        onConfirm={enableEmailAuthFactor}
        confirmButtonCta={_(msg`Enable`)}
      />
      <EmailDialog control={emailDialogControl} />
      <SettingsList.BadgeButton
        label={
          currentAccount?.emailAuthFactor ? _(msg`Change`) : _(msg`Enable`)
        }
        onPress={onToggle}
      />
    </>
  )
}
