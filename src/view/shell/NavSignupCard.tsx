import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {Logo} from '#/view/icons/Logo'
import {atoms as a} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Button, ButtonText} from '#/components/Button'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

let NavSignupCard = ({}: {}): React.ReactNode => {
  const {_} = useLingui()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const showSignIn = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = React.useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  return (
    <View style={[{maxWidth: 200}]}>
      <Link to="/" label="Bluesky - Home">
        <Logo width={32} />
      </Link>

      <View style={[a.pt_lg]}>
        <Text
          style={[a.text_3xl, a.font_bold, {lineHeight: a.text_3xl.fontSize}]}>
          <Trans>Join the conversation</Trans>
        </Text>
      </View>

      <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pt_md]}>
        <Button
          onPress={showCreateAccount}
          label={_(msg`Create account`)}
          size="small"
          variant="solid"
          color="primary">
          <ButtonText>
            <Trans>Create account</Trans>
          </ButtonText>
        </Button>
        <Button
          onPress={showSignIn}
          label={_(msg`Sign in`)}
          size="small"
          variant="solid"
          color="secondary">
          <ButtonText>
            <Trans>Sign in</Trans>
          </ButtonText>
        </Button>
      </View>

      <View style={[a.mt_md, a.w_full, {height: 32}]}>
        <AppLanguageDropdown />
      </View>
    </View>
  )
}
NavSignupCard = React.memo(NavSignupCard)
export {NavSignupCard}
