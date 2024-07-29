import {requireNativeModule} from 'expo'

const NativeModule = requireNativeModule('ExpoHLSDownload')

export async function downloadAsync(sourceUrl: string): Promise<string> {
  return NativeModule.downloadAsync(sourceUrl)
}

export async function cancelAsync(sourceUrl: string): Promise<void> {
  return NativeModule.cancelAsync(sourceUrl)
}
