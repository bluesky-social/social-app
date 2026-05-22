import {type Ref, useEffect, useImperativeHandle, useRef} from 'react'
import {type StyleProp, StyleSheet, type ViewStyle} from 'react-native'
// @ts-expect-error untyped
import {unstable_createElement} from 'react-native-web'

type WebViewSource = {uri?: string; html?: string}

type WebViewMessageEvent = {
  nativeEvent: {data: string; origin?: string}
}

export type WebViewHandle = {
  postMessage: (message: string, targetOrigin?: string) => void
}

type WebViewProps = {
  ref?: Ref<WebViewHandle>
  source: WebViewSource
  style?: StyleProp<ViewStyle>
  title?: string
  scrollEnabled?: boolean
  injectedJavaScript?: string
  onLoad?: () => void
  onMessage?: (event: WebViewMessageEvent) => void
  // Accepted for API parity with react-native-webview but ignored on web:
  // these don't translate meaningfully to iframes.
  javaScriptEnabled?: boolean
  mediaPlaybackRequiresUserAction?: boolean
  allowsInlineMediaPlayback?: boolean
  allowsFullscreenVideo?: boolean
  bounces?: boolean
  nestedScrollEnabled?: boolean
  setSupportMultipleWindows?: boolean
  onShouldStartLoadWithRequest?: (event: {url: string}) => boolean
  onNavigationStateChange?: (event: {url: string}) => void
  onError?: (event: {nativeEvent: unknown}) => void
  onHttpError?: (event: {nativeEvent: unknown}) => void
}

function injectScript(html: string | undefined, script: string | undefined) {
  if (!script || !html) return html
  return html.replace('</body>', `<script>${script}</script></body>`)
}

export function WebView({
  ref,
  source,
  style,
  title,
  scrollEnabled = true,
  injectedJavaScript,
  onLoad,
  onMessage,
}: WebViewProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)

  useImperativeHandle(ref, () => ({
    postMessage(message, targetOrigin = '*') {
      frameRef.current?.contentWindow?.postMessage(message, targetOrigin)
    },
  }))

  useEffect(() => {
    if (!onMessage) return
    const handler = (event: MessageEvent) => {
      onMessage({
        nativeEvent: {
          data:
            typeof event.data === 'string' ? event.data : String(event.data),
          origin: event.origin,
        },
      })
    }
    window.addEventListener('message', handler, true)
    return () => window.removeEventListener('message', handler, true)
  }, [onMessage])

  const flat = StyleSheet.flatten(style) as ViewStyle | undefined

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, react-hooks/refs
  return unstable_createElement('iframe', {
    title,
    ref: frameRef,
    src: source.uri,
    srcDoc: injectScript(source.html, injectedJavaScript),
    style: StyleSheet.flatten([
      styles.iframe,
      !scrollEnabled && styles.noScroll,
      style,
    ]),
    width: flat?.width,
    height: flat?.height,
    allowFullScreen: true,
    frameBorder: '0',
    onLoad,
  })
}

export default WebView

const styles = StyleSheet.create({
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  noScroll: {
    overflow: 'hidden',
  },
})
