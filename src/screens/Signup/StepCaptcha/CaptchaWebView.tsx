import {useEffect, useMemo, useRef} from 'react'
import {WebView, type WebViewNavigation} from 'react-native-webview'
import {type ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes'

import {type CaptchaWebViewProps} from './CaptchaWebView.shared'

const ALLOWED_HOSTS = [
  'bsky.social',
  'bsky.app',
  'staging.bsky.app',
  'staging.bsky.dev',
  'app.staging.bsky.dev',
  'js.hcaptcha.com',
  'newassets.hcaptcha.com',
  'api2.hcaptcha.com',
]

const MIN_DELAY = 3_500

function safeHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'unparseable'
  }
}

export function CaptchaWebView({
  url,
  stateParam,
  state,
  onComplete,
  onSuccess,
  onError,
  onBlockedLoad,
}: CaptchaWebViewProps) {
  const startedAt = useRef(Date.now())
  const successTo = useRef<NodeJS.Timeout>(undefined)

  useEffect(() => {
    return () => {
      if (successTo.current) {
        clearTimeout(successTo.current)
      }
    }
  }, [])

  const redirectHost = useMemo(() => {
    if (!state?.serviceUrl) return 'bsky.app'

    return state?.serviceUrl &&
      new URL(state?.serviceUrl).host === 'staging.bsky.dev'
      ? 'app.staging.bsky.dev'
      : 'bsky.app'
  }, [state?.serviceUrl])

  const wasSuccessful = useRef(false)

  const onShouldStartLoadWithRequest = (event: ShouldStartLoadRequest) => {
    const host = safeHost(event.url)
    const allowed = ALLOWED_HOSTS.includes(host)

    /*
     * iOS routes subframe navigations through this handler and cancels them if
     * we return false; Android's shouldOverrideUrlLoading only ever sees the
     * main frame. Report what we refuse so we can tell whether the allowlist is
     * silently breaking hCaptcha's challenge on iOS.
     * TODO Behavior is intentionally unchanged here - the fix is gated on this
     * data. -dsb
     */
    if (!allowed) {
      onBlockedLoad?.(host, event.isTopFrame)
    }

    return allowed
  }

  const onNavigationStateChange = (e: WebViewNavigation) => {
    if (wasSuccessful.current) return

    const urlp = new URL(e.url)
    if (urlp.host !== redirectHost || urlp.pathname === '/gate/signup') return

    const code = urlp.searchParams.get('code')
    if (urlp.searchParams.get('state') !== stateParam || !code) {
      onError({reason: 'state-mismatch', host: urlp.host})
      return
    }

    // We want to delay the completion of this screen ever so slightly so that it doesn't appear to be a glitch if it completes too fast
    wasSuccessful.current = true
    onComplete()
    const now = Date.now()
    const timeTaken = now - startedAt.current
    if (timeTaken < MIN_DELAY) {
      successTo.current = setTimeout(() => {
        onSuccess(code)
      }, MIN_DELAY - timeTaken)
    } else {
      onSuccess(code)
    }
  }

  return (
    <WebView
      source={{uri: url}}
      javaScriptEnabled
      style={{
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 10,
      }}
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      onNavigationStateChange={onNavigationStateChange}
      scrollEnabled={false}
      onError={e => {
        onError({
          reason: 'webview-error',
          host: safeHost(e.nativeEvent.url),
          cause: e.nativeEvent,
        })
      }}
      onHttpError={e => {
        onError({
          reason: 'http-error',
          host: safeHost(e.nativeEvent.url),
          statusCode: e.nativeEvent.statusCode,
          cause: e.nativeEvent,
        })
      }}
    />
  )
}
