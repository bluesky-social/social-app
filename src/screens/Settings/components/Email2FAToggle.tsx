import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModalControls} from '#/state/modals'
import {useAgent, useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {DisableEmail2FADialog} from './DisableEmail2FADialog'
import * as SettingsList from './SettingsList'

export function Email2FAToggle() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {openModal} = useModalControls()
  const disableDialogControl = useDialogControl()
  const enableDialogControl = useDialogControl()
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
        openModal({
          name: 'verify-email',
          onSuccess: enableDialogControl.open,
        })
        return
      }
      enableDialogControl.open()
    }
  }, [currentAccount, enableDialogControl, openModal, disableDialogControl])

  return (
    <>
      <DisableEmail2FADialog control={disableDialogControl} />
      <Prompt.Basic
        control={enableDialogControl}
        title={_(msg`Enable Email 2FA`)}
        description={_(msg`Require an email code to log in to your account.`)}
        onConfirm={enableEmailAuthFactor}
        confirmButtonCta={_(msg`Enable`)}
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
