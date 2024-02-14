import React from 'react'
import * as WebBrowser from 'expo-web-browser'
import {
  WebBrowserRedirectResult,
  WebBrowserResult,
  WebBrowserResultType,
} from 'expo-web-browser'

import {
  CreateAccountDispatch,
  CreateAccountState,
  is18,
} from 'view/com/auth/create/state'
import {usePalette} from 'lib/hooks/usePalette'
import {useLingui} from '@lingui/react'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {StyleSheet, View} from 'react-native'
import {Button} from 'view/com/util/forms/Button'
import {msg} from '@lingui/macro'
import {s} from 'lib/styles'
import {Policies} from 'view/com/auth/create/Policies'
import {isAndroid} from 'platform/detection'

export function AuthSessionButton({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()

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
        label={_(msg`Sign up on Bluesky Social`)}
        labelStyle={isMobile ? [s.flex1, s.textCenter, s.f17] : []}
        style={isMobile ? {paddingVertical: 12, paddingHorizontal: 20} : {}}
        onPress={onPressStartAuth}
      />
      {uiState.serviceDescription && (
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
