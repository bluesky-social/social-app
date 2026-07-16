import {type Dispatch, type SetStateAction} from 'react'
import {type View} from 'react-native'

import {type KeyboardActivationRegistrar} from './KeyboardActivation'

export type FeedKeyboardNavOptions = {
  /**
   * Compute this based on item types (e.g. only root posts).
   */
  focusableIndices: number[]
  /**
   * Pass false when the list is in an inactive tab.
   */
  active?: boolean
}

export type FeedKeyboardNavResult = {
  focusedIndex: number
  setFocusedIndex: Dispatch<SetStateAction<number>>
  itemRef: (index: number) => (el: View | null) => void
  itemActivation: (index: number) => KeyboardActivationRegistrar
}
