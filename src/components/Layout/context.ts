import {createContext} from 'react'

export const ScrollbarOffsetContext = createContext({
  isWithinOffsetView: false,
})
ScrollbarOffsetContext.displayName = 'ScrollbarOffsetContext'
