export type ExpoBackgroundNotificationHandlerModule = {
  getAllPrefsAsync: () => Promise<BackgroundNotificationHandlerPreferences>
  getBoolAsync: (forKey: string) => Promise<boolean>
  getStringAsync: (forKey: string) => Promise<string>
  getStringArrayAsync: (forKey: string) => Promise<string[]>
  setBoolAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: boolean,
  ) => Promise<void>
  setStringAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  setStringArrayAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string[],
  ) => Promise<void>
  addToStringArrayAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  removeFromStringArrayAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  addManyToStringArrayAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string[],
  ) => Promise<void>
  removeManyFromStringArrayAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string[],
  ) => Promise<void>
  setBadgeCountAsync: (count: number) => Promise<void>
}

// TODO there are more preferences in the native code, however they have not been added here yet.
// Don't add them until the native logic also handles the notifications for those preference types.
export type BackgroundNotificationHandlerPreferences = {
  playSoundChat: boolean
}
