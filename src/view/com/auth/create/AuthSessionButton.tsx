import React from 'react'
import * as WebBrowser from 'expo-web-browser'
import {WebBrowserRedirectResult, WebBrowserResult} from 'expo-web-browser'

import {
  CreateAccountDispatch,
  CreateAccountState,
  is18,
} from 'view/com/auth/create/state'
import {useLingui} from '@lingui/react'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {StyleSheet, View} from 'react-native'
import {Button} from 'view/com/util/forms/Button'
import {msg} from '@lingui/macro'
import {s} from 'lib/styles'
import {Policies} from 'view/com/auth/create/Policies'
import {isAndroid} from 'platform/detection'
import {useTheme} from '#/alf'

export function AuthSessionButton({
  type,
  uiState,
  uiDispatch,
}: {
  type: 'login' | 'signup'
  uiState?: CreateAccountState
  uiDispatch?: CreateAccountDispatch
}) {
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const t = useTheme()

  React.useEffect(() => {
    if (isAndroid) {
      WebBrowser.warmUpAsync()
    }
  }, [])

  const onPressStartAuth = React.useCallback(async () => {
    // TODO real URL
    const res: WebBrowserResult | WebBrowserRedirectResult =
      await WebBrowser.openAuthSessionAsync(
        'https://bsky.social/somewhere',
        'bsky://auth',
        {
          preferEphemeralSession: !__DEV__,
          toolbarColor: t.atoms.bg.backgroundColor,
        },
      )

    if (res.type !== 'success') return
    const urip = new URL(res.url)
    const code = urip.searchParams.get('code')
    if (!code) return

    // Use the code
  }, [])

  return (
    <View style={[styles.signupButtonContainer]}>
      <Button
        testID="requestCodeBtn"
        type="primary"
        label={
          type === 'signup'
            ? _(msg`Sign up on Bluesky Social`)
            : _(msg`Log into Bluesky Social`)
        }
        labelStyle={isMobile ? [s.flex1, s.textCenter, s.f17] : []}
        style={[{paddingVertical: 12, paddingHorizontal: 20}, s.alignCenter]}
        onPress={onPressStartAuth}
      />
      {type === 'signup' && uiState.serviceDescription && (
        <Policies
          serviceDescription={uiState.serviceDescription}
          needsGuardian={!is18(uiState)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  signupButtonContainer: {
    gap: 20,
    paddingVertical: 10,
  },
})
