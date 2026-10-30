import {type ColorValue} from 'react-native'

export interface GestureAction {
  color: ColorValue
  action: () => void
  threshold: number
  icon: React.ElementType
}

export interface GestureActions {
  leftFirst?: GestureAction
  leftSecond?: GestureAction
  rightFirst?: GestureAction
  rightSecond?: GestureAction
}
