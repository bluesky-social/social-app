import {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'

import {useTheme} from '#/alf'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2'
import {PostControlButtonIcon} from '#/components/PostControls/PostControlButton'

// slower animation for small buttons
// I cannot explain why it feels better this way, 25ms makes a big difference
const animationConfigSmall = {
  duration: 575,
  easing: 'cubic-bezier(0.25, 0.5, 0.25, 1)',
  fill: 'forwards' as FillMode,
}

const animationConfigBig = {
  ...animationConfigSmall,
  duration: 550,
}

const keyframe = [
  {transform: 'scale(1)'},
  {transform: 'scale(1.5)'},
  {transform: 'scale(1)'},
]

const circle1Keyframe = [
  {opacity: 0, transform: 'scale(0)'},
  {opacity: 0.4},
  {transform: 'scale(1.5)'},
  {opacity: 0.2},
  {opacity: 0, transform: 'scale(2.0)'},
]

const circle2Keyframe = [
  {opacity: 0, transform: 'scale(0)'},
  {opacity: 0, transform: 'scale(0)'},
  {opacity: 1, transform: 'scale(1.0)'},
  {opacity: 1},
  {opacity: 0, transform: 'scale(1.9)'},
]

export function AnimatedLikeIcon({
  isLiked,
  big,
  hasBeenToggled,
}: {
  isLiked: boolean
  big?: boolean
  hasBeenToggled: boolean
}) {
  const t = useTheme()
  const size = big ? 22 : 18
  const shouldAnimate = !useReducedMotion() && hasBeenToggled
  const prevIsLiked = useRef(isLiked)

  const likeIconRef = useRef<HTMLDivElement>(null)
  const circle1Ref = useRef<HTMLDivElement>(null)
  const circle2Ref = useRef<HTMLDivElement>(null)

  const animationConfig = big ? animationConfigBig : animationConfigSmall

  useEffect(() => {
    if (prevIsLiked.current === isLiked) {
      return
    }

    if (shouldAnimate && isLiked) {
      likeIconRef.current?.animate?.(keyframe, animationConfig)
      circle1Ref.current?.animate?.(circle1Keyframe, animationConfig)
      circle2Ref.current?.animate?.(circle2Keyframe, animationConfig)
    }
    prevIsLiked.current = isLiked
  }, [shouldAnimate, isLiked, animationConfig])

  return (
    <View>
      {isLiked ? (
        // @ts-expect-error is div
        <View ref={likeIconRef}>
          <PostControlButtonIcon
            icon={HeartIconFilled}
            style={{color: t.palette.pink}}
          />
        </View>
      ) : (
        <PostControlButtonIcon
          icon={HeartIconOutline}
          style={[
            {color: t.palette.contrast_500},
            // TODO(iLynxcat): why is this here?
            {pointerEvents: 'none'},
          ]}
        />
      )}
      <View
        // @ts-expect-error is div
        ref={circle1Ref}
        style={{
          position: 'absolute',
          backgroundColor: t.palette.pink,
          top: 0,
          left: 0,
          width: size,
          height: size,
          zIndex: -1,
          pointerEvents: 'none',
          borderRadius: size / 2,
          opacity: 0,
        }}
      />
      <View
        // @ts-expect-error is div
        ref={circle2Ref}
        style={{
          position: 'absolute',
          backgroundColor: t.atoms.bg.backgroundColor,
          top: 0,
          left: 0,
          width: size,
          height: size,
          zIndex: -1,
          pointerEvents: 'none',
          borderRadius: size / 2,
          opacity: 0,
        }}
      />
    </View>
  )
}
