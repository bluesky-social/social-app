import {createContext, useContext} from 'react'
import {
  type AccessibilityActionEvent,
  type AccessibilityProps,
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'

import {WebAuxClickWrapper} from '#/view/com/util/WebAuxClickWrapper'
import {atoms as a, select, type Theme, useTheme} from '#/alf'
import {useLink} from '#/components/Link'
import {SubtleHover} from '#/components/SubtleHover'
import {SuppressHoverContext, useRowHover} from './hover'

/**
 * A row's padding before the avatar. With the avatar and `ROW_GAP`, it puts
 * the text where a feed post's is. Section headers use it too, to line up
 * with the avatars.
 */
export const ROW_PADDING_START = 18

/**
 * The space between a row's avatar and its content.
 */
export const ROW_GAP = 10

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
 * The background colour of a row, tinted while unread. The dark themes use
 * design's own tints, which aren't in the palette: `primary_25` barely shows
 * against their backgrounds.
 */
export function useRowBackgroundColor(isRead: boolean) {
  const t = useTheme()
  if (isRead) return t.atoms.bg.backgroundColor
  return select(t.name, {
    light: t.palette.primary_25,
    dim: '#071F40',
    dark: '#202F43',
  })
}

/**
 * The colour of a border on or beside a row. The dark theme's unread tint is
 * about as light as `border_contrast_low`, which vanishes against it, so
 * there a border that touches an unread row is a step stronger.
 */
export function getRowBorderColor(t: Theme, touchesUnread: boolean) {
  return touchesUnread && t.name === 'dark'
    ? t.atoms.border_contrast_medium.borderColor
    : t.atoms.border_contrast_low.borderColor
}

/**
 * The background colour of the enclosing `Item.Root`, tinted while unread,
 * for parts that have to blend into it.
 */
export function useItemBackgroundColor() {
  const {isRead} = useItemContext()
  return useRowBackgroundColor(isRead)
}

/**
 * A notification row: the avatar column, `Item.Content`, and an optional
 * `Item.Trailing`, laid out horizontally. Pressing anywhere outside a nested
 * control navigates to `href`, unless `onPress` handles it instead.
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
  accessibilityRole = 'link',
  expanded,
  accessibilityActions,
  onAccessibilityAction,
  onBeforePress,
  onPress: onPressProp,
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
  /**
   * `button` for rows that do something other than follow `href` when
   * pressed.
   */
  accessibilityRole?: 'link' | 'button'
  /**
   * Whether the row is expanded, for rows that expand.
   */
  expanded?: boolean
  accessibilityActions?: AccessibilityProps['accessibilityActions']
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void
  onBeforePress?: () => void
  /**
   * Handles presses instead of following `href`, e.g. to expand the row.
   */
  onPress?: (event: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  testID?: string
  children: React.ReactNode
}) {
  const backgroundColor = useRowBackgroundColor(isRead)
  const {hover, hoverProps, setSuppressed} = useRowHover()
  const {onPress: followLink} = useLink({to: href, displayText: ''})

  return (
    <ItemContext.Provider value={{isRead}}>
      <SuppressHoverContext.Provider value={setSuppressed}>
        <WebAuxClickWrapper>
          <Pressable
            testID={testID}
            accessible={accessible}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={label}
            accessibilityHint={hint}
            aria-expanded={expanded}
            accessibilityActions={accessibilityActions}
            onAccessibilityAction={onAccessibilityAction}
            onPress={event => {
              if (onPressProp) {
                onPressProp(event)
                return
              }
              onBeforePress?.()
              followLink(event)
            }}
            {...hoverProps}
            style={[
              a.flex_row,
              a.align_start,
              /*
               * As a button it's a `<button>` on web, which a block parent
               * shrinks to fit its content rather than stretching
               */
              a.w_full,
              a.pr_lg,
              a.py_md,
              {gap: ROW_GAP, paddingLeft: ROW_PADDING_START, backgroundColor},
              style,
            ]}>
            <SubtleHover hover={hover} />
            {children}
          </Pressable>
        </WebAuxClickWrapper>
      </SuppressHoverContext.Provider>
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
 * Right-hand slot for a button or images, aligned to the top of the row.
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
