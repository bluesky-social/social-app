import React from 'react'
import {StyleSheet} from 'react-native'

// @ts-ignore web only, we will always redirect to the app on web (CORS)
const REDIRECT_HOST = new URL(window.location.href).host

export function CaptchaWebView({
  url,
  stateParam,
  onSuccess,
  onError,
}: {
  url: string
  stateParam: string
  onSuccess: (code: string) => void
  onError: () => void
}) {
  const onLoad = React.useCallback(() => {
    // @ts-ignore web
    const frame: HTMLIFrameElement = document.getElementById(
      'captcha-iframe',
    ) as HTMLIFrameElement

    try {
      // @ts-ignore web
      const href = frame?.contentWindow?.location.href
      if (!href) return
      const urlp = new URL(href)

      // This shouldn't happen with CORS protections, but for good measure
      if (urlp.host !== REDIRECT_HOST) return

      const code = urlp.searchParams.get('code')
      if (urlp.searchParams.get('state') !== stateParam || !code) {
        onError()
        return
      }
      onSuccess(code)
    } catch (e) {
      // We don't need to handle this
    }
  }, [stateParam, onSuccess, onError])

  return (
    <iframe
      src={url}
      style={styles.iframe}
      id="captcha-iframe"
      onLoad={onLoad}
    />
  )
}

const styles = StyleSheet.create({
  iframe: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
})
