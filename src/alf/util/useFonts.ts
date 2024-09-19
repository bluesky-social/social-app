export function useFonts() {
  /**
   * For native, the `expo-font` config plugin embeds the fonts in the
   * application binary. But `expo-font` isn't supported on web, so we fall
   * back to async loading here.
   */
  return [true, null]
}
