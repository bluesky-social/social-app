import {ExpoBlueskySwissArmyModuleType} from './ExpoBlueskySwissArmy.types'

export const ExpoBlueskySwissArmyModule: ExpoBlueskySwissArmyModuleType = {
  getStringValueAsync(_: string, __?: boolean): Promise<string> {
    throw new Error('getStringValueAsync is not available on web')
  },
  setStringValueAsync(
    _: string,
    __: string | null,
    ___?: boolean,
  ): Promise<void> {
    throw new Error('setStringValueAsync is not available on web')
  },
}
