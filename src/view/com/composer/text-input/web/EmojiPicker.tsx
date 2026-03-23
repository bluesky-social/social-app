export type Emoji = {
  aliases?: string[]
  emoticons: string[]
  id: string
  keywords: string[]
  name: string
  native: string
  shortcodes?: string
  unified: string
}

export interface EmojiPickerPosition {
  top: number
  left: number
  right: number
  bottom: number
  nextFocusRef: React.MutableRefObject<HTMLElement> | null
}

export interface EmojiPickerState {
  isOpen: boolean
  pos: EmojiPickerPosition
}

interface IProps {
  state: EmojiPickerState
  close: () => void
  /**
   * If `true`, overrides position and ensures picker is pinned to the top of
   * the target element.
   */
  pinToTop?: boolean
}

export function EmojiPicker(_opts: IProps) {
  return null
}
