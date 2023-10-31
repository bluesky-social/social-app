import {useCallback, useRef, useState} from 'react'
import {View} from 'react-native'

export interface ScreenGeometry {
  x: number
  y: number
  width: number
  height: number
  pageX: number
  pageY: number
}

/**
 * Use this hook whenever you need the screenspace location / width / height of
 * a component. The values are published to the `screenGeometry` state object.
 *
 * Usage:
 * - const {ref, onLayout, screenGeometry} = useScreenGeometry()
 * - `<View ref={ref} onLayout={onLayout}>`
 */
export const useScreenGeometry = () => {
  const ref = useRef<View>(null)
  const [screenGeometry, setScreenGeometry] = useState<
    ScreenGeometry | undefined
  >()

  const onLayout = useCallback(() => {
    if (!ref?.current) return
    ref.current.measure((x, y, width, height, pageX, pageY) => {
      setScreenGeometry({x, y, width, height, pageX, pageY})
    })
  }, [])

  return {ref, onLayout, screenGeometry}
}
