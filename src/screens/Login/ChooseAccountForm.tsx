import React from 'react'
import {Text, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {colors} from '#/lib/styles'
import {logger} from '#/logger'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import * as Toast from '#/view/com/util/Toast'
import {Logo} from '#/view/icons/Logo'
import {atoms as a} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonText} from '#/components/Button'
// import * as TextField from '#/components/forms/TextField'
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
    <FormContainer style={[a.px_lg]} testID="chooseAccountForm">
      <Button
        style={a.self_start}
        label={_(msg`Cancel`)}
        variant="solid"
        color="soft_neutral"
        size="small"
        onPress={onPressBack}>
        <ButtonText>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
      <View
        style={[
          a.self_center,
          a.pb_5xl_8,
          a.pt_s50,
          a.px_md,
          a.mb_md,
          a.mt_lg,
          a.border_0,
          a.rounded_full,
          a.mx_2xl,
          {
            backgroundColor: colors.black,
          },
        ]}>
        <Logo width={104} fill={colors.white} />
      </View>
      <View>
        <Text style={[a.self_center, a.text_4xl, a.font_bold, a.mx_2xl]}>
          <Trans>Sign in to Gander.</Trans>
        </Text>
        <AccountList
          onSelectAccount={onSelect}
          onSelectOther={() => onSelectAccount()}
          pendingDid={pendingDid}
        />
      </View>
    </FormContainer>
  )
}
