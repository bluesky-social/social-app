// Types that are shared between the app and the embedded reader.

export interface Point {
  x: number
  y: number
}

export interface Rect {
  top: number
  bottom: number
  left: number
  right: number
}

export interface WordRange {
  fromWord: number
  toWord: number
}

export interface WordSelection {
  text: string | null // null means it's unhighlighting
  wordRange: WordRange
}

export const makePoint = (x: number, y: number) => ({x, y})

export const makeRect = (
  left: number,
  right: number,
  top: number,
  bottom: number,
) => ({left, right, top, bottom})

export const moveRect = (rect: Rect, vector: Point): Rect => ({
  left: rect.left + vector.x,
  right: rect.right + vector.x,
  top: rect.top + vector.y,
  bottom: rect.bottom + vector.y,
})

// SelectionsGeometry represent the bounding boxes of selected text. Since the
// selection can start in the middle of a line and end in the middle of another
// line we use three bounding boxes. `.firstLine` is always present. If the
// selection has at least two lines `.lastLine` is also present.
// If it has at least three lines then `.middle` is there too.
export interface SelectionGeometry {
  firstLine: DOMRectReadOnly
  lastLine?: DOMRectReadOnly
  middle?: DOMRectReadOnly
}

export interface ExtraWindowFunctions {
  onLoadingComplete: () => void
  onRemoveHighlight: (wordRange: WordRange) => void
  onSetHighlights: (oldWords: string[], wordRanges: WordRange[]) => void
  goToHighlightElemPos: (highlight: string) => void
  onExtractBoundingBox: (id: string, wordRange: WordRange) => void
  onHighlightBlock: (id: string, geometry: SelectionGeometry) => void
  onUnhighlightBlock: (id: string) => void
  onDeleteBlock: (id: string) => void
}
