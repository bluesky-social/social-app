import React from 'react'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {runOnJS} from 'react-native-reanimated'

export function BackGestureDetector({
  onBack,
  children,
}: {
  onBack: () => void
  children: React.ReactNode
}) {
  const swipeGesture = Gesture.Pan()
    .maxPointers(1)
    .onEnd(({translationX, translationY, velocityX}) => {
      if (
        // Make sure it isn't a scrollview
        translationX > translationY &&
        translationY <= 10 &&
        translationX >= 25 &&
        // Shouldn't be a really slow swipe
        velocityX >= 300
      ) {
        runOnJS(onBack)()
      }
    })

  return <GestureDetector gesture={swipeGesture}>{children}</GestureDetector>
}
