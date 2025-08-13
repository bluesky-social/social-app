import {Text as RNText, type TextProps as RNTextProps} from 'react-native'

export type TextProps = RNTextProps & {
  emoji?: boolean
}

export function Text({children, ...rest}: TextProps) {
  // Emoji prop is ignored on web
  return <RNText {...rest}>{children}</RNText>
}

// Alias for compatibility
export {Text as Span}
