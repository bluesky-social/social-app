import {ExpoBlueskySwissArmyModuleType} from './ExpoBlueskySwissArmy.types'

export const ExpoBlueskySwissArmyModule: ExpoBlueskySwissArmyModuleType = {
  getStringValueAsync(_: string, _?: boolean): Promise<string> {
    throw new Error('getStringValueAsync is not available on web')
  },
  setStringValueAsync(_: string, _: string | null, _?: boolean): Promise<void> {
    throw new Error('setStringValueAsync is not available on web')
  },
}
