import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, web} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {FormContainer} from './FormContainer'

export const ChooseAccountForm = ({
  onSelectAccount,
  onPressBack,
}: {
  onSelectAccount: (account?: SessionAccount) => void
  onPressBack: () => void
}) => {
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {_} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onSelect = useCallback(
    async (account: SessionAccount) => {
      if (pendingDid) {
        // The session API isn't resilient to race conditions so let's just ignore this.
        return
      }
      if (!account.accessJwt) {
        // Move to login form.
        onSelectAccount(account)
        return
      }
      if (account.did === currentAccount?.did) {
        setShowLoggedOut(false)
        Toast.show(_(msg`Already signed in as @${account.handle}`))
        return
      }
      try {
        setPendingDid(account.did)
        await resumeSession(account, true)
        ax.metric('account:loggedIn', {
          logContext: 'ChooseAccountForm',
          withPassword: false,
        })
        Toast.show(_(msg`Signed in as @${account.handle}`))
      } catch (e: any) {
        logger.error('choose account: initSession failed', {
          message: e instanceof Error ? e.message : 'Unknown error',
        })
        // Move to login form.
        onSelectAccount(account)
      } finally {
        setPendingDid(null)
      }
    },
    [
      currentAccount,
      resumeSession,
      pendingDid,
      onSelectAccount,
      setShowLoggedOut,
      _,
      ax,
    ],
  )

  return (
    <FormContainer
      testID="chooseAccountForm"
      titleText={<Trans>Select account</Trans>}
      style={web([a.py_2xl])}>
      <View>
        {IS_WEB && (
          <TextField.LabelText>
            <Trans>Sign in as...</Trans>
          </TextField.LabelText>
        )}
        <AccountList
          onSelectAccount={onSelect}
          onSelectOther={() => onSelectAccount()}
          pendingDid={pendingDid}
        />
      </View>
      {IS_WEB && (
        <View style={[a.flex_row]}>
          <Button
            label={_(msg`Back`)}
            color="secondary"
            size="large"
            onPress={onPressBack}>
            <ButtonText>{_(msg`Back`)}</ButtonText>
          </Button>
          <View style={[a.flex_1]} />
        </View>
      )}
    </FormContainer>
  )
}
