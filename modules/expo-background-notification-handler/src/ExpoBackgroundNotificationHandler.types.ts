export type ExpoBackgroundNotificationHandlerModule = {
  getAllPrefsAsync: () => Promise<BackgroundNotificationHandlerPreferences>
  getBoolAsync: (forKey: string) => Promise<boolean>
  getStringAsync: (forKey: string) => Promise<string>
  getStringStoreAsync: (forKey: string) => Promise<Record<string, boolean>>
  setBoolAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: boolean,
  ) => Promise<void>
  setStringAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  setStringStoreAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: Record<string, boolean>,
  ) => Promise<void>
  addToStringStoreAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  removeFromStringStoreAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string,
  ) => Promise<void>
  addManyToStringStoreAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string[],
  ) => Promise<void>
  removeManyFromStringStoreAsync: (
    forKey: keyof BackgroundNotificationHandlerPreferences,
    value: string[],
  ) => Promise<void>
}

// TODO there are more preferences in the native code, however they have not been added here yet.
// Don't add them until the native logic also handles the notifications for those preference types.
export type BackgroundNotificationHandlerPreferences = {
  playSoundChat: boolean
  disabledDids: Record<string, boolean>
}
