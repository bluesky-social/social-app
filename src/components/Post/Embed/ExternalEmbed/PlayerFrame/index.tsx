import {WebView} from 'react-native-webview'

import {type EmbedPlayerParams} from '#/lib/strings/embed-player'
import {atoms as a} from '#/alf'

export function PlayerFrame({
  params,
  onLoad,
}: {
  params: EmbedPlayerParams
  onLoad: () => void
}) {
  return (
    <WebView
      javaScriptEnabled
      onShouldStartLoadWithRequest={event =>
        event.url === params.playerUri ||
        (params.source.startsWith('youtube') &&
          event.url.includes('www.youtube.com'))
      }
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      bounces={false}
      allowsFullscreenVideo
      nestedScrollEnabled
      source={{uri: params.playerUri}}
      onLoad={onLoad}
      style={a.bg_transparent}
      setSupportMultipleWindows={false}
    />
  )
}
