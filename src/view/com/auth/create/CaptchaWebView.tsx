import React from 'react'
import {WebView, WebViewNavigation} from 'react-native-webview'
import {ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes'
import {StyleSheet} from 'react-native'
import {CreateAccountState} from 'view/com/auth/create/state'

const ALLOWED_HOSTS = [
  '192.168.1.10:3000', // TODO these are some testing hosts we can remove
  '192.168.1.10:19006',
  'localhost:19006',
  'bsky.social',
  'staging.bsky.app',
  'bsky.app',
  'js.hcaptcha.com',
  'newassets.hcaptcha.com',
  'api2.hcaptcha.com',
]

export function CaptchaWebView({
  url,
  stateParam,
  uiState,
  onSuccess,
  onError,
}: {
  url: string
  stateParam: string
  uiState?: CreateAccountState
  onSuccess: (code: string) => void
  onError: () => void
}) {
  const redirectHost = React.useMemo(() => {
    if (__DEV__) {
      return 'localhost:19006'
    } else if (uiState?.serviceUrl === 'https://staging.bsky.dev/') {
      return 'staging.bsky.app'
    } else {
      return 'bsky.app'
    }
  }, [uiState?.serviceUrl])

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
