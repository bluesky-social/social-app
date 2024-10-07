import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {FormContainer} from './FormContainer'

export const ChooseAccountForm = ({
  onSelectAccount,
  onPressBack,
}: {
  onSelectAccount: (account?: SessionAccount) => void
  onPressBack: () => void
}) => {
  const [pendingDid, setPendingDid] = React.useState<string | null>(null)
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onSelect = React.useCallback(
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
        await resumeSession(account)
        logEvent('account:loggedIn', {
          logContext: 'ChooseAccountForm',
          withPassword: false,
        })
        Toast.show(_(msg`Signed in as @${account.handle}`))
      } catch (e: any) {
        logger.error('choose account: initSession failed', {
          message: e.message,
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
    ],
  )

  return (
    <FormContainer
      testID="chooseAccountForm"
      titleText={<Trans>Select account</Trans>}>
      <View>
        <TextField.LabelText>
          <Trans>Sign in as...</Trans>
        </TextField.LabelText>
        <AccountList
          onSelectAccount={onSelect}
          onSelectOther={() => onSelectAccount()}
          pendingDid={pendingDid}
        />
      </View>
      <View style={[a.flex_row]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onPressBack}>
          <ButtonText>{_(msg`Back`)}</ButtonText>
        </Button>
        <View style={[a.flex_1]} />
      </View>
    </FormContainer>
  )
}
