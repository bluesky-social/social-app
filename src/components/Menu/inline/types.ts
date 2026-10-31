import type * as Dialog from '#/components/Dialog'
import {type NanoGlyphName} from '#/components/icons/glyphMaps'

export type InlineRootProps = React.PropsWithChildren<{
  control: Dialog.DialogControlProps
  /** The rendered `Menu.Trigger`, hosted as the menu's anchor. */
  trigger: React.ReactElement
}>

export type InlineSectionProps = React.PropsWithChildren<{
  /** From a `Menu.LabelText` directly above the group. */
  title?: string
  /**
   * Whether to separate this section from the one above. Android only: iOS
   * separates sections itself.
   */
  divider?: boolean
}>

/**
 * An item's place among all the items of an inline menu. Counts each element
 * in a `Menu.Outer` or `Menu.Group` as one item, so an item inside a custom
 * component that renders several, or none, throws the count off.
 */
export type InlineItemPosition = {
  index: number
  count: number
}

export type InlineItemProps = {
  title: string
  /** The glyph, and so native symbol, of the item's `Menu.ItemIcon`. */
  glyph?: NanoGlyphName
  /** Set for radio items, i.e. those with a `Menu.ItemRadio`. */
  selected?: boolean
  destructive: boolean
  disabled: boolean
  /**
   * Set on the native row, for E2E tests. iOS may not pass it on to the
   * system menu.
   */
  testID?: string
  onPress: () => void
}
