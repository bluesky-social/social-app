import React from 'react'
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {UserAvatar} from '../../util/UserAvatar'
import {s} from 'lib/styles'
import {RootStoreModel} from 'state/index'
import {AccountData} from 'state/models/session'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {styles} from './styles'

export const ChooseAccountForm = ({
  store,
  onSelectAccount,
  onPressBack,
}: {
  store: RootStoreModel
  onSelectAccount: (account?: AccountData) => void
  onPressBack: () => void
}) => {
  const {track, screen} = useAnalytics()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const {_} = useLingui()

  React.useEffect(() => {
    screen('Choose Account')
  }, [screen])

  const onTryAccount = async (account: AccountData) => {
    if (account.accessJwt && account.refreshJwt) {
      setIsProcessing(true)
      if (await store.session.resumeSession(account)) {
        track('Sign In', {resumedSession: true})
        setIsProcessing(false)
        return
      }
      setIsProcessing(false)
    }
    onSelectAccount(account)
  }

  return (
    <ScrollView testID="chooseAccountForm" style={styles.maxHeight}>
      <Text
        type="2xl-medium"
        style={[pal.text, styles.groupLabel, s.mt5, s.mb10]}>
        <Trans>Sign in as...</Trans>
      </Text>
      {store.session.accounts.map(account => (
        <TouchableOpacity
          testID={`chooseAccountBtn-${account.handle}`}
          key={account.did}
          style={[pal.view, pal.border, styles.account]}
          onPress={() => onTryAccount(account)}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Sign in as ${account.handle}`)}
          accessibilityHint="Double tap to sign in">
          <View
            style={[pal.borderDark, styles.groupContent, styles.noTopBorder]}>
            <View style={s.p10}>
              <UserAvatar avatar={account.aviUrl} size={30} />
            </View>
            <Text style={styles.accountText}>
              <Text type="lg-bold" style={pal.text}>
                {account.displayName || account.handle}{' '}
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
        {isProcessing && <ActivityIndicator />}
      </View>
    </ScrollView>
  )
}
