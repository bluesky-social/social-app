import {useEffect, useState} from 'react'
import {InstagramStory} from '@bsky.app/expo-bluesky-swiss-army'

/**
 * Whether Instagram is installed and this build can share a story to it.
 * False until checked, and on builds without the native module. Checks again
 * each time the calling component mounts, so it notices Instagram being
 * installed or removed between share sheet opens.
 */
export function useInstagramStoryAvailable({enabled}: {enabled: boolean}) {
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let isCancelled = false
    InstagramStory.isAvailable()
      .then(available => {
        if (!isCancelled) setIsAvailable(available)
      })
      .catch(() => {})
    return () => {
      isCancelled = true
    }
  }, [enabled])

  return enabled && isAvailable
}
