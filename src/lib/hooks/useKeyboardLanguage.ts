import {useEffect, useState} from 'react'

import {
  addKeyboardLanguageListener,
  getCurrentKeyboardLanguage,
} from '../../../modules/expo-keyboard-language'

function toBcp2(tag: string | null): string | null {
  if (!tag) return null
  return tag.split('-')[0].toLowerCase()
}

/**
 * Returns the current keyboard language as a 2-letter code (e.g. "en"),
 * updating in real-time on iOS.
 */
export function useKeyboardLanguage(): string | null {
  const [language, setLanguage] = useState(() =>
    toBcp2(getCurrentKeyboardLanguage()),
  )

  useEffect(() => {
    const sub = addKeyboardLanguageListener(lang => {
      setLanguage(toBcp2(lang))
    })
    return () => sub.remove()
  }, [])

  return language
}
