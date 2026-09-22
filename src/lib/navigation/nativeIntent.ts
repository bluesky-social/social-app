/** Normalize universal links, both app schemes, and Expo development links. */
export function nativeIntentPath(
  path: string,
  currentPath = '/(tabs)/(home)',
): string {
  try {
    const url = new URL(path, 'https://bsky.app')
    let pathname = url.pathname
    if (url.protocol === 'bluesky:' || url.protocol === 'bsky:') {
      pathname = `/${url.hostname}${pathname}`.replace(/^\/+/, '/')
    }
    if (pathname.startsWith('/--/')) pathname = pathname.slice(3)
    const tab =
      (
        {
          '/search': 'search',
          '/notifications': 'notifications',
          '/messages': 'messages',
          '/my-profile': 'profile',
        } as Record<string, string>
      )[pathname] ?? 'home'
    if (pathname.startsWith('/intent/')) return currentPath
    if (/^\/chat\/[^/]+\/?$/.test(pathname)) {
      return '/(tabs)/(home)'
    }
    return `/(tabs)/(${tab})${pathname}${url.search}${url.hash}`
  } catch {
    return '/(tabs)/(home)'
  }
}
