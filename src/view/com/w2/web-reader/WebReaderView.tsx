// See ./README.md before modifying this file.

/* eslint-env browser */

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react'
import {
  Dimensions,
  Linking,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {WebView, WebViewMessageEvent} from 'react-native-webview'
import {
  DisplayMenuPayload,
  GeometryPayload,
  HighlightsChangedPayload,
  Messages,
} from './Messages'
import {WordRange, makePoint, moveRect} from './Types'
import {ReaderTheme, readerCss} from './assets/reader-css'
import {bundle} from './assets/bundle'
import {readerCss as readerCssCheckpoint} from './assets-checkpoint/reader-css'
import {bundle as bundleCheckpoint} from './assets-checkpoint/bundle'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useTimer} from 'lib/hooks/useTimer'
import {useFunctionRef} from 'lib/hooks/waverly/useFunctionRef'
import {
  SelectableBlockModel,
  SelectedBlocksModel,
} from 'state/models/w2/selectable-block'
import {observer} from 'mobx-react-lite'
import {WebReaderViewInterface} from './WebReaderViewInterface'
import {useScreenGeometry} from 'lib/hooks/waverly/useScreenGeometry'

// When the height changes due to fonts or images loading, or because of some
// javascript, it may trigger a few successive height change. We want to run
// some operations only when the view has stabilized, hence this delay.
const RENDERING_STABLE_DELAY_MS = 250

export interface WebReaderViewProps {
  document?: Document
  scrollY?: number
  pointer?: {x: number; y: number}
  onScrollTo?: (y: number) => void
  onDisplayMenu?: (
    payload: DisplayMenuPayload,
    onRemoveHighlight: () => void,
  ) => void
  onHighlightsChanged?: (payload: HighlightsChangedPayload) => void
  onContentReady?: () => void
  onQuoteChanged?: (sentence: string[] | undefined) => void
  onTextChanged?: (sentences: string[][] | undefined) => void
  containerStyle?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
}
interface ReaderMessage {
  msgType: Messages
  payload: unknown
}

