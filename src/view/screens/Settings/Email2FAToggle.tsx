import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModalControls} from '#/state/modals'
import {useAgent, useSession, useSessionApi} from '#/state/session'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {useDialogControl} from '#/components/Dialog'
import {DisableEmail2FADialog} from './DisableEmail2FADialog'

export function Email2FAToggle() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {updateCurrentAccount} = useSessionApi()
  const {openModal} = useModalControls()
  const disableDialogCtrl = useDialogControl()
  const {getAgent} = useAgent()

  const enableEmailAuthFactor = React.useCallback(async () => {
    if (currentAccount?.email) {
      await getAgent().com.atproto.server.updateEmail({
        email: currentAccount.email,
        emailAuthFactor: true,
      })
      updateCurrentAccount({
        emailAuthFactor: true,
      })
    }
  }, [currentAccount, updateCurrentAccount, getAgent])

  const onToggle = React.useCallback(() => {
    if (!currentAccount) {
      return
    }
    if (currentAccount.emailAuthFactor) {
      disableDialogCtrl.open()
    } else {
      if (!currentAccount.emailConfirmed) {
        openModal({
          name: 'verify-email',
          onSuccess: enableEmailAuthFactor,
        })
        return
      }
      enableEmailAuthFactor()
    }
  }, [currentAccount, enableEmailAuthFactor, openModal, disableDialogCtrl])

  return (
    <>
      <DisableEmail2FADialog control={disableDialogCtrl} />
      <ToggleButton
        type="default-light"
        label={_(msg`Require email code to log into your account`)}
        labelType="lg"
        isSelected={!!currentAccount?.emailAuthFactor}
        onPress={onToggle}
      />
    </>
  )
}
