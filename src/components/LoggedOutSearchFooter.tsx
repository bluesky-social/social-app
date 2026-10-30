import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function LoggedOutSearchFooter() {
  const {t: l} = useLingui()
  const t = useTheme()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {requestSwitchToAccount} = useLoggedOutViewControls()

  const showSignIn = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }

  const showCreateAccount = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }

  return (
    <View
      testID="loggedOutSearchFooter"
      style={[
        a.w_full,
        a.align_center,
        a.justify_center,
        a.gap_sm,
        a.border_t,
        a.p_lg,
        t.atoms.border_contrast_low,
        {minHeight: 180},
      ]}>
      <Text style={[a.text_lg, a.font_semi_bold, a.text_center]}>
        <Trans>Want to see more?</Trans>
      </Text>
      <Text style={[a.text_md, a.text_center, a.leading_snug, {maxWidth: 394}]}>
        <Trans>
          <Text
            testID="loggedOutSearchSignIn"
            role="button"
            accessibilityLabel={l`Sign in`}
            accessibilityHint=""
            style={t.atoms.text_link}
            onPress={showSignIn}>
            Sign in
          </Text>
          <Text style={t.atoms.text_contrast_medium}> or </Text>
          <Text
            testID="loggedOutSearchCreateAccount"
            role="button"
            accessibilityLabel={l`Create an account`}
            accessibilityHint=""
            style={t.atoms.text_link}
            onPress={showCreateAccount}>
            create an account
          </Text>
          <Text style={t.atoms.text_contrast_medium}> to see more posts.</Text>
        </Trans>
      </Text>
    </View>
  )
}
