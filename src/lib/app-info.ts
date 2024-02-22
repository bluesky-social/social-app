import * as Updates from 'expo-updates'
import {nativeApplicationVersion, nativeBuildVersion} from 'expo-application'
export const updateChannel = Updates.channel

export const appVersion = `${nativeApplicationVersion} (${nativeBuildVersion})`
