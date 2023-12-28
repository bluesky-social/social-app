import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {Pressable, StyleSheet, View, Text} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {MenuItemCommonProps} from 'zeego/lib/typescript/menu'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
import {HITSLOP_10} from 'lib/constants'

// Custom Dropdown Menu Components
// ==
export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuContent = DropdownMenu.Content

type ItemProps = React.ComponentProps<(typeof DropdownMenu)['Item']>
export const DropdownMenuItem = (props: ItemProps & {testID?: string}) => {
  const theme = useTheme()
  const [focused, setFocused] = React.useState(false)
  const backgroundColor = theme.colorScheme === 'dark' ? '#fff1' : '#0001'

  return (
    <DropdownMenu.Item
      {...props}
      style={StyleSheet.flatten([
        styles.item,
        focused && {backgroundColor: backgroundColor},
      ])}
      onFocus={() => {
        setFocused(true)
      }}
      onBlur={() => {
        setFocused(false)
      }}
    />
  )
}

// Types for Dropdown Menu and Items
export type DropdownItem = {
  label: string | 'separator'
  onPress?: () => void
  testID?: string
  icon?: {
    ios: MenuItemCommonProps['ios']
    android: string
    web: IconProp
  }
}
type Props = {
  items: DropdownItem[]
  testID?: string
  accessibilityLabel?: string
  accessibilityHint?: string
}

/* The `NativeDropdown` function uses native iOS and Android dropdown menus.
 * It also creates a animated custom dropdown for web that uses
 * Radix UI primitives under the hood
 * @prop {DropdownItem[]} items - An array of dropdown items
 * @prop {React.ReactNode} children - A custom dropdown trigger
 */
export function NativeDropdown({
  items,
  children,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: React.PropsWithChildren<Props>) {
  const pal = usePalette('default')
  const theme = useTheme()
  const dropDownBackgroundColor =
    theme.colorScheme === 'dark' ? pal.btn : pal.viewLight
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const {borderColor: separatorColor} =
    theme.colorScheme === 'dark' ? pal.borderDark : pal.border

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target

      if (!open) return
      if (!t) return
      if (!buttonRef.current || !menuRef.current) return

      if (
        t !== buttonRef.current &&
        !buttonRef.current.contains(t as Node) &&
        t !== menuRef.current &&
        !menuRef.current.contains(t as Node)
      ) {
        // prevent clicking through to links beneath dropdown
        // only applies to mobile web
        e.preventDefault()
        e.stopPropagation()

        // close menu
        setOpen(false)
      }
    }

    document.addEventListener('click', handler, true)
    return () => {
      document.removeEventListener('click', handler, true)
    }
  }, [open, setOpen])

  return (
    <DropdownMenuRoot open={open} onOpenChange={o => setOpen(o)}>
      <DropdownMenu.Trigger asChild>
        <Pressable
          ref={buttonRef as unknown as React.Ref<View>}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={({pressed}) => [{opacity: pressed ? 0.5 : 1}]}
          hitSlop={HITSLOP_10}>
          {children}
        </Pressable>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          ref={menuRef}
          style={
            StyleSheet.flatten([
              styles.content,
              dropDownBackgroundColor,
            ]) as React.CSSProperties
          }
          loop>
          {items.map((item, index) => {
            if (item.label === 'separator') {
              return (
                <DropdownMenu.Separator
                  key={getKey(item.label, index, item.testID)}
                  style={
                    StyleSheet.flatten([
                      styles.separator,
                      {backgroundColor: separatorColor},
                    ]) as React.CSSProperties
                  }
                />
              )
            }
            if (index > 1 && items[index - 1].label === 'separator') {
              return (
                <DropdownMenu.Group
                  key={getKey(item.label, index, item.testID)}>
                  <DropdownMenuItem
                    key={getKey(item.label, index, item.testID)}
                    onSelect={item.onPress}>
                    <Text
                      selectable={false}
                      style={[pal.text, styles.itemTitle]}>
                      {item.label}
                    </Text>
                    {item.icon && (
                      <FontAwesomeIcon
                        icon={item.icon.web}
                        size={20}
                        style={[pal.text]}
                      />
                    )}
                  </DropdownMenuItem>
                </DropdownMenu.Group>
              )
            }
            return (
              <DropdownMenuItem
                key={getKey(item.label, index, item.testID)}
                onSelect={item.onPress}>
                <Text selectable={false} style={[pal.text, styles.itemTitle]}>
                  {item.label}
                </Text>
                {item.icon && (
                  <FontAwesomeIcon
                    icon={item.icon.web}
                    size={20}
                    style={[pal.text]}
                  />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenuRoot>
  )
}

const getKey = (label: string, index: number, id?: string) => {
  if (id) {
    return id
  }
  return `${label}_${index}`
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  content: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
    marginTop: 6,
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 20,
    // @ts-ignore -web
    cursor: 'pointer',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 18,
  },
})
