import VersionNumber from 'react-native-version-number'
import * as Updates from 'expo-updates'
export const updateChannel = Updates.channel

export const appVersion = `${VersionNumber.appVersion} (${VersionNumber.buildVersion})`
