import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {DefaultAvatar} from '#/view/com/util/UserAvatar'
import {Text} from '#/view/com/util/text/Text'
import {Button} from '#/view/com/util/forms/Button'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'

let NavSignupCard = ({}: {}): React.ReactNode => {
  const {_} = useLingui()
  const pal = usePalette('default')
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
    <View
      style={{
        alignItems: 'flex-start',
        paddingTop: 6,
        marginBottom: 24,
      }}>
      <DefaultAvatar type="user" size={48} />

      <View style={{paddingTop: 12}}>
        <Text type="md" style={[pal.text, s.bold]}>
          <Trans>Sign up or sign in to join the conversation</Trans>
        </Text>
      </View>

      <View style={{flexDirection: 'row', paddingTop: 12, gap: 8}}>
        <Button
          onPress={showCreateAccount}
          accessibilityHint={_(msg`Sign up`)}
          accessibilityLabel={_(msg`Sign up`)}>
          <Text type="md" style={[{color: 'white'}, s.bold]}>
            <Trans>Sign up</Trans>
          </Text>
        </Button>
        <Button
          type="default"
          onPress={showSignIn}
          accessibilityHint={_(msg`Sign in`)}
          accessibilityLabel={_(msg`Sign in`)}>
          <Text type="md" style={[pal.text, s.bold]}>
            Sign in
          </Text>
        </Button>
      </View>
    </View>
  )
}
NavSignupCard = React.memo(NavSignupCard)
export {NavSignupCard}
