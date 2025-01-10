import {createContext} from 'react'
import {Gesture} from 'react-native-gesture-handler'

// Not really used but serves as a fallback for types.
const noopGesture = Gesture.Native()

export const TrendingGestureContext = createContext(noopGesture)
