export type ExpoBackgroundNotificationHandlerModule = {
  getAllPrefsAsync: () => Promise<BackgroundNotificationHandlerPreferences>
  getBoolAsync: (forKey: string) => Promise<boolean>
  getStringAsync: (forKey: string) => Promise<string>
  setBoolAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: boolean,
  ) => Promise<void>
  setStringAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
}

export type BackgroundNotificationHandlerPreferences = {
  playSoundChat: boolean
  playSoundOther: boolean
}
