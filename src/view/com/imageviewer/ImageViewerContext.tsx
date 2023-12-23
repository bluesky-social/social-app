import React from 'react'
import {IImageViewerContext} from './types'

export const ImageViewerContext = React.createContext<IImageViewerContext>(
  {} as IImageViewerContext,
)

export const useImageViewer = () => React.useContext(ImageViewerContext)
