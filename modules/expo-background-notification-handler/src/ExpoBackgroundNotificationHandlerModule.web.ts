import {ExpoBackgroundNotificationHandlerModule} from './ExpoBackgroundNotificationHandler.types'

export const BackgroundNotificationHandler = {
  getAllPrefsAsync: async () => {
    return {}
  },
  getBoolAsync: async (_: string) => {
    return false
  },
  getStringAsync: async (_: string) => {
    return ''
  },
  setBoolAsync: async (_: string, _: boolean) => {},
  setStringAsync: async (_: string, _: string) => {},
} as ExpoBackgroundNotificationHandlerModule
