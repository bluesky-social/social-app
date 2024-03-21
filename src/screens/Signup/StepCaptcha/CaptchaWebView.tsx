import React from 'react'
import {StyleSheet} from 'react-native'
import {WebView, WebViewNavigation} from 'react-native-webview'
import {ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes'

import {SignupState} from '#/screens/Signup/state'

const ALLOWED_HOSTS = [
  'bsky.social',
  'bsky.app',
  'staging.bsky.app',
  'staging.bsky.dev',
  'js.hcaptcha.com',
  'newassets.hcaptcha.com',
  'api2.hcaptcha.com',
]

export function CaptchaWebView({
  url,
  stateParam,
  state,
  onSuccess,
  onError,
}: {
  url: string
  stateParam: string
  state?: SignupState
  onSuccess: (code: string) => void
  onError: () => void
}) {
  const redirectHost = React.useMemo(() => {
    if (!state?.serviceUrl) return 'bsky.app'

    return state?.serviceUrl &&
      new URL(state?.serviceUrl).host === 'staging.bsky.dev'
      ? 'staging.bsky.app'
      : 'bsky.app'
  }, [state?.serviceUrl])

  const wasSuccessful = React.useRef(false)

  const onShouldStartLoadWithRequest = React.useCallback(
    (event: ShouldStartLoadRequest) => {
      const urlp = new URL(event.url)
      return ALLOWED_HOSTS.includes(urlp.host)
    },
    [],
  )

  const onNavigationStateChange = React.useCallback(
    (e: WebViewNavigation) => {
      if (wasSuccessful.current) return

      const urlp = new URL(e.url)
      if (urlp.host !== redirectHost) return

      const code = urlp.searchParams.get('code')
      if (urlp.searchParams.get('state') !== stateParam || !code) {
        onError()
        return
      }

      wasSuccessful.current = true
      onSuccess(code)
    },
    [redirectHost, stateParam, onSuccess, onError],
  )

  return (
    <WebView
      source={{uri: url}}
      javaScriptEnabled
      style={styles.webview}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      onNavigationStateChange={onNavigationStateChange}
      scrollEnabled={false}
    />
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
})
