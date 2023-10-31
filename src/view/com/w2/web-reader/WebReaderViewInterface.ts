import WebView from 'react-native-webview'
import {ExtraWindowFunctions, SelectionGeometry, WordRange} from './Types'

export function getJS<K extends keyof ExtraWindowFunctions>(
  functionName: K,
  ...args: Parameters<ExtraWindowFunctions[K]>
): string {
  const params = args.map(arg => JSON.stringify(arg))
  return `window.${functionName}(${params.join(', ')});`
}

export class WebReaderViewInterface implements ExtraWindowFunctions {
  constructor(public webViewRef: React.RefObject<WebView<any>>) {}

  call(js: string) {
    this.webViewRef.current?.injectJavaScript(js + ' true;')
  }

  onLoadingComplete() {
    this.call(getJS('onLoadingComplete'))
  }
  onRemoveHighlight(wordRange: WordRange) {
    this.call(getJS('onRemoveHighlight', wordRange))
  }
  onSetHighlights(oldWords: string[], wordRanges: WordRange[]) {
    this.call(getJS('onSetHighlights', oldWords, wordRanges))
  }
  goToHighlightElemPos(highlight: string) {
    this.call(getJS('goToHighlightElemPos', highlight))
  }
  onExtractBoundingBox(id: string, wordRange: WordRange) {
    this.call(getJS('onExtractBoundingBox', id, wordRange))
  }
  onHighlightBlock(id: string, geometry: SelectionGeometry) {
    this.call(getJS('onHighlightBlock', id, geometry))
  }
  onUnhighlightBlock(id: string) {
    this.call(getJS('onUnhighlightBlock', id))
  }
  onDeleteBlock(id: string) {
    this.call(getJS('onDeleteBlock', id))
  }
}
