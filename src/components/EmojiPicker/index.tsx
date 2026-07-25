import {type PickerProps, type RootProps, type TriggerProps} from './types'

export * from './types'

/**
 * Provides emoji picker context and wraps children in a {@link Menu.Root}.
 *
 * On emoji select, fires a `textInputWebEmitter` event (for web text inputs
 * that listen for emoji insertions) and forwards to the optional
 * `onEmojiSelect` callback.
 *
 * @platform web
 */
export function Root(_props: RootProps): React.ReactNode {
  throw new Error('EmojiPopup is not implemented on native')
}

/**
 * Passthrough to {@link Menu.Trigger}. Accepts the same render-prop children
 * pattern.
 *
 * @platform web
 */
export function Trigger(_props: TriggerProps): React.ReactNode {
  throw new Error('EmojiPopup is not implemented on native')
}

/**
 * Renders the emoji picker inside a Radix `DropdownMenu.Portal`.
 *
 * Holding Shift while selecting an emoji keeps the picker open for
 * multi-select. Otherwise the menu closes after each selection.
 *
 * Must be rendered inside a {@link Root}.
 *
 * @platform web
 */
export function Picker(_props: PickerProps): React.ReactNode {
  throw new Error('EmojiPopup is not implemented on native')
}
