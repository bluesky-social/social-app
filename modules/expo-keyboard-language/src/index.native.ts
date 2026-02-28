import {type EventSubscription} from 'expo-modules-core'
import {requireNativeModule} from 'expo-modules-core'

type ExpoKeyboardLanguageModule = {
  getCurrentKeyboardLanguage(): string | null
  addListener(
    eventName: 'onKeyboardLanguageChange',
    listener: (event: {language: string | null}) => void,
  ): EventSubscription
}

const NativeModule = requireNativeModule<ExpoKeyboardLanguageModule>(
  'ExpoKeyboardLanguage',
)

export function getCurrentKeyboardLanguage(): string | null {
  return NativeModule.getCurrentKeyboardLanguage()
}

export function addKeyboardLanguageListener(
  cb: (language: string | null) => void,
): EventSubscription {
  return NativeModule.addListener('onKeyboardLanguageChange', event => {
    cb(event.language)
  })
}
