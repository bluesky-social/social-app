import {useEffect, useState} from 'react'
import {Dimensions, type DimensionsPayload} from 'react-native'

/**
 * Same as `useWindowDimensions().fontScale`, but avoids rerendering
 * whenever the screen size changes
 */
export function useNativeFontScale() {
  const [fontScale, setFontScale] = useState(Dimensions.get('window').fontScale)

  useEffect(() => {
    const sub = Dimensions.addEventListener(
      'change',
      (evt: DimensionsPayload) => {
        if (evt.window) setFontScale(evt.window.fontScale)
      },
    )
    return () => sub.remove()
  }, [])

  return fontScale
}
