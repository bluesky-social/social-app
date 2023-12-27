import React from 'react'
import {
  AnimatedStyle,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useImageViewerControls} from 'state/imageViewer'

interface UseImageViewerDefaults {
  accessoriesVisible: boolean
  setAccessoriesVisible: React.Dispatch<React.SetStateAction<boolean>>
  opacity: SharedValue<number>
  backgroundOpacity: SharedValue<number>
  accessoryOpacity: SharedValue<number>
  onCloseViewer: () => void
  containerStyle: AnimatedStyle
  accessoryStyle: AnimatedStyle
  isScaled: boolean
  setIsScaled: React.Dispatch<React.SetStateAction<boolean>>
}

export const useImageViewerDefaults = (): UseImageViewerDefaults => {
  const {setVisible} = useImageViewerControls()

  const [isScaled, setIsScaled] = React.useState(false)
  const [accessoriesVisible, setAccessoriesVisible] = React.useState(true)

  const opacity = useSharedValue(1)
  const backgroundOpacity = useSharedValue(0)
  const accessoryOpacity = useSharedValue(0)

  const onCloseViewer = React.useCallback(() => {
    'worklet'

    accessoryOpacity.value = withTiming(0, {duration: 200})
    opacity.value = withTiming(0, {duration: 200}, () => {
      runOnJS(setVisible)(false)
    })
  }, [accessoryOpacity, opacity, setVisible])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity.value})`,
  }))

  const accessoryStyle = useAnimatedStyle(() => ({
    opacity: accessoryOpacity.value,
  }))

  return {
    accessoriesVisible,
    setAccessoriesVisible,
    opacity,
    backgroundOpacity,
    accessoryOpacity,
    onCloseViewer,
    containerStyle,
    accessoryStyle,
    isScaled,
    setIsScaled,
  }
}
