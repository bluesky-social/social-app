import {nativeBuildVersion, nativeApplicationVersion} from 'expo-application'
import {channel} from 'expo-updates'
export const updateChannel = channel
export const appVersion = `${nativeApplicationVersion} (${nativeBuildVersion})`
