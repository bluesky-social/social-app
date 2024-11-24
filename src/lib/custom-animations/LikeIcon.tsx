import {View} from 'react-native'
import Animated, {
  Keyframe,
  LayoutAnimationConfig,
  useReducedMotion,
} from 'react-native-reanimated'

import {s} from '#/lib/styles'
import {useTheme} from '#/alf'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2'

const keyframe = new Keyframe({
  0: {
    transform: [{scale: 1}],
  },
  10: {
    transform: [{scale: 0.7}],
  },
  40: {
    transform: [{scale: 1.2}],
  },
  100: {
    transform: [{scale: 1}],
  },
})

const circle1Keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{scale: 0}],
  },
  10: {
    opacity: 0.4,
  },
  40: {
    transform: [{scale: 1.5}],
  },
  95: {
    opacity: 0.4,
  },
  100: {
    opacity: 0,
    transform: [{scale: 1.5}],
  },
})

const circle2Keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{scale: 0}],
  },
  10: {
    opacity: 1,
  },
  40: {
    transform: [{scale: 0}],
  },
  95: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    transform: [{scale: 1.5}],
  },
})

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

  return (
    <View>
      <LayoutAnimationConfig skipEntering>
        {isLiked ? (
          <Animated.View
            entering={shouldAnimate ? keyframe.duration(300) : undefined}>
            <HeartIconFilled style={s.likeColor} width={size} />
          </Animated.View>
        ) : (
          <HeartIconOutline
            style={[{color: t.palette.contrast_500}, {pointerEvents: 'none'}]}
            width={size}
          />
        )}
        {isLiked && shouldAnimate ? (
          <>
            <Animated.View
              entering={circle1Keyframe.duration(300)}
              style={{
                position: 'absolute',
                backgroundColor: s.likeColor.color,
                top: 0,
                left: 0,
                width: size,
                height: size,
                zIndex: -1,
                pointerEvents: 'none',
                borderRadius: size / 2,
              }}
            />
            <Animated.View
              entering={circle2Keyframe.duration(300)}
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
              }}
            />
          </>
        ) : null}
      </LayoutAnimationConfig>
    </View>
  )
}
