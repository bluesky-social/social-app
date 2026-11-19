let nativeTabsEnabled = false

/**
 * Whether the shell uses native tabs, for code outside React like the linking
 * config. Native tabs only hold the primary tabs, so links to the secondary
 * tabs (Feeds, Lists, etc.) must open in a primary tab's stack.
 */
export function getNativeTabsEnabled() {
  return nativeTabsEnabled
}

/**
 * Set from `RoutesContainer`'s render, so it's current before
 * `NavigationContainer` resolves the initial URL.
 */
export function setNativeTabsEnabled(enabled: boolean) {
  nativeTabsEnabled = enabled
}
