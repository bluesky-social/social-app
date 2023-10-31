import {Rect, SelectionGeometry, WordRange, WordSelection} from './Types'

export enum Messages {
  Log = 'LOG',
  Warn = 'WARN',
  Error = 'ERROR',
  HeightChanged = 'HEIGHT_CHANGED',
  DisplayMenu = 'DISPLAY_MENU',
  NavigateTo = 'NAVIGATE_TO',
  ScrollTo = 'SCROLL_TO',
  HighlightsChanged = 'HIGHLIGHTS_CHANGED',
  TextAvailable = 'TEXT_AVAILABLE',
  GeometryComputed = 'GEOMETRY_COMPUTED',
}

export interface DisplayMenuPayload {
  selection: WordSelection
  selectionRect: Rect
}

export interface HighlightsChangedPayload {
  words: string[]
  wordRanges: WordRange[]
}

export interface GeometryPayload {
  id: string
  selectionGeometry: SelectionGeometry
}
