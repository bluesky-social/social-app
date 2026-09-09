import {useCallback, useEffect} from 'react'
import {StyleSheet} from 'react-native'

import {type CaptchaWebViewProps} from './CaptchaWebView.shared'

const REDIRECT_HOST = new URL(window.location.href).host

/**
 * How long someone can work on a challenge before we consider it slow.
 */
const SLOW_THRESHOLD = 30e3

/**
 * Module scope because React Compiler cannot lower an optional chain inside a
 * `try`, and this one has to stay in the `try` - reading `location` on a
 * cross-origin frame throws.
 */
function getFrameHref(frame: HTMLIFrameElement | null): string | undefined {
  return frame?.contentWindow?.location.href
}

export function CaptchaWebView({
  url,
  stateParam,
  onSuccess,
  onError,
  onSlow,
}: CaptchaWebViewProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onSlow?.()
    }, SLOW_THRESHOLD)

    return () => {
      clearTimeout(timeout)
    }
  }, [onSlow])

  const onLoad = useCallback(() => {
    const frame: HTMLIFrameElement = document.getElementById(
      'captcha-iframe',
    ) as HTMLIFrameElement

    try {
      const href = getFrameHref(frame)
      if (!href) return
      const urlp = new URL(href)

      // This shouldn't happen with CORS protections, but for good measure
      if (urlp.host !== REDIRECT_HOST) return

      const code = urlp.searchParams.get('code')
      const stateMismatch = urlp.searchParams.get('state') !== stateParam
      if (stateMismatch) {
        onError({reason: 'state-mismatch', host: urlp.host})
        return
      }
      if (!code) {
        onError({reason: 'state-mismatch', host: urlp.host})
        return
      }
      onSuccess(code)
    } catch (e) {
      // We don't actually want to record an error here, because this will happen quite a bit. We will only be able to
      // get the href of the iframe if it's on our domain, so all the hcaptcha requests will throw here, although it's
      // harmless. Our other indicators of time-to-complete and back press should be more reliable in catching issues.
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
