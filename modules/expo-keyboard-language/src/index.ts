import {type EventSubscription} from 'expo-modules-core'

export function getCurrentKeyboardLanguage(): string | null {
  return null
}

export function addKeyboardLanguageListener(
  _cb: (language: string | null) => void,
): EventSubscription {
  return {remove() {}}
}
