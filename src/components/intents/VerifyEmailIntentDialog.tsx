import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from 'state/session'
import * as Dialog from '#/components/Dialog'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'

export function VerifyEmailIntentDialog() {
  const {verifyEmailDialogControl: control} = useIntentDialogs()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner />
    </Dialog.Outer>
  )
}

function Inner() {
  const {_} = useLingui()
  const {verifyEmailState: state} = useIntentDialogs()
  const [_status, setStatus] = React.useState<'success' | 'failure'>()
  const agent = useAgent()
  const {currentAccount} = useSession()

  React.useEffect(() => {
    ;(async () => {
      if (!state?.code) {
        setStatus('failure')
        return
      }
      try {
        await agent.com.atproto.server.confirmEmail({
          email: (currentAccount?.email || '').trim(),
          token: state.code.trim(),
        })
        setStatus('success')
      } catch (e) {
        setStatus('failure')
      }
    })()
  }, [agent.com.atproto.server, currentAccount?.email, state?.code])

  return <Dialog.ScrollableInner label={_(msg`Verify email dialog`)} />
}
