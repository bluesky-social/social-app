import {useState} from 'react'
import {Trans} from '@lingui/macro'

import {useSession} from '#/state/session'
import {useIsEmailVerified} from '#/components/dialogs/EmailDialog/data/useIsEmailVerified'
import {Disable} from '#/components/dialogs/EmailDialog/screens/Manage2FA/Disable'
/**
 * Sub-screens
 */
import {Enable} from '#/components/dialogs/EmailDialog/screens/Manage2FA/Enable'
import {type Screen, ScreenID} from '#/components/dialogs/EmailDialog/types'

export function Manage2FA({
  showScreen,
}: {
  config: Extract<Screen, {id: 'Manage2FA'}>
  showScreen: (screen: Screen) => void
}) {
  const [requestedAction, setRequestedAction] = useState<
    'enable' | 'disable' | null
  >(null)
  // TODO confirm this is in sync
  const {currentAccount} = useSession()
  const {isEmailVerified} = useIsEmailVerified()

  if (!isEmailVerified) {
    showScreen({
      id: ScreenID.Verify,
      instructions: [
        <Trans key="2fa">
          You need to verify your email address before you can enable email 2FA.
        </Trans>,
      ],
      onVerify: () => {
        showScreen({
          id: ScreenID.Manage2FA,
        })
      },
    })
    return null
  }

  if (currentAccount?.emailAuthFactor && requestedAction !== 'enable') {
    if (!requestedAction) {
      setRequestedAction('disable')
    }
    return <Disable />
  } else if (
    !currentAccount?.emailAuthFactor &&
    requestedAction !== 'disable'
  ) {
    if (!requestedAction) {
      setRequestedAction('enable')
    }

    return <Enable />
  }

  return null
}
