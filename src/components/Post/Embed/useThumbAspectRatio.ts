import {useEffect, useState} from 'react'
import {Image} from 'react-native'

const MIN_RATIO = 1 / 2

export function useThumbAspectRatio(
  uri: string | undefined,
  fallback: number,
): number {
  const [ratio, setRatio] = useState(fallback)

  useEffect(() => {
    if (!uri) {
      setRatio(fallback)
      return
    }
    let cancelled = false
    Image.getSize(
      uri,
      (width, height) => {
        if (cancelled || !width || !height) return
        setRatio(Math.max(width / height, MIN_RATIO))
      },
      () => {
        // leave the fallback ratio in place
      },
    )
    return () => {
      cancelled = true
    }
  }, [uri, fallback])

  return ratio
}
