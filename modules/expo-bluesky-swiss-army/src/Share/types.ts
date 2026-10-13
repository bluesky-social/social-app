export type NativeShareResult = {
  action: 'sharedAction' | 'dismissedAction'
  /**
   * Package name of the app the user picked, e.g. `com.whatsapp`. Only set
   * when `action` is `sharedAction`.
   */
  target?: string
}
