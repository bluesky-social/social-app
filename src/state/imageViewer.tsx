import React from 'react'
import {ViewImage} from '@atproto/api/dist/client/types/app/bsky/embed/images'
import {MeasuredDimensions} from 'react-native-reanimated'
import {useNonReactiveCallback} from 'lib/hooks/useNonReactiveCallback.ts'

interface ImageViewerState {
  images: ViewImage[]
  initialIndex: number
  initialDimensions: {width: number; height: number}
  isVisible: boolean
  measurement: MeasuredDimensions | undefined
  hideFooter?: boolean
}

interface ImageViewerControls {
  setState: (state: Partial<ImageViewerState>) => void
  setVisible: (isVisible: boolean) => void
}

const ImageViewerContext = React.createContext<ImageViewerState>(
  {} as ImageViewerState,
)

const ImageViewerControlsContext = React.createContext<ImageViewerControls>(
  {} as ImageViewerControls,
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<ImageViewerState>({
    images: [],
    initialIndex: 0,
    initialDimensions: {width: 0, height: 0},
    isVisible: false,
    measurement: undefined,
  })

  const setViewerState = useNonReactiveCallback(
    (state: Partial<ImageViewerState>) => {
      setState(prev => ({
        ...prev,
        hideFooter: false,
        measurement: undefined,
        ...state,
      }))
    },
  )

  const setViewerVisible = useNonReactiveCallback((isVisible: boolean) => {
    setState(prev => ({...prev, isVisible}))
  })

  const methods = React.useMemo(
    () => ({
      setState: setViewerState,
      setVisible: setViewerVisible,
    }),
    [setViewerState, setViewerVisible],
  )

  return (
    <ImageViewerContext.Provider value={state}>
      <ImageViewerControlsContext.Provider value={methods}>
        {children}
      </ImageViewerControlsContext.Provider>
    </ImageViewerContext.Provider>
  )
}

export function useImageViewerState() {
  return React.useContext(ImageViewerContext)
}

export function useImageViewerControls() {
  return React.useContext(ImageViewerControlsContext)
}
