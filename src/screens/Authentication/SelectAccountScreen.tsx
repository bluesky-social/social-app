import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type AuthNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {Logo} from '#/view/icons/Logo'
import {atoms as a} from '#/alf'
import {AccountList} from '#/components/AccountList'
import * as Layout from './components/Layout'

type Props = NativeStackScreenProps<AuthNavigatorParams, 'SelectAccount'>
export function SelectAccountScreen({navigation}: Props) {
  return (
    <SelectAccountScreenInner
      signIn={account => navigation.navigate('SignIn', {account})}
    />
  )
}

export function SelectAccountScreenInner({
  signIn,
}: {
  signIn: (account?: SessionAccount) => void
}) {
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onSelect = async (account: SessionAccount) => {
    if (pendingDid) {
      // The session API isn't resilient to race conditions so let's just ignore this.
      return
    }
    if (!account.accessJwt) {
      // Move to login form.
      signIn(account)
      return
    }
    if (account.did === currentAccount?.did) {
      setShowLoggedOut(false)
      return
    }
    try {
      setPendingDid(account.did)
      await resumeSession(account)
      logger.metric('account:loggedIn', {
        logContext: 'ChooseAccountForm',
        withPassword: false,
      })
      Toast.show(_(msg`Signed in as @${account.handle}`))
    } catch (e: any) {
      logger.error('choose account: initSession failed', {
        message: e.message,
      })
      // Move to login form.
      signIn(account)
    } finally {
      setPendingDid(null)
    }
  }

  return (
    <Layout.Screen testID="SelectAccountScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Logo />
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content contentContainerStyle={[a.p_xl]}>
        <Layout.TitleText>
          <Trans>Select account</Trans>
        </Layout.TitleText>
        <View style={[a.mt_lg]}>
          <AccountList
            onSelectAccount={onSelect}
            onSelectOther={signIn}
            pendingDid={pendingDid}
            otherLabel={_(msg`Add account`)}
          />
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
