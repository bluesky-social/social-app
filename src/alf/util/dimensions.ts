import {useEffect, useState} from 'react'
import {Dimensions} from 'react-native'

/**
 * Same as `useWindowDimensions().fontScale`, but avoids rerendering
 * whenever the screen size changes
 */
export function useNativeFontScale() {
  const [fontScale, setFontScale] = useState(Dimensions.get('window').fontScale)

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', evt => {
      setFontScale(evt.window.fontScale)
    })
    return () => sub.remove()
  }, [])

  return fontScale
}