function webReaderViewBase(
  readerCssFunc: (theme: ReaderTheme) => string,
  bundleStr: string,
) {
  return observer(function WebReaderViewBaseImpl({
    document,
    scrollY,
    pointer,
    onScrollTo,
    onDisplayMenu,
    onHighlightsChanged,
    onContentReady,
    onQuoteChanged,
    onTextChanged,
    containerStyle,
    innerStyle,
  }: WebReaderViewProps) {
    const pal = usePalette('default')
    const defaultPalette = useTheme().palette.default

    const [html, setHtml] = useState<string | null>(null)
    const [height, setHeight] = useState(Dimensions.get('window').height)
    const hasLoaded = useRef(false)
    const webViewRef = useRef<WebView>(null)
    const {ref, onLayout, screenGeometry} = useScreenGeometry()
    const viewInterface = useRef(new WebReaderViewInterface(webViewRef)).current

    const onSelectionChanged = (selBlock: SelectableBlockModel | undefined) => {
      if (onQuoteChanged) {
        if (selBlock) onQuoteChanged(selBlock.sentence) // selected
        else onQuoteChanged(undefined) // deselected
      }
    }
    const [selectedBlocks] = useState<SelectedBlocksModel>(
      new SelectedBlocksModel(viewInterface, onSelectionChanged),
    )

    const [_onRenderingStable] = useFunctionRef(
      useCallback(() => {
        if (!hasLoaded.current) return
        console.log(`WebReaderView stabilized (height = ${height})`)
        selectedBlocks.extractBoundingBoxes()
      }, [height, selectedBlocks]),
    )

    const [resetStableTimer, cancelStableTimer] = useTimer(
      RENDERING_STABLE_DELAY_MS,
      _onRenderingStable,
      false,
    )

    const readerCssStr = useMemo(
      () =>
        readerCssFunc({...defaultPalette, highlight: defaultPalette.highlight}),
      [defaultPalette],
    )

    useEffect(() => {
      hasLoaded.current = false
      cancelStableTimer()
      webViewRef.current?.stopLoading()
    }, [cancelStableTimer, document])

    useEffect(() => {
      const fullHtml = /* html */ `
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1">
        <!-- This __base_url is filled by WebView. We use it to identify anchor with
             links within the same page. -->
        <link rel="canonical" href="" id="__base_url">
        <style type="text/css">
          ${readerCssStr}
        </style>
        <script>
          ${bundleStr}
        </script>
      </head>
      <body>
        ${document?.toString() ?? ''}
      </body>
    </html>
    `

      setHtml(fullHtml)
    }, [document, readerCssStr])

    const _onLoadEnd = useCallback(() => {
      hasLoaded.current = true
      resetStableTimer()
      onContentReady && onContentReady()
    }, [onContentReady, resetStableTimer])

    const _onScrollTo = useCallback(
      (pos: number) => {
        if (!onScrollTo || !screenGeometry) return
        onScrollTo(pos + screenGeometry.y)
      },
      [onScrollTo, screenGeometry],
    )

    const _onRemoveHighlight = useCallback(
      (wordRange: WordRange) => {
        viewInterface.onRemoveHighlight(wordRange)
      },
      [viewInterface],
    )

    const _onDisplayMenu = useCallback(
      (payload: DisplayMenuPayload) => {
        if (!onDisplayMenu || !screenGeometry) return
        const {pageX, pageY} = screenGeometry
        onDisplayMenu(
          {
            selection: payload.selection,
            selectionRect: moveRect(
              payload.selectionRect,
              makePoint(pageX, pageY),
            ),
          },
          () => _onRemoveHighlight(payload.selection.wordRange),
        )
      },
      [_onRemoveHighlight, onDisplayMenu, screenGeometry],
    )

    const _onTextAvailable = useCallback(
      (sentences: string[][]) => selectedBlocks.setSentences(sentences),
      [selectedBlocks],
    )

    const _onGeometryComputed = useCallback(
      (geometryPayload: GeometryPayload) => {
        selectedBlocks.setGeometry(
          geometryPayload.id,
          geometryPayload.selectionGeometry,
        )
      },
      [selectedBlocks],
    )

    const _onWebViewMessage = useCallback(
      (event: WebViewMessageEvent) => {
        const {msgType, payload}: ReaderMessage = JSON.parse(
          event.nativeEvent.data,
        )

        switch (msgType) {
          case Messages.HeightChanged:
            setHeight(currHeight => {
              const newHeight = payload as number
              if (newHeight !== currHeight) resetStableTimer()
              return newHeight
            })
            break
          case Messages.NavigateTo:
            Linking.canOpenURL(payload as string).then(() =>
              Linking.openURL(payload as string),
            )
            break
          case Messages.ScrollTo:
            _onScrollTo((payload ?? 0) as number)
            break
          case Messages.DisplayMenu:
            payload && _onDisplayMenu(payload as DisplayMenuPayload)
            break
          case Messages.HighlightsChanged:
            payload &&
              onHighlightsChanged &&
              onHighlightsChanged(payload as HighlightsChangedPayload)
            break
          case Messages.TextAvailable:
            // Payload is a list of sentences (each sentence is a list of words)
            if (payload) {
              _onTextAvailable(payload as string[][])
              if (onTextChanged) onTextChanged(payload as string[][])
            }
            break
          case Messages.GeometryComputed:
            payload && _onGeometryComputed(payload as GeometryPayload)
            break
          case Messages.Log:
            console.log(...(payload as any[]))
            break
          case Messages.Warn:
            console.warn(...(payload as any[]))
            break
          case Messages.Error:
            console.error(...(payload as any[]))
            break
          default:
            console.warn(`Unknown message from Reader ${msgType}:`, payload)
        }
      },
      [
        resetStableTimer,
        _onScrollTo,
        _onDisplayMenu,
        onHighlightsChanged,
        _onTextAvailable,
        _onGeometryComputed,
        onTextChanged,
      ],
    )

    // Tracks when the pointer changes because the user is dragging the fab.
    useEffect(() => {
      if (!pointer) return
      if (scrollY === undefined || !pointer || !screenGeometry) {
        selectedBlocks.unhighlightAll()
        return
      }
      const viewTop = (screenGeometry?.pageY ?? 0) - scrollY
      selectedBlocks.highlightAtPos(viewTop, screenGeometry.height, pointer)
    }, [scrollY, pointer, selectedBlocks, screenGeometry])

    return (
      <View ref={ref} onLayout={onLayout} style={[containerStyle]}>
        {html && (
          <WebView
            incognito={true}
            ref={webViewRef}
            style={[innerStyle, pal.view, styles.webView, {height}]}
            containerStyle={[styles.webViewContainer, {height}]}
            originWhitelist={['*']}
            source={{
              baseUrl: '', // Needed for custom fonts to work.
              html,
            }}
            allowsFullscreenVideo={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={true}
            onLoadEnd={_onLoadEnd}
            onMessage={_onWebViewMessage}
            injectedJavaScript="onLoadingComplete();"
            scrollEnabled={false}
            allowsLinkPreview={false}
            onShouldStartLoadWithRequest={() => true}
          />
        )}
      </View>
    )
  })
}

const styles = StyleSheet.create({
  webView: {
    position: 'absolute',
    width: '100%',
  },
  webViewContainer: {
    position: 'relative',
    width: '100%',
  },
})

export const WebReaderView = webReaderViewBase(readerCss, bundle)
export const WebReaderViewCheckpoint = webReaderViewBase(
  readerCssCheckpoint,
  bundleCheckpoint,
)
