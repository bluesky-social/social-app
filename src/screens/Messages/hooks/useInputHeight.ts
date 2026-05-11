import {useCallback, useState} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {useSharedValue} from 'react-native-reanimated'

/**
 * Tracks the composer's measured height in two parallel forms.
 *
 * The Reanimated shared value and the React state value exist as separate
 * fields rather than one source of truth because crossing the JS/UI thread
 * boundary on every render is what reanimated explicitly avoids.
 */
export function useInputHeight() {
  const inputHeightUI = useSharedValue(0)
  const [inputHeightJS, setInputHeightJS] = useState(0)
  const onInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const {height} = event.nativeEvent.layout
      inputHeightUI.set(height)
      setInputHeightJS(height)
    },
    [inputHeightUI],
  )
  return {inputHeightUI, inputHeightJS, onInputLayout}
}
