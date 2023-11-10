import {useRef, useEffect} from 'react'
import {useAnimatedScrollHandler as useAnimatedScrollHandler_BUGGY} from 'react-native-reanimated'

export const useAnimatedScrollHandler: typeof useAnimatedScrollHandler_BUGGY = (
  config,
  deps,
) => {
  const ref = useRef(config)
  useEffect(() => {
    ref.current = config
  })
  return useAnimatedScrollHandler_BUGGY(
    {
      onBeginDrag(e) {
        if (typeof ref.current !== 'function' && ref.current.onBeginDrag) {
          ref.current.onBeginDrag(e)
        }
      },
      onEndDrag(e) {
        if (typeof ref.current !== 'function' && ref.current.onEndDrag) {
          ref.current.onEndDrag(e)
        }
      },
      onMomentumBegin(e) {
        if (typeof ref.current !== 'function' && ref.current.onMomentumBegin) {
          ref.current.onMomentumBegin(e)
        }
      },
      onMomentumEnd(e) {
        if (typeof ref.current !== 'function' && ref.current.onMomentumEnd) {
          ref.current.onMomentumEnd(e)
        }
      },
      onScroll(e) {
        if (typeof ref.current === 'function') {
          ref.current(e)
        } else if (ref.current.onScroll) {
          ref.current.onScroll(e)
        }
      },
    },
    deps,
  )
}
