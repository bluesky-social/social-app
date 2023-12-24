import React from 'react'
import {ViewImage} from '@atproto/api/dist/client/types/app/bsky/embed/images'
import {MeasuredDimensions, SharedValue} from 'react-native-reanimated'

export interface IImageViewerContext {
  state: IImageViewerState
  dispatch: React.Dispatch<IImageViewerAction>
}

export interface IImageViewerState {
  images: ViewImage[]
  index: number
  isVisible: boolean
  measurement: MeasuredDimensions | undefined
  hideFooter?: boolean
}

export interface IImageViewerItemProps {
  image: ViewImage
  index: number
  initialIndex: number
  setIsScaled?: React.Dispatch<React.SetStateAction<boolean>>
  setAccessoriesVisible: React.Dispatch<React.SetStateAction<boolean>>
  onCloseViewer: () => void
  opacity: SharedValue<number>
  accessoryOpacity: SharedValue<number>
  backgroundOpacity: SharedValue<number>
}

export type IImageViewerAction =
  | {
      type: 'setImages'
      payload: ViewImage[]
    }
  | {
      type: 'setIndex'
      payload: number
    }
  | {
      type: 'setVisible'
      payload: boolean
    }
  | {
      type: 'setMeasurement'
      payload: MeasuredDimensions
    }
  | {
      type: 'setState'
      payload: Partial<IImageViewerState>
    }
