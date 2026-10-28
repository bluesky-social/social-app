import {type ListRenderItem} from 'react-native'

export interface SectionRef {
  scrollToTop: () => void
}

/**
 * Rows that stand for a state rather than an item: still loading, nothing to
 * show, or a request that failed. They share a `_reactKey` so a list can key
 * them like anything else.
 */
export const LOADING_ROW = {_reactKey: '__loading__'}
export const EMPTY_ROW = {_reactKey: '__empty__'}
export const ERROR_ROW = {_reactKey: '__error__'}
export const LOAD_MORE_ERROR_ROW = {_reactKey: '__load_more_error__'}

/** What every row of a profile list has: a stable key. */
export type KeyedRow = {_reactKey?: string; uri?: string}

export function rowKey(row: KeyedRow): string {
  return row._reactKey ?? row.uri ?? ''
}

/* oxlint-disable typescript/no-explicit-any -- rows differ from tab to tab */

/**
 * One tab of a profile, described as the props of the list that shows it.
 *
 * A profile is a single scroll surface: the header, the tab strip and the
 * selected tab's rows all scroll together, so changing tabs swaps what the list
 * holds rather than moving to another list. That is why a tab describes itself
 * here instead of rendering a `List` of its own.
 */
export type ProfileSection = {
  data: any[]
  renderItem: ListRenderItem<any>
  keyExtractor: (row: any) => string
  /** Below the last row: paging spinners and end-of-list actions. */
  ListFooterComponent?: React.ComponentType | React.ReactElement
  /** Reports rows the reader has seen, for tabs that count views. */
  onItemSeen?: (row: any) => void
  /** Composed with the screen's own handler; a feed watches this too. */
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  onRefresh?: () => void
  refreshing: boolean
  onEndReached?: () => void
  /** Re-fetches the tab, for a soft reset or a press on the selected tab. */
  onReset?: () => void
  /** Whether the tab has posts above the reader they have not seen yet. */
  hasNew?: boolean
  /** True once the tab has loaded and has nothing to show. */
  isEmpty: boolean
}
