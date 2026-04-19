import {type ReactNode} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'

import {tag} from './registry'
import {type PreviewContent} from './types'

export type TriggerProps = {
  preview?: PreviewContent
  /** Fires when the user taps the expanded preview to "commit" into it. */
  onPreviewPress?: () => void
  /** Border radius of the thumbnail being wrapped. Used natively to clip the
   *  targeted-preview lift animation. */
  borderRadius?: number
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

/**
 * Sentinel: does not render. `Root` reads props + children off this element
 * and hosts `children` inside the native context-menu view.
 */
function TriggerImpl(_: TriggerProps): null {
  return null
}

export const Trigger = tag(TriggerImpl, 'trigger')
