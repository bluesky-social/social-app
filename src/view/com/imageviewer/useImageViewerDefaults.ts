import React from 'react'
import {
  AnimatedStyle,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  useImageViewerControls,
  useImageViewerState,
} from 'state/imageViewer.tsx'

interface UseImageViewerDefaults {
  accessoriesVisible: boolean
  setAccessoriesVisible: React.Dispatch<React.SetStateAction<boolean>>
  opacity: SharedValue<number>
  backgroundOpacity: SharedValue<number>
  accessoryOpacity: SharedValue<number>
  onCloseViewer: () => void
  containerStyle: AnimatedStyle
  accessoryStyle: AnimatedStyle
}

export const useImageViewerDefaults = (): UseImageViewerDefaults => {
  const {isVisible} = useImageViewerState()
  const {setVisible} = useImageViewerControls()

  const [accessoriesVisible, setAccessoriesVisible] = React.useState(true)

  const opacity = useSharedValue(0)
  const backgroundOpacity = useSharedValue(0)
  const accessoryOpacity = useSharedValue(0)

  // Reset the viewer whenever it closes
  React.useEffect(() => {
    if (isVisible) return

    opacity.value = 1
    backgroundOpacity.value = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  const onCloseViewer = React.useCallback(() => {
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
  }
}
