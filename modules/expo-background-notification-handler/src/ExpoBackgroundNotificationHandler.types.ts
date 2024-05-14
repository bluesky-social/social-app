export type ExpoBackgroundNotificationHandlerModule = {
  getAllPrefsAsync: () => Promise<Record<string, string | boolean | null>>
  getBoolAsync: (forKey: string) => Promise<boolean>
  getStringAsync: (forKey: string) => Promise<string>
  setBoolAsync: (forKey: string, value: boolean) => Promise<void>
  setStringAsync: (forKey: string, value: string) => Promise<void>
}
