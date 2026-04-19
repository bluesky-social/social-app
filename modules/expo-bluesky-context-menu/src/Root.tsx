import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'

import NativeView from './ExpoContextMenuNativeView'
import {type MenuProps} from './Menu'
import {type MenuItemProps} from './MenuItem'
import {type MenuItemIconProps} from './MenuItemIcon'
import {type MenuItemTextProps} from './MenuItemText'
import {kindOf} from './registry'
import {type TriggerProps} from './Trigger'
import {type MenuItemSpec} from './types'

export type RootProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function Root({children, style}: RootProps) {
  const {trigger, menu} = collectTriggerAndMenu(children)

  const {menuItems, selectById} = useMemo(() => {
    const items: MenuItemSpec[] = []
    const map: Record<string, () => void> = {}
    if (menu) {
      Children.forEach(menu.props.children, child => {
        if (!isValidElement(child)) return
        if (kindOf(child.type) !== 'item') return
        const spec = specFromItem(child as ReactElement<MenuItemProps>)
        if (!spec) return
        items.push(spec.item)
        map[spec.item.id] = spec.onSelect
      })
    }
    return {menuItems: items, selectById: map}
  }, [menu])

  const handleItemPress = useCallback(
    (e: {nativeEvent: {id: string}}) => {
      selectById[e.nativeEvent.id]?.()
    },
    [selectById],
  )

  const onPreviewPress = trigger?.props.onPreviewPress
  const handlePreviewPress = useCallback(() => {
    onPreviewPress?.()
  }, [onPreviewPress])

  if (!trigger) {
    return <>{children}</>
  }

  return (
    <NativeView
      preview={trigger.props.preview}
      menuItems={menuItems}
      previewCornerRadius={trigger.props.borderRadius ?? 0}
      onItemPress={handleItemPress}
      onPreviewPress={handlePreviewPress}
      style={[style, trigger.props.style]}>
      {trigger.props.children}
    </NativeView>
  )
}

// -----------------------------------------------------------------------------

type Collected = {
  trigger?: ReactElement<TriggerProps>
  menu?: ReactElement<MenuProps>
}

function collectTriggerAndMenu(children: ReactNode): Collected {
  const result: Collected = {}
  Children.forEach(children, child => {
    if (!isValidElement(child)) return
    const kind = kindOf(child.type)
    if (kind === 'trigger') result.trigger = child as ReactElement<TriggerProps>
    else if (kind === 'menu') result.menu = child as ReactElement<MenuProps>
  })
  return result
}

function specFromItem(
  element: ReactElement<MenuItemProps>,
): {item: MenuItemSpec; onSelect: () => void} | null {
  const {id, destructive, disabled, onSelect, children} = element.props
  let label = ''
  let icon: MenuItemSpec['icon']
  Children.forEach(children, child => {
    if (!isValidElement(child)) return
    const kind = kindOf(child.type)
    if (kind === 'item-text') {
      const text = (child as ReactElement<MenuItemTextProps>).props.children
      if (typeof text === 'string') label = text
    } else if (kind === 'item-icon') {
      const iconSource = (child as ReactElement<MenuItemIconProps>).props.icon
      if (iconSource?.svgPaths?.length) {
        icon = {
          paths: iconSource.svgPaths,
          viewBox: iconSource.svgViewBox,
          strokeWidth: iconSource.svgStrokeWidth,
        }
      }
    }
  })
  if (!label) return null
  return {
    item: {id, label, destructive, disabled, icon},
    onSelect,
  }
}
