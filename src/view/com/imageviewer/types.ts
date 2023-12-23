import React from 'react'
import {ViewImage} from '@atproto/api/dist/client/types/app/bsky/embed/images'
import {MeasuredDimensions} from 'react-native-reanimated'

export interface IImageViewerContext {
  state: IImageViewerState
  dispatch: React.Dispatch<IImageViewerAction>
}

export interface IImageViewerState {
  images: ViewImage[] | null
  index: number
  isVisible: boolean
  measurement: MeasuredDimensions | null
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
