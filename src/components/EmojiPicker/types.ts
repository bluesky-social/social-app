import {type DialogControlProps} from '../Dialog'
import {type TriggerProps as MenuTriggerProps} from '../Menu/types'

export type Emoji = {
  aliases?: string[]
  emoticons: string[]
  id: string
  keywords: string[]
  name: string
  native: string
  shortcodes?: string
  unified: string
  skin?: number
}

type FocusableElement = {focus: () => void}

export interface RootProps {
  children: React.ReactNode
  control?: DialogControlProps
  onEmojiSelect?: (emoji: Emoji) => void
  preloadOnMount?: boolean
  nextFocusRef?:
    | React.RefObject<FocusableElement | null>
    | (() => FocusableElement | null | undefined)
}

export interface TriggerProps extends MenuTriggerProps {}

export interface PickerProps {}
