import {requireNativeModule} from 'expo'

const NativeModule = requireNativeModule('UrlPrewarm')

export function prewarmUrlsAsync(urls: string[]): Promise<void> {
  return NativeModule.prewarmUrlsAsync(urls)
}
