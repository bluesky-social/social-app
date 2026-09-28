import {Text as RNText, type TextProps as RNTextProps} from 'react-native'

import {type Options, type TextProps} from './types'

export type {TextProps} from './types'

/** Web keeps the existing renderer and never imports the native module. */
export function createText<Props extends RNTextProps>(
  Fallback: React.ComponentType<Props>,
  _options: Options<Props> = {},
) {
  return function Text({deopt: _deopt, ...props}: TextProps<Props>) {
    return <Fallback {...(props as Props)} />
  }
}

/** Web retains the supplied renderer; no native dependencies are imported. */
export const createTextRenderer = createText

export const Text = createText(RNText)
