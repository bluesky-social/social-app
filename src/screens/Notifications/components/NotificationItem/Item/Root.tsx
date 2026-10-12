import {createContext, useContext, useState} from 'react'
import {
  type AccessibilityActionEvent,
  type AccessibilityProps,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'

import {WebAuxClickWrapper} from '#/view/com/util/WebAuxClickWrapper'
import {atoms as a, useTheme} from '#/alf'
import {useLink} from '#/components/Link'
import {SubtleHover} from '#/components/SubtleHover'

type ItemContextValue = {
  isRead: boolean
}

const ItemContext = createContext<ItemContextValue>({isRead: true})

/**
 * Read state of the enclosing `Item.Root`, for parts whose styling differs
 * on the unread tint.
 */
export function useItemContext() {
  return useContext(ItemContext)
}

/**
 * A notification row: the avatar column, `Item.Content`, and an optional
 * `Item.Trailing`, laid out horizontally. Pressing anywhere outside a nested
 * control navigates to `href`.
 *
 * This is a plain `Pressable` rather than a `Link`, so on web the row isn't
 * an `<a>`. Rows contain names, rich text links, buttons and menus, none of
 * which can be nested inside an anchor.
 */
export function Root({
  href,
  isRead,
  label,
  hint,
  accessible = true,
  accessibilityActions,
  onAccessibilityAction,
  onBeforePress,
  style,
  testID,
  children,
}: {
  href: string
  isRead: boolean
  /**
   * A single plain-text description of the whole row, read by screen readers
   * when `accessible` is true.
   */
  label?: string
  /**
   * Where pressing the row goes, e.g. "Opens the post".
   */
  hint?: string
  /**
   * Set to false for rows with their own interactive controls (e.g. post
   * actions), so that screen readers can reach them individually.
   */
  accessible?: boolean
  accessibilityActions?: AccessibilityProps['accessibilityActions']
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
  onBeforePress?: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  children: React.ReactNode
}) {
  const t = useTheme()
  const [hover, setHover] = useState(false)
  const {onPress} = useLink({to: href, displayText: ''})

  return (
    <ItemContext.Provider value={{isRead}}>
      <WebAuxClickWrapper>
        <Pressable
          testID={testID}
          accessible={accessible}
          accessibilityRole="link"
          accessibilityLabel={label}
          accessibilityHint={hint}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
          onPress={event => {
            onBeforePress?.()
            onPress(event)
          }}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          style={[
            a.flex_row,
            a.align_start,
            a.gap_md,
            a.px_lg,
            a.py_md,
            isRead ? t.atoms.bg : {backgroundColor: t.palette.primary_25},
            style,
          ]}>
          <SubtleHover hover={hover} />
          {children}
        </Pressable>
      </WebAuxClickWrapper>
    </ItemContext.Provider>
  )
}

/**
 * The main column of a row. Defaults to a tight vertical stack; rows with a
 * separate action or card block pass a larger gap.
 */
export function Content({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  return <View style={[a.flex_1, a.gap_xs, style]}>{children}</View>
}

/**
 * Right-hand slot for a button or chevron, aligned to the top of the row.
 */
export function Trailing({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  return <View style={[a.flex_shrink_0, style]}>{children}</View>
}
