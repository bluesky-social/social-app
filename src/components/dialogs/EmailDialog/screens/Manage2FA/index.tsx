import {useEffect, useState} from 'react'
import {Trans} from '@lingui/macro'

import {useAccountEmailState} from '#/components/dialogs/EmailDialog/data/useAccountEmailState'
import {Disable} from '#/components/dialogs/EmailDialog/screens/Manage2FA/Disable'
import {Enable} from '#/components/dialogs/EmailDialog/screens/Manage2FA/Enable'
import {
  ScreenID,
  type ScreenProps,
} from '#/components/dialogs/EmailDialog/types'

export function Manage2FA({showScreen}: ScreenProps<ScreenID.Manage2FA>) {
  const {isEmailVerified, email2FAEnabled} = useAccountEmailState()
  const [requestedAction, setRequestedAction] = useState<
    'enable' | 'disable' | null
  >(null)

  useEffect(() => {
    if (!isEmailVerified) {
      showScreen({
        id: ScreenID.Verify,
        instructions: [
          <Trans key="2fa">
            You need to verify your email address before you can enable email
            2FA.
          </Trans>,
        ],
        onVerify: () => {
          showScreen({
            id: ScreenID.Manage2FA,
          })
        },
      })
    }
  }, [isEmailVerified, showScreen])

  /*
   * Wacky state handling so that once 2FA settings change, we don't show the
   * wrong step of this form - esb
   */

  if (email2FAEnabled) {
    if (!requestedAction) {
      setRequestedAction('disable')
      return <Disable />
    }

    if (requestedAction === 'disable') {
      return <Disable />
    }
    if (requestedAction === 'enable') {
      return <Enable />
    }
  } else {
    if (!requestedAction) {
      setRequestedAction('enable')
      return <Enable />
    }

    if (requestedAction === 'disable') {
      return <Disable />
    }
    if (requestedAction === 'enable') {
      return <Enable />
    }
  }

  // should never happen
  return null
}
