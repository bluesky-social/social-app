/**
 * The minimum a scrollable needs to expose for the web handlers to find its
 * DOM node. Both `ScrollView` and `FlatList` satisfy this.
 */
export type ScrollHandle = {getScrollableNode(): unknown}

/**
 * Arguments shared by the keyboard and pointer handlers. Actual scrolling
 * happens through `scrollTo` so the handlers don't care what the scrollable is.
 */
export type NavigationHandlerArgs = {
  scrollRef: React.RefObject<ScrollHandle | null>
  itemWidthsRef: React.RefObject<Map<number, number>>
  currentIndexRef: React.RefObject<number>
  scrollTo: (offset: number) => void
  onSettle: (index: number) => void
  itemCount: number
  /**
   * Changes whenever the identity or order of items changes, even if the count
   * doesn't, so in-flight navigation for the old items is dropped.
   */
  resetKey: string
}

export type GalleryRef = {
  /**
   * Scrolls the minimum distance needed to bring the item at `index` into
   * view, without animation. Does not move focus or report a user navigation.
   * Invalid indices are ignored.
   */
  scrollIntoView(index: number): void
}
