import {type DialogControlProps} from '../Dialog'
import {type TriggerProps as MenuTriggerProps} from '../Menu/types'

/**
 * Represents an emoji selected from the picker. Sourced from the `emoji-mart`
 * library's selection data.
 */
export type Emoji = {
  aliases?: string[]
  emoticons: string[]
  id: string
  keywords: string[]
  name: string
  /** The native unicode character for the emoji, e.g. "😀" */
  native: string
  shortcodes?: string
  /** The unicode codepoint, e.g. "1f600" */
  unified: string
  /** Skin tone variant (1–6), if applicable */
  skin?: number
}

type FocusableElement = {focus: () => void}

export interface RootProps {
  children: React.ReactNode
  control?: DialogControlProps
  /**
   * Called when the user selects an emoji. On web this fires in addition to
   * the `textInputWebEmitter` event, so callers that only need the text
   * insertion can omit this.
   */
  onEmojiSelect?: (emoji: Emoji) => void
  /**
   * When `true` (default), preloads emoji data as soon as the component
   * mounts so the picker opens instantly. Set to `false` to defer loading
   * until the picker is actually opened.
   */
  preloadOnMount?: boolean
  /**
   * Element to return focus to when the picker closes. Accepts either a ref
   * or a getter function.
   */
  nextFocusRef?:
    | React.RefObject<FocusableElement | null>
    | (() => FocusableElement | null | undefined)
}

/**
 * Props for the trigger button that opens the emoji picker. Extends
 * {@link MenuTriggerProps} — accepts the same render-prop children pattern.
 */
export interface TriggerProps extends MenuTriggerProps {}

/**
 * Props for the picker panel itself.
 */
export interface PickerProps {
  /**
   * When `true`, the picker will remain open after selecting an emoji when the Shift key is held down.
   *
   * @default true
   */
  keepOpenWhenShiftHeld?: boolean
}
