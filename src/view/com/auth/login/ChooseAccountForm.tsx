import React from 'react'
import {ScrollView, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {UserAvatar} from '../../util/UserAvatar'
import {s} from 'lib/styles'
import {AccountData} from 'state/models/session'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {styles} from './styles'
import {useSession, useSessionApi, SessionAccount} from '#/state/session'
import {useGetProfile} from '#/data/useGetProfile'

function AccountItem({
  account,
  onSelect,
}: {
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isError, data} = useGetProfile({did: account.did})

  const onPress = React.useCallback(() => {
    onSelect(account)
  }, [account, onSelect])

  // TODO
  if (isError) return null

  return (
    <TouchableOpacity
      testID={`chooseAccountBtn-${account.handle}`}
      key={account.did}
      style={[pal.view, pal.border, styles.account]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Sign in as ${account.handle}`)}
      accessibilityHint="Double tap to sign in">
      <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
        <View style={s.p10}>
          <UserAvatar avatar={data?.avatar} size={30} />
        </View>
        <Text style={styles.accountText}>
          <Text type="lg-bold" style={pal.text}>
            {data?.displayName || account.handle}{' '}
          </Text>
          <Text type="lg" style={[pal.textLight]}>
            {account.handle}
          </Text>
        </Text>
        <FontAwesomeIcon
          icon="angle-right"
          size={16}
          style={[pal.text, s.mr10]}
        />
      </View>
    </TouchableOpacity>
  )
}
export const ChooseAccountForm = ({
  onSelectAccount,
  onPressBack,
}: {
  onSelectAccount: (account?: AccountData) => void
  onPressBack: () => void
}) => {
  const {track, screen} = useAnalytics()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {accounts} = useSession()
  const {initSession} = useSessionApi()

  React.useEffect(() => {
    screen('Choose Account')
  }, [screen])

  const onSelect = React.useCallback(
    async (account: SessionAccount) => {
      if (account.accessJwt) {
        await initSession(account)
        track('Sign In', {resumedSession: true})
      } else {
        onSelectAccount(account)
      }
    },
    [track, initSession, onSelectAccount],
  )

  return (
    <ScrollView testID="chooseAccountForm" style={styles.maxHeight}>
      <Text
        type="2xl-medium"
        style={[pal.text, styles.groupLabel, s.mt5, s.mb10]}>
        <Trans>Sign in as...</Trans>
      </Text>
      {accounts.map(account => (
        <AccountItem key={account.did} account={account} onSelect={onSelect} />
      ))}
      <TouchableOpacity
        testID="chooseNewAccountBtn"
        style={[pal.view, pal.border, styles.account, styles.accountLast]}
        onPress={() => onSelectAccount(undefined)}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Login to account that is not listed`)}
        accessibilityHint="">
        <View style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
          <Text style={[styles.accountText, styles.accountTextOther]}>
            <Text type="lg" style={pal.text}>
              <Trans>Other account</Trans>
            </Text>
          </Text>
          <FontAwesomeIcon
            icon="angle-right"
            size={16}
            style={[pal.text, s.mr10]}
          />
        </View>
      </TouchableOpacity>
      <View style={[s.flexRow, s.alignCenter, s.pl20, s.pr20]}>
        <TouchableOpacity onPress={onPressBack} accessibilityRole="button">
          <Text type="xl" style={[pal.link, s.pl5]}>
            <Trans>Back</Trans>
          </Text>
        </TouchableOpacity>
        <View style={s.flex1} />
      </View>
    </ScrollView>
  )
}
