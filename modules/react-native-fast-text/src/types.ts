import {type Text as RNText, type TextProps as RNTextProps} from 'react-native'

export type TextProps<Props extends RNTextProps = RNTextProps> = Props & {
  /** Forces the original renderer, including for otherwise eligible text. */
  deopt?: boolean
  /** Refs use the original renderer to preserve its complete imperative API. */
  ref?: React.Ref<React.ComponentRef<typeof RNText>>
}

export type Options<Props> = {
  /**
   * Props that affect only the custom fallback. They are preserved on fallback
   * and omitted from the native label. Do not list visual or behavioral props.
   */
  ignoredProps?: readonly (keyof Props & string)[]
  /**
   * Whether this fallback uses a private text ancestor context rather than RN's.
   * Defaults to true for custom fallbacks. Omit unless its implementation is known.
   */
  needsAncestorGuard?: (props: Props) => boolean
}
