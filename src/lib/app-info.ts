import {nativeApplicationVersion, nativeBuildVersion} from 'expo-application'

export const BUILD_ENV = process.env.EXPO_PUBLIC_ENV
export const IS_DEV = process.env.EXPO_PUBLIC_ENV === 'development'
export const IS_TESTFLIGHT = process.env.EXPO_PUBLIC_ENV === 'testflight'

const UPDATES_CHANNEL = IS_TESTFLIGHT ? 'testflight' : 'production'
export const appVersion = `${nativeApplicationVersion} (${nativeBuildVersion}, ${
  IS_DEV ? 'development' : UPDATES_CHANNEL
})`
