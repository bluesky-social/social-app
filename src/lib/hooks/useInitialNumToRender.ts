import React from 'react'
import {useWindowDimensions} from 'react-native'

const MIN_POST_HEIGHT = 100

export function useInitialNumToRender(minItemHeight: number = MIN_POST_HEIGHT) {
  const {height: screenHeight} = useWindowDimensions()

  return React.useMemo(
    () => Math.ceil(screenHeight / minItemHeight) + 1,
    [screenHeight, minItemHeight],
  )
}
