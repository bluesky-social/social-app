export const ExpoBlueskySwissArmyModule = {
  getStringValueAsync(_: string, _?: boolean): Promise<string> {
    throw new Error('getStringValueAsync is not available on Android')
  },
  setStringValueAsync(_: string, _: string | null, _?: boolean): Promise<void> {
    throw new Error('setStringValueAsync is not available on Android')
  },
}
