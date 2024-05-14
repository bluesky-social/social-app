import {ExpoBackgroundNotificationHandlerModule} from './ExpoBackgroundNotificationHandler.types'

// Stub for web
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
  setBoolAsync: async (_: string, __: boolean) => {},
  setStringAsync: async (_: string, __: string) => {},
} as ExpoBackgroundNotificationHandlerModule
