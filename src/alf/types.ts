import {StyleProp, ViewStyle, TextStyle} from 'react-native'

type LiteralToCommon<T extends PropertyKey> = T extends number
  ? number
  : T extends string
  ? string
  : T extends symbol
  ? symbol
  : never

/**
 * @see https://stackoverflow.com/questions/68249999/use-as-const-in-typescript-without-adding-readonly-modifiers
 */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K] extends PropertyKey
    ? LiteralToCommon<T[K]>
    : Mutable<T[K]>
}

export type TextStyleProp = {
  style?: StyleProp<TextStyle>
}

export type ViewStyleProp = {
  style?: StyleProp<ViewStyle>
}
