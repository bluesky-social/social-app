import React from 'react'
import {View} from 'react-native'

import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Props as SVGIconProps} from '#/components/icons/common'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '../icons/Chevron'
import {
  ContentProps,
  ItemProps,
  RootProps,
  TriggerProps,
  ValueProps,
} from './types'

export function Root(props: RootProps) {
  return null
}

export function Trigger({children, label}: TriggerProps) {
  return null
}

export function Value(props: ValueProps) {
  return null
}

export function Icon() {
  const t = useTheme()
  return <ChevronDownIcon style={[t.atoms.text]} size="xs" />
}

export function Content<T>({items, renderItem}: ContentProps<T>) {
  const t = useTheme()
  return null
}

const ItemContext = React.createContext<{
  hovered: boolean
  focused: boolean
  pressed: boolean
}>({
  hovered: false,
  focused: false,
  pressed: false,
})

export function useItemContext() {
  return React.useContext(ItemContext)
}

export const Item = React.forwardRef<View, ItemProps>(
  ({value, children}, ref) => {
    return null
  },
)
Item.displayName = 'SelectItem'

export function ItemText({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  return null
}

export function ItemIndicator({
  icon,
}: {
  icon?: React.ComponentType<SVGIconProps>
}) {
  return null
}
