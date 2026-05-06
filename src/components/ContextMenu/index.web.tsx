import {type StyleProp, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import * as Menu from '#/components/Menu'
import {type ItemProps} from '#/components/Menu/types'
import {Text} from '#/components/Typography'
import {type AuxiliaryViewProps} from './types'

export {
  ContainerItem,
  type MenuControlProps as ContextMenuControlProps,
  Divider,
  Group,
  ItemIcon,
  ItemRadio,
  ItemText,
  LabelText,
  Root,
  Trigger,
  useMenuContext as useContextMenuContext,
  useMenuControl as useContextMenuControl,
} from '#/components/Menu'

export function Item({style, ...props}: ItemProps) {
  return <Menu.Item {...props} style={[a.px_2xl, style]} />
}

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

// native only
export function AuxiliaryView({}: AuxiliaryViewProps) {
  return null
}

export function Outer({
  children,
  label,
  style,
}: {
  children: React.ReactNode
  label?: string
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <Menu.Outer style={style}>
      {label ? (
        <Text
          numberOfLines={1}
          style={[
            a.pl_md,
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
