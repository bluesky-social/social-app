import {Fragment, isValidElement} from 'react'
import {type GestureResponderEvent} from 'react-native'
import {type I18n} from '@lingui/core'
import {
  type NativeStackHeaderItem,
  type NativeStackHeaderItemButton,
} from '@react-navigation/native-stack'

import {
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
} from '#/components/Button'
import {getText, isPlainText} from '#/components/Layout/Header/native/getText'
import {getHeaderRole} from '#/components/Layout/Header/native/roles'

type PlatformIconIOS = NonNullable<NativeStackHeaderItemButton['icon']>

/**
 * Maps an icon component to a native bar button icon, or `undefined` if it has
 * none, in which case the button falls back to a custom item.
 */
export type IconResolver = (icon: unknown) => PlatformIconIOS | undefined

/**
 * A `Layout.Header` written as JSX, read into what a native header needs.
 */
export type NativeHeaderSpec = {
  /** The header has a `BackButton`. */
  back?: {onPress?: ButtonProps['onPress']}
  /** The header has a `MenuButton`. */
  menu: boolean
  /** Plain title text, if the title can be shown as a native title. */
  title: string
  /**
   * The title area as React, when it can't be shown natively (a subtitle, or
   * anything other than plain text).
   */
  customTitle?: React.ReactNode
  /** Items between the back/menu button and the title. */
  leftItems: NativeStackHeaderItem[]
  /** Items after the title, in visual order (left to right). */
  rightItems: NativeStackHeaderItem[]
}

/**
 * Reads the children of `Layout.Header.Outer` into a `NativeHeaderSpec`. Every
 * part that has a native equivalent becomes one; everything else becomes a
 * custom item that renders the React element as-is, without the shared glass
 * background, so it looks the same as in our own header.
 */
export function toNativeHeader(
  children: React.ReactNode,
  i18n: I18n,
  resolveIcon: IconResolver = resolveNativeIcon,
): NativeHeaderSpec {
  const spec: NativeHeaderSpec = {
    menu: false,
    title: '',
    leftItems: [],
    rightItems: [],
  }
  let seenContent = false

  for (const el of flatten(children)) {
    const role = getHeaderRole(el.type)
    const items = seenContent ? spec.rightItems : spec.leftItems
    switch (role) {
      case 'back':
        spec.back = {onPress: (el.props as Partial<ButtonProps>).onPress}
        break
      case 'menu':
        spec.menu = true
        break
      case 'content': {
        seenContent = true
        const contentChildren = (el.props as {children?: React.ReactNode})
          .children
        const title = readTitle(contentChildren, i18n)
        if (title !== undefined) {
          spec.title = title
        } else {
          spec.customTitle = contentChildren
        }
        break
      }
      case 'slot':
        for (const child of flatten(
          (el.props as {children?: React.ReactNode}).children,
        )) {
          items.push(toItem(child, i18n, resolveIcon))
        }
        break
      default:
        items.push(toItem(el, i18n, resolveIcon))
    }
  }

  return spec
}

/**
 * The title as a string, if the content is exactly one `TitleText` of plain
 * text with no style overrides.
 */
function readTitle(children: React.ReactNode, i18n: I18n): string | undefined {
  const parts = flatten(children)
  if (parts.length !== 1) return undefined
  const [part] = parts
  if (getHeaderRole(part.type) !== 'title') return undefined
  const props = part.props as {children?: React.ReactNode; style?: unknown}
  if (props.style || !isPlainText(props.children)) return undefined
  return getText(props.children, i18n)
}

function toItem(
  el: React.ReactElement,
  i18n: I18n,
  resolveIcon: IconResolver,
): NativeStackHeaderItem {
  return (
    toButtonItem(el, i18n, resolveIcon) ?? {
      type: 'custom',
      element: el,
      hidesSharedBackground: true,
    }
  )
}

/**
 * A `Button` whose only content is a `ButtonText` of plain text and/or a
 * `ButtonIcon`, becomes a native bar button. Bar buttons show text or an icon,
 * not both, so text wins and the icon is dropped. An icon on its own needs a
 * native icon.
 */
function toButtonItem(
  el: React.ReactElement,
  i18n: I18n,
  resolveIcon: IconResolver,
): NativeStackHeaderItemButton | undefined {
  if (el.type !== Button) return undefined
  const props = el.props as ButtonProps
  if (!props.onPress || typeof props.children === 'function') return undefined

  let iconComponent: unknown
  let text: string | undefined
  for (const child of flatten(props.children)) {
    if (child.type === ButtonIcon && iconComponent === undefined) {
      iconComponent = (child.props as {icon: unknown}).icon
    } else if (child.type === ButtonText && text === undefined) {
      const textChildren = (child.props as {children?: React.ReactNode})
        .children
      if (!isPlainText(textChildren)) return undefined
      text = getText(textChildren, i18n)
    } else {
      return undefined
    }
  }

  let icon: PlatformIconIOS | undefined
  if (!text) {
    if (iconComponent === undefined) return undefined
    icon = resolveIcon(iconComponent)
    if (!icon) return undefined
  }

  const onPress = props.onPress
  return {
    type: 'button',
    // Shown when there's no icon
    label: text || props.label,
    icon,
    disabled: props.disabled,
    // `color="primary"` is our call to action, which native shows prominently.
    variant: props.color === 'primary' ? 'prominent' : 'plain',
    onPress: () => onPress(createPressEvent()),
    ...nativeAccessibilityLabel(props.label),
  }
}

/**
 * The button's full `label` (e.g. "New list" for a button that shows "New")
 * for VoiceOver, and so E2E flows can find the button by it: bar buttons
 * can't take a `testID`. react-native-screens reads `accessibilityLabel` on
 * bar button items, and native-stack passes unknown keys through, but its
 * types don't declare it yet.
 */
export function nativeAccessibilityLabel(label: string) {
  return {accessibilityLabel: label} as {}
}

/*
 * TODO: header icons need native symbols. #12271 (inline native menus) builds
 * our SVGs into custom SF Symbols with nano's `symbolSets` and puts the glyph
 * name on each icon component as `glyph`. Once it lands this becomes
 * `{type: 'xcasset', name: nativeNanoSymbol(icon.glyph).name}`. Until then,
 * icon buttons fall back to custom items.
 */
const resolveNativeIcon: IconResolver = () => undefined

/**
 * Native items don't get a press event, but `onPress` handlers may call
 * `preventDefault()` (e.g. `BackButton`'s), so give them a stand-in.
 */
export function createPressEvent(): GestureResponderEvent & {
  defaultPrevented: boolean
} {
  const event = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true
    },
    stopPropagation() {},
    nativeEvent: {},
  }
  return event as unknown as GestureResponderEvent & {
    defaultPrevented: boolean
  }
}

/**
 * Children as a flat list of elements, looking through arrays and fragments
 * and dropping empty values.
 */
function flatten(node: React.ReactNode): React.ReactElement[] {
  if (Array.isArray(node)) return node.flatMap(flatten)
  if (!isValidElement(node)) return []
  if (node.type === Fragment) {
    return flatten((node.props as {children?: React.ReactNode}).children)
  }
  return [node]
}
