import React from 'react'
import {Animated, StyleProp, View, ViewStyle} from 'react-native'

import {useAnimatedValue} from '#/lib/hooks/useAnimatedValue'

type CreateAnimFn = (interp: Animated.Value) => Animated.CompositeAnimation
type FinishCb = () => void

interface TriggeredAnimation {
  start: CreateAnimFn
  style: (
    interp: Animated.Value,
  ) => Animated.WithAnimatedValue<StyleProp<ViewStyle>>
}

export interface TriggerableAnimatedRef {
  trigger: (anim: TriggeredAnimation, onFinish?: FinishCb) => void
}

type TriggerableAnimatedProps = React.PropsWithChildren<{}>

type PropsInner = TriggerableAnimatedProps & {
  anim: TriggeredAnimation
  onFinish: () => void
}

export const TriggerableAnimated = React.forwardRef<
  TriggerableAnimatedRef,
  TriggerableAnimatedProps
>(function TriggerableAnimatedImpl({children, ...props}, ref) {
  const [anim, setAnim] = React.useState<TriggeredAnimation | undefined>(
    undefined,
  )
  const [finishCb, setFinishCb] = React.useState<FinishCb | undefined>(
    undefined,
  )
  React.useImperativeHandle(ref, () => ({
    trigger(v: TriggeredAnimation, cb?: FinishCb) {
      setFinishCb(() => cb) // note- wrap in function due to react behaviors around setstate
      setAnim(v)
    },
  }))
  const onFinish = () => {
    finishCb?.()
    setAnim(undefined)
    setFinishCb(undefined)
  }
  return (
    <View key="triggerable">
      {anim ? (
        <AnimatingView anim={anim} onFinish={onFinish} {...props}>
          {children}
        </AnimatingView>
      ) : (
        children
      )}
    </View>
  )
})

function AnimatingView({
  anim,
  onFinish,
  children,
}: React.PropsWithChildren<PropsInner>) {
  const interp = useAnimatedValue(0)
  React.useEffect(() => {
    anim?.start(interp).start(() => {
      onFinish()
    })
  })
  const animStyle = anim?.style(interp)
  return <Animated.View style={animStyle}>{children}</Animated.View>
}
