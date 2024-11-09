import React from 'react'
import {View} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {i18n} from '@lingui/core'

import {decideShouldRoll} from '#/lib/custom-animations/util'
import {s} from '#/lib/styles'
import {formatCount} from '#/view/com/util/numeric/format'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'

const animationConfig = {
  duration: 400,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards' as FillMode,
}

const enteringUpKeyframe = [
  {opacity: 0, transform: 'translateY(18px)'},
  {opacity: 1, transform: 'translateY(0)'},
]

const enteringDownKeyframe = [
  {opacity: 0, transform: 'translateY(-18px)'},
  {opacity: 1, transform: 'translateY(0)'},
]

const exitingUpKeyframe = [
  {opacity: 1, transform: 'translateY(0)'},
  {opacity: 0, transform: 'translateY(-18px)'},
]

const exitingDownKeyframe = [
  {opacity: 1, transform: 'translateY(0)'},
  {opacity: 0, transform: 'translateY(18px)'},
]

export function CountWheel({
  likeCount,
  big,
  isLiked,
  hasBeenToggled,
}: {
  likeCount: number
  big?: boolean
  isLiked: boolean
  hasBeenToggled: boolean
}) {
  const t = useTheme()
  const shouldAnimate = !useReducedMotion() && hasBeenToggled
  const shouldRoll = decideShouldRoll(isLiked, likeCount)

  const countView = React.useRef<HTMLDivElement>(null)
  const prevCountView = React.useRef<HTMLDivElement>(null)

  const [prevCount, setPrevCount] = React.useState(likeCount)
  const prevIsLiked = React.useRef(isLiked)
  const formattedCount = formatCount(i18n, likeCount)
  const formattedPrevCount = formatCount(i18n, prevCount)

  React.useEffect(() => {
    if (isLiked === prevIsLiked.current) {
      return
    }

    const newPrevCount = isLiked ? likeCount - 1 : likeCount + 1
    if (shouldAnimate && shouldRoll) {
      countView.current?.animate?.(
        isLiked ? enteringUpKeyframe : enteringDownKeyframe,
        animationConfig,
      )
      prevCountView.current?.animate?.(
        isLiked ? exitingUpKeyframe : exitingDownKeyframe,
        animationConfig,
      )
      setPrevCount(newPrevCount)
    }
    prevIsLiked.current = isLiked
  }, [isLiked, likeCount, shouldAnimate, shouldRoll])

  if (likeCount < 1) {
    return null
  }

  return (
    <View>
      <View
        // @ts-expect-error is div
        ref={countView}>
        <Text
          testID="likeCount"
          style={[
            big ? a.text_md : {fontSize: 15},
            a.user_select_none,
            isLiked
              ? [a.font_bold, s.likeColor]
              : {color: t.palette.contrast_500},
          ]}>
          {formattedCount}
        </Text>
      </View>
      {shouldAnimate && (likeCount > 1 || !isLiked) ? (
        <View
          style={{position: 'absolute', opacity: 0}}
          aria-disabled={true}
          // @ts-expect-error is div
          ref={prevCountView}>
          <Text
            style={[
              big ? a.text_md : {fontSize: 15},
              a.user_select_none,
              isLiked
                ? [a.font_bold, s.likeColor]
                : {color: t.palette.contrast_500},
            ]}>
            {formattedPrevCount}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
