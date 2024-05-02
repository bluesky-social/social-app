import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
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
  const {track, screen} = useAnalytics()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {initSession} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  React.useEffect(() => {
    screen('Choose Account')
  }, [screen])

  const onSelect = React.useCallback(
    async (account: SessionAccount) => {
      if (account.accessJwt) {
        if (account.did === currentAccount?.did) {
          setShowLoggedOut(false)
          Toast.show(_(msg`Already signed in as @${account.handle}`))
        } else {
          try {
            await initSession(account)
            logEvent('account:loggedIn', {
              logContext: 'ChooseAccountForm',
              withPassword: false,
            })
            track('Sign In', {resumedSession: true})
            setTimeout(() => {
              Toast.show(_(msg`Signed in as @${account.handle}`))
            }, 100)
          } catch (e: any) {
            logger.error('choose account: initSession failed', {
              message: e.message,
            })
            onSelectAccount(account)
          }
        }
      } else {
        onSelectAccount(account)
      }
    },
    [currentAccount, track, initSession, onSelectAccount, setShowLoggedOut, _],
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
        />
      </View>
      <View style={[a.flex_row]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="medium"
          onPress={onPressBack}>
          <ButtonText>{_(msg`Back`)}</ButtonText>
        </Button>
        <View style={[a.flex_1]} />
      </View>
    </FormContainer>
  )
}
