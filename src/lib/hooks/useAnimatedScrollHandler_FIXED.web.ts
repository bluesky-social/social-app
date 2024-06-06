import {useEffect, useRef} from 'react'
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
      onBeginDrag(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onBeginDrag) {
          ref.current.onBeginDrag(e, ctx)
        }
      },
      onEndDrag(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onEndDrag) {
          ref.current.onEndDrag(e, ctx)
        }
      },
      onMomentumBegin(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onMomentumBegin) {
          ref.current.onMomentumBegin(e, ctx)
        }
      },
      onMomentumEnd(e, ctx) {
        if (typeof ref.current !== 'function' && ref.current.onMomentumEnd) {
          ref.current.onMomentumEnd(e, ctx)
        }
      },
      onScroll(e, ctx) {
        if (typeof ref.current === 'function') {
          ref.current(e, ctx)
        } else if (ref.current.onScroll) {
          ref.current.onScroll(e, ctx)
        }
      },
    },
    deps,
  )
}
