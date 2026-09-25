import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'

import {decideShouldRoll} from '#/lib/custom-animations/util'

const animationConfig = {
  duration: 250,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards' as FillMode,
}

const FILTER_BLUR_MAX = 'blur(0.15em)'
const FILTER_BLUR_NONE = 'blur(0)'

const enteringUpKeyframe = [
  {opacity: 0, transform: 'translateY(10px)', filter: FILTER_BLUR_MAX},
  {opacity: 1, transform: 'translateY(0)', filter: FILTER_BLUR_NONE},
]

const enteringDownKeyframe = [
  {opacity: 0, transform: 'translateY(-10px)', filter: FILTER_BLUR_MAX},
  {opacity: 1, transform: 'translateY(0)', filter: FILTER_BLUR_NONE},
]

const exitingUpKeyframe = [
  {opacity: 1, transform: 'translateY(0)', filter: FILTER_BLUR_NONE},
  {opacity: 0, transform: 'translateY(-10px)', filter: FILTER_BLUR_MAX},
]

const exitingDownKeyframe = [
  {opacity: 1, transform: 'translateY(0)', filter: FILTER_BLUR_NONE},
  {opacity: 0, transform: 'translateY(10px)', filter: FILTER_BLUR_MAX},
]

export function CountWheel({
  count,
  isToggled,
  hasBeenToggled,
  renderCount,
}: {
  count: number
  isToggled: boolean
  hasBeenToggled: boolean
  renderCount: (props: {count: number}) => React.ReactNode
}) {
  const shouldAnimate = !useReducedMotion() && hasBeenToggled
  const shouldRoll = decideShouldRoll(isToggled, count)

  const countView = useRef<HTMLDivElement>(null)
  const prevCountView = useRef<HTMLDivElement>(null)

  const [prevCount, setPrevCount] = useState(count)
  const prevIsToggled = useRef(isToggled)

  useEffect(() => {
    if (isToggled === prevIsToggled.current) {
      return
    }

    const newPrevCount = isToggled ? count - 1 : count + 1
    if (shouldAnimate && shouldRoll) {
      countView.current?.animate?.(
        isToggled ? enteringUpKeyframe : enteringDownKeyframe,
        animationConfig,
      )
      prevCountView.current?.animate?.(
        isToggled ? exitingUpKeyframe : exitingDownKeyframe,
        animationConfig,
      )
      setPrevCount(newPrevCount)
    }
    prevIsToggled.current = isToggled
  }, [isToggled, count, shouldAnimate, shouldRoll])

  if (count < 1) {
    return null
  }

  return (
    <View>
      <View
        // @ts-expect-error is div
        ref={countView}>
        {renderCount({count})}
      </View>
      {shouldAnimate && (count > 1 || !isToggled) ? (
        <View
          style={{position: 'absolute', opacity: 0}}
          aria-disabled={true}
          // @ts-expect-error is div
          ref={prevCountView}>
          {renderCount({count: prevCount})}
        </View>
      ) : null}
    </View>
  )
}
