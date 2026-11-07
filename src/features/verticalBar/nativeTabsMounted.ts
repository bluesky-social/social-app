let nativeTabsMounted = false

/**
 * Whether the native tabs navigator is mounted, for code outside React like
 * the linking config. Native tabs only hold the primary tabs, so links to the
 * secondary tabs (Feeds, Lists, etc.) must open in a primary tab's stack.
 */
export function getNativeTabsMounted() {
  return nativeTabsMounted
}

export function setNativeTabsMounted(mounted: boolean) {
  nativeTabsMounted = mounted
}
