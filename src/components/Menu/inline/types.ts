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
