import {
  BackgroundNotificationHandlerPreferences,
  ExpoBackgroundNotificationHandlerModule,
} from './ExpoBackgroundNotificationHandler.types'

// Stub for web
export const BackgroundNotificationHandler = {
  getAllPrefsAsync: async () => {
    return {} as BackgroundNotificationHandlerPreferences
  },
  getBoolAsync: async (_: string) => {
    return false
  },
  getStringAsync: async (_: string) => {
    return ''
  },
  getStringArrayAsync: async (_: string) => {
    return []
  },
  setBoolAsync: async (_: string, __: boolean) => {},
  setStringAsync: async (_: string, __: string) => {},
  setStringArrayAsync: async (_: string, __: string[]) => {},
  addToStringArrayAsync: async (_: string, __: string) => {},
  removeFromStringArrayAsync: async (_: string, __: string) => {},
  addManyToStringArrayAsync: async (_: string, __: string[]) => {},
  removeManyFromStringArrayAsync: async (_: string, __: string[]) => {},
  setBadgeCountAsync: async (_: number) => {},
} as ExpoBackgroundNotificationHandlerModule
