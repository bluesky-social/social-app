import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import * as Prompt from '#/components/Prompt'
import {DisableEmail2FADialog} from './DisableEmail2FADialog'
import * as SettingsList from './SettingsList'

export function Email2FAToggle() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const disableDialogControl = useDialogControl()
  const enableDialogControl = useDialogControl()
  const verifyEmailDialogControl = useDialogControl()
  const agent = useAgent()

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
        verifyEmailDialogControl.open()
        return
      }
      enableDialogControl.open()
    }
  }, [
    currentAccount,
    enableDialogControl,
    verifyEmailDialogControl,
    disableDialogControl,
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
      <VerifyEmailDialog
        control={verifyEmailDialogControl}
        onCloseAfterVerifying={enableDialogControl.open}
        reasonText={_(
          msg`You'll need to verify your email address before enabling email 2FA.`,
        )}
      />
      <SettingsList.BadgeButton
        label={
          currentAccount?.emailAuthFactor ? _(msg`Change`) : _(msg`Enable`)
        }
        onPress={onToggle}
      />
    </>
  )
}
