import * as Updates from 'expo-updates'
import VersionNumber from 'react-native-version-number'
export const updateChannel = Updates.channel

export const appVersion = `${VersionNumber.appVersion} (${VersionNumber.buildVersion})`
