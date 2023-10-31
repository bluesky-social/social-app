import React, {useState, useEffect, useRef, useCallback} from 'react'
import {Linking, StyleProp, View, ViewStyle, StyleSheet} from 'react-native'

import {WebView} from 'react-native-webview'

import {WebViewSourceUri} from 'react-native-webview/lib/WebViewTypes'

import {Dimensions} from 'react-native'
import {useFunctionRef} from 'lib/hooks/waverly/useFunctionRef'
import {useTimer} from 'lib/hooks/useTimer'

// When the height changes due to fonts or images loading, or because of some
// javascript, it may trigger a few successive height change. We want to run
// some operations only when the view has stabilized, hence this delay.
const RENDERING_STABLE_DELAY_MS = 250

export interface HTMLViewProps {
  url: string
  onContentReady?: () => void
  onDocumentLoaded?: (url: string, html: string) => void
  containerStyle?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
}

type WebViewMessage = {
  type: 'HEIGHT_CHANGE' | 'HTML'
  data: string
}

// How much time should we give the JavaScript of the page to execute and change its
// DOM before we consider the HTML valid and send it back to the parent?
const DELAY_TO_EXECUTE_JS = 250

const INITIAL_JS = 'window.alert = () => {};'

// Disables zoom until we fully support it.
const META_NAME_ZOOM_DISABLE = 'viewport'
const META_CONTENT_ZOOM_DISABLE = 'width=device-width, user-scalable=no'

const FINAL_JS = /* js */ `(() => {
  const meta = document.createElement('meta');
  meta.setAttribute('name', '${META_NAME_ZOOM_DISABLE}');
  meta.setAttribute('content', '${META_CONTENT_ZOOM_DISABLE}');
  document.getElementsByTagName('head')[0].appendChild(meta);

  const updateHeight = () => {
    const height = document.documentElement.scrollHeight;
    const message = { type: 'HEIGHT_CHANGE', data: height };
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  };

  const resizeObserver = new ResizeObserver(() => {
    updateHeight();
  });
  resizeObserver.observe(document.documentElement);

  window.onload = () => {
    updateHeight();
  };
  // Wait 1s for javascript to execute
  setTimeout(() => {
    const message = {type: 'HTML', data: document.documentElement.innerHTML}
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }, ${DELAY_TO_EXECUTE_JS});
})();`

export const WebHtmlView = ({
  url,
  onDocumentLoaded,
  onContentReady,
  containerStyle,
  innerStyle,
}: HTMLViewProps) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null)

  const [height, setHeight] = useState(Dimensions.get('window').height)
  const hasLoaded = useRef(false)
  const webViewRef = useRef<WebView>(null)

  const [_onRenderingStable] = useFunctionRef(
    useCallback(() => {
      if (!hasLoaded.current) return
      console.log(`WebHtmlView stabilized (height = ${height})`)
    }, [height]),
  )

  const [resetStableTimer, cancelStableTimer] = useTimer(
    RENDERING_STABLE_DELAY_MS,
    _onRenderingStable,
    false,
  )
  useEffect(() => {
    hasLoaded.current = false
    cancelStableTimer()
    webViewRef.current?.stopLoading()
    setActiveUrl(url)
  }, [cancelStableTimer, url])

  useEffect(() => {
    const ref = webViewRef.current
    return () => {
      hasLoaded.current = false
      cancelStableTimer()
      ref?.stopLoading()
    }
  }, [cancelStableTimer])

  const reportHTML = useCallback(
    (html: string) => {
      if (onDocumentLoaded && activeUrl)
        onDocumentLoaded && onDocumentLoaded(activeUrl, html)
    },
    [activeUrl, onDocumentLoaded],
  )

  const handleMessage = useCallback(
    (message: WebViewMessage) => {
      if (message.type === 'HEIGHT_CHANGE') {
        setHeight(currHeight => {
          const newHeight = Number(message.data)
          if (newHeight !== currHeight) resetStableTimer()
          return newHeight
        })
      } else if (message.type === 'HTML') reportHTML(message.data)
      else console.warn(`Invalid message type: ${message.type}`)
    },
    [reportHTML, resetStableTimer],
  )

  const onLoadEnd = useCallback(() => {
    hasLoaded.current = true
    resetStableTimer()
    onContentReady && onContentReady()
  }, [onContentReady, resetStableTimer])

  return activeUrl ? (
    <WebView
      incognito={true}
      key={activeUrl}
      ref={webViewRef}
      style={[innerStyle, styles.webView, {height}]}
      containerStyle={[containerStyle, styles.webViewContainer]}
      source={{uri: activeUrl} as WebViewSourceUri}
      originWhitelist={['*']}
      scrollEnabled={false}
      decelerationRate="normal"
      allowsFullscreenVideo={false}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={true}
      allowsLinkPreview={false}
      onMessage={ev => handleMessage(JSON.parse(ev.nativeEvent.data))}
      injectedJavaScriptBeforeContentLoaded={INITIAL_JS}
      injectedJavaScript={FINAL_JS}
      onLoadEnd={onLoadEnd}
      onShouldStartLoadWithRequest={request => {
        // We go to the full browser for any user-initiated navigation.
        // That is: navigation that affects the top frame and that is not due
        // to some scripting redirect.
        if (
          request.isTopFrame &&
          request.navigationType !== 'other' &&
          request.url !== url
        ) {
          Linking.canOpenURL(request.url).then(() =>
            Linking.openURL(request.url),
          )
          return false
        }
        return true
      }}
    />
  ) : (
    <View />
  )
}

const styles = StyleSheet.create({
  webView: {
    flex: 0,
    width: '100%',
  },
  webViewContainer: {
    flex: 0,
    width: '100%',
  },
})
