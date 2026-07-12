import {type StyleProp, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Menu from '#/components/Menu'
import {type TriggerProps as MenuTriggerProps} from '#/components/Menu/types'
import {Text} from '#/components/Typography'
import {type AuxiliaryViewProps, type TriggerProps} from './types'

export {
  ContainerItem,
  type MenuControlProps as ContextMenuControlProps,
  Divider,
  Group,
  Item,
  ItemIcon,
  ItemRadio,
  ItemText,
  LabelText,
  Root,
  useMenuContext as useContextMenuContext,
  useMenuControl as useContextMenuControl,
} from '#/components/Menu'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

// native only
export function AuxiliaryView({}: AuxiliaryViewProps) {
  return null
}

/*
 * On web the context menu is just a Menu; contentLabel, onTap, style, and
 * swipeGesture only apply to the native press-and-hold presentation.
 */
export function Trigger({children, label, hint, role}: TriggerProps) {
  return (
    <Menu.Trigger label={label} hint={hint} role={role}>
      {/*
       * Menu supplies the same web-arm child props shape as ContextMenu's
       * TriggerChildProps; only the native arms of the two unions differ,
       * and those never occur here.
       */}
      {children as unknown as MenuTriggerProps['children']}
    </Menu.Trigger>
  )
}

export function Outer({
  children,
  label,
  align: _align,
  style,
  onCloseAutoFocus,
}: {
  children: React.ReactNode
  label?: string
  /**
   * Native positions the menu against the message bubble explicitly; the web
   * dropdown is anchored by radix, so this is accepted only for parity.
   */
  align?: 'left' | 'right'
  style?: StyleProp<ViewStyle>
  onCloseAutoFocus?: (event: Event) => void
}) {
  const t = useTheme()
  return (
    <Menu.Outer style={style} onCloseAutoFocus={onCloseAutoFocus}>
      {label ? (
        <Text
          numberOfLines={1}
          style={[
            a.pl_sm,
            a.pt_md,
            a.pr_lg,
            a.pb_md,
            a.text_xs,
            t.atoms.text_contrast_medium,
          ]}>
          {label}
        </Text>
      ) : null}
      {children}
    </Menu.Outer>
  )
}
