export type ExpoBlueskySwissArmyModuleType = {
  getStringValueAsync(
    key: string,
    useAppGroup?: boolean,
  ): Promise<string | null>
  setStringValueAsync(
    key: string,
    value: string | null,
    useAppGroup?: boolean,
  ): Promise<void>
}
