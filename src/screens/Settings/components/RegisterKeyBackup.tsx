import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import {ChangeEmailDialog} from '#/components/dialogs/ChangeEmailDialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import {KeyBackupDialog} from './KeyBackupDialog'
import * as SettingsList from './SettingsList'

export function RegisterKeyBackup() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const backupKeyDialogControl = useDialogControl()
  const verifyEmailDialogControl = useDialogControl()
  const changeEmailDialogControl = useDialogControl()
  const agent = useAgent()

  const onBackupComplete = React.useCallback(() => {
    // Optional: Handle any state updates after backup is complete
    console.log('Backup key created successfully')
  }, [])

  const onToggle = React.useCallback(() => {
    if (!currentAccount) {
      return
    }
    
    // Check if email is verified before allowing key backup
    if (!currentAccount.emailConfirmed) {
      verifyEmailDialogControl.open()
      return
    }
    
    // Open the backup key dialog
    backupKeyDialogControl.open()
  }, [
    currentAccount,
    backupKeyDialogControl,
    verifyEmailDialogControl,
  ])

  return (
    <>
      <KeyBackupDialog 
        control={backupKeyDialogControl} 
        onBackupComplete={onBackupComplete} 
      />
      <VerifyEmailDialog
        control={verifyEmailDialogControl}
        changeEmailControl={changeEmailDialogControl}
        onCloseAfterVerifying={backupKeyDialogControl.open}
        reasonText={_(
          msg`You need to verify your email address before you can create a backup key.`,
        )}
      />
      <ChangeEmailDialog
        control={changeEmailDialogControl}
        verifyEmailControl={verifyEmailDialogControl}
      />
      <SettingsList.BadgeButton
        label={_(msg`Create Backup Key`)}
        onPress={onToggle}
      />
    </>
  )
}