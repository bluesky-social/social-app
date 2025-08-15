import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {DisableEmail2FADialog} from './DisableEmail2FADialog'
import * as SettingsList from './SettingsList'

export function Email2FAToggle() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const disableDialogControl = useDialogControl()
  const emailDialogControl = useEmailDialogControl()

  const onToggle = React.useCallback(() => {
    emailDialogControl.open({
      id: EmailDialogScreenID.Manage2FA,
    })
  }, [emailDialogControl])

  return (
    <>
      <DisableEmail2FADialog control={disableDialogControl} />
      <SettingsList.BadgeButton
        label={
          currentAccount?.emailAuthFactor ? _(msg`Change`) : _(msg`Enable`)
        }
        onPress={onToggle}
      />
    </>
  )
}
