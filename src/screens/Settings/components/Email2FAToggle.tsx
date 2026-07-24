import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

import {useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {DisableEmail2FADialog} from './DisableEmail2FADialog'
import * as SettingsList from './SettingsList'

export function Email2FAToggle() {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const disableDialogControl = useDialogControl()
  const emailDialogControl = useEmailDialogControl()

  const onToggle = useCallback(() => {
    emailDialogControl.open({
      id: EmailDialogScreenID.Manage2FA,
    })
  }, [emailDialogControl])

  return (
    <>
      <DisableEmail2FADialog control={disableDialogControl} />
      <SettingsList.BadgeButton
        label={currentAccount?.emailAuthFactor ? l`Change` : l`Enable`}
        onPress={onToggle}
      />
    </>
  )
}
