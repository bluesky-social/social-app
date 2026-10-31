import {
  cloneElement,
  Fragment,
  isValidElement,
  useContext,
  useMemo,
  useRef,
} from 'react'
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import flattenReactChildren from 'react-keyed-flatten-children'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {type NanoGlyphName} from '#/components/icons/glyphMaps'
import {type IconWithSvgMeta} from '#/components/icons/TEMPLATE'
import {
  Context,
  InlineItemPositionContext,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from '#/components/Menu/context'
import {InlineItem, InlineRoot, InlineSection} from '#/components/Menu/inline'
import {getText} from '#/components/Menu/inline/getText'
import {getMenuSourceViewTag} from '#/components/Menu/sourceViewTag'
import {
  type ContextType,
  type GroupProps,
  type ItemIconProps,
  type ItemProps,
  type ItemTextProps,
  type OuterProps,
  type RootProps,
  type TriggerProps,
} from '#/components/Menu/types'
import {Text} from '#/components/Typography'
import {
  IS_ANDROID,
  IS_DEV,
  IS_IOS,
  IS_IPAD,
  IS_LIQUID_GLASS,
  IS_NATIVE,
} from '#/env'

// iOS 26's floaty sheet presentation subtracts the bottom safe-area inset from
// the requested detent, which eats the visible bottom padding of short (e.g.
// single-item) menus. Flooring the native sheet height restores that padding.
const IOS_MENU_MIN_HEIGHT = 128

export {
  type DialogControlProps as MenuControlProps,
  useDialogControl as useMenuControl,
} from '#/components/Dialog'

export {useMenuContext}

export function Root({children, control, inline = false}: RootProps) {
  const defaultControl = Dialog.useDialogControl()
  const inlineParts = inline ? getInlineParts(children) : undefined
  const isInline = inlineParts !== undefined
  const context = useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
      inline: isInline,
    }),
    [control, defaultControl, isInline],
  )

  return (
    <Context.Provider value={context}>
      {inlineParts ? (
        <>
          <InlineRoot control={context.control} trigger={inlineParts.trigger}>
            {inlineParts.outer}
          </InlineRoot>
          {inlineParts.rest}
        </>
      ) : (
        children
      )}
    </Context.Provider>
  )
}

/**
 * A native menu holds its anchor and its items in one view, so pull the
 * trigger and the items out of `Root`'s children.
 */
function getInlineParts(children: React.ReactNode) {
  let trigger: React.ReactElement<TriggerProps> | undefined
  let outer: React.ReactElement<OuterProps> | undefined
  const rest: React.ReactNode[] = []
  for (const child of flattenReactChildren(children)) {
    if (
      !trigger &&
      isValidElement<TriggerProps>(child) &&
      child.type === Trigger
    ) {
      trigger = child
    } else if (
      !outer &&
      isValidElement<OuterProps>(child) &&
      child.type === Outer
    ) {
      outer = child
    } else {
      rest.push(child)
    }
  }
  if (!trigger || !outer) {
    if (IS_DEV) {
      console.warn(
        'An inline Menu.Root needs Menu.Trigger and Menu.Outer as direct children. Falling back to a bottom sheet.',
      )
    }
    return undefined
  }
  return {trigger, outer, rest}
}

export function Trigger({
  children,
  label,
  role = 'button',
  hint,
}: TriggerProps) {
  const context = useMenuContext()
  const triggerRef = useRef<React.ComponentRef<typeof View>>(null)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  const onPress = (event?: GestureResponderEvent) => {
    if (context.inline) {
      // On iOS, the SwiftUI menu around the trigger opens itself.
      if (IS_ANDROID) context.control.open()
      return
    }

    if (!IS_IOS) {
      context.control.open(event)
      return
    }

    const sourceViewTag = getMenuSourceViewTag(triggerRef.current, event)
    context.control.open({sourceViewTag})
  }

  return children({
    IS_NATIVE: true,
    control: context.control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    props: {
      ref: triggerRef,
      onPress,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      accessibilityHint: hint,
      accessibilityLabel: label,
      accessibilityRole: role,
    },
  })
}

export function Outer({
  children,
  showCancel,
  popover = 'adaptive',
}: OuterProps) {
  const context = useMenuContext()
  const {t: l} = useLingui()

  if (context.inline) {
    return <InlineOuter>{children}</InlineOuter>
  }

  return (
    <Dialog.Outer
      control={context.control}
      nativeOptions={{
        popover: IS_IOS ? popover : 'never',
        preventExpansion: true,
        minHeight: IS_IOS ? IOS_MENU_MIN_HEIGHT : undefined,
        ...(IS_IPAD && IS_LIQUID_GLASS ? {backgroundColor: 'transparent'} : {}),
      }}>
      <Dialog.Handle />
      {/* Re-wrap with context since Dialogs are portal-ed to root */}
      <Context.Provider value={context}>
        <Dialog.ScrollableInner label={l`Menu`}>
          <View style={[a.gap_lg]}>
            {children}
            {IS_NATIVE && showCancel && <Cancel />}
          </View>
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

/**
 * Splits the items into native sections: each `Group`, with the `LabelText`
 * above it as its title, and each run of loose items between groups and
 * `Divider`s. Each item gets its position in the whole menu, which Android
 * shapes it by.
 */
function InlineOuter({children}: {children: React.ReactNode}) {
  const {i18n} = useLingui()
  const sections: {
    key: React.Key | null
    title?: string
    items: React.ReactNode[]
  }[] = []
  let title: string | undefined
  let looseItems: React.ReactNode[] | undefined

  for (const child of flattenReactChildren(children)) {
    if (isValidElement<{children?: React.ReactNode}>(child)) {
      if (child.type === LabelText) {
        title = getText(child.props.children, i18n)
        looseItems = undefined
        continue
      }
      if (child.type === Group) {
        sections.push({
          key: child.key,
          title,
          items: flattenReactChildren(child.props.children),
        })
        title = undefined
        looseItems = undefined
        continue
      }
      if (child.type === Divider) {
        looseItems = undefined
        continue
      }
    }
    if (!looseItems) {
      looseItems = []
      sections.push({
        key: isValidElement(child) ? child.key : null,
        title,
        items: looseItems,
      })
      title = undefined
    }
    looseItems.push(child)
  }

  const starts: number[] = []
  let count = 0
  for (const section of sections) {
    starts.push(count)
    count += section.items.length
  }

  return sections.map((section, i) => (
    <InlineSection key={section.key ?? i} title={section.title} divider={i > 0}>
      {section.items.map((item, j) => (
        <InlineItemPositionContext.Provider
          key={isValidElement(item) ? item.key : j}
          value={{index: starts[i] + j, count}}>
          {item}
        </InlineItemPositionContext.Provider>
      ))}
    </InlineSection>
  ))
}

export function Item({
  children,
  label,
  style,
  onPress,
  destructive = false,
  ...rest
}: ItemProps) {
  const t = useTheme()
  const context = useMenuContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  if (context.inline) {
    return (
      <InlineItemFromChildren
        label={label}
        onPress={onPress}
        destructive={destructive}
        disabled={Boolean(rest.disabled)}
        testID={rest.testID}>
        {children}
      </InlineItemFromChildren>
    )
  }

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={e => {
        if (IS_ANDROID) {
          /**
           * Below fix for iOS doesn't work for Android, this does.
           */
          onPress?.(e)
          context.control.close()
        } else if (IS_IOS) {
          /**
           * Fixes a subtle bug on iOS
           * {@link https://github.com/bluesky-social/social-app/pull/5849/files#diff-de516ef5e7bd9840cd639213301df38cf03acfcad5bda85a1d63efd249ba79deL124-L127}
           */
          context.control.close(() => {
            onPress?.(e)
          })
        }
      }}
      onPressIn={e => {
        onPressIn()
        rest.onPressIn?.(e)
      }}
      onPressOut={e => {
        onPressOut()
        rest.onPressOut?.(e)
      }}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {minHeight: 44, paddingVertical: 10},
        style,
        (focused || pressed) && !rest.disabled && [t.atoms.bg_contrast_50],
      ]}>
      <ItemContext.Provider
        value={{disabled: Boolean(rest.disabled), destructive}}>
        {children}
      </ItemContext.Provider>
    </Pressable>
  )
}

/**
 * Native menu rows take a title, an icon and a checked state rather than
 * views, so read them off the item's `ItemText`, `ItemIcon` and `ItemRadio`.
 * Any other content can't be shown.
 */
function InlineItemFromChildren({
  children,
  label,
  onPress,
  destructive,
  disabled,
  testID,
}: React.PropsWithChildren<{
  label: string
  onPress: () => void
  destructive: boolean
  disabled: boolean
  testID?: string
}>) {
  const {i18n} = useLingui()
  let title = ''
  let glyph: NanoGlyphName | undefined
  let selected: boolean | undefined

  for (const child of flattenReactChildren(children)) {
    if (isValidElement<ItemTextProps>(child) && child.type === ItemText) {
      title += getText(child.props.children, i18n)
    } else if (
      isValidElement<ItemIconProps>(child) &&
      child.type === ItemIcon
    ) {
      glyph ??= (child.props.icon as Partial<IconWithSvgMeta>).glyph
    } else if (
      isValidElement<{selected: boolean}>(child) &&
      child.type === ItemRadio
    ) {
      selected = child.props.selected
    }
  }

  return (
    <InlineItem
      // The accessibility label is the closest match to text we can't read.
      title={title || label}
      glyph={glyph}
      selected={selected}
      destructive={destructive}
      disabled={disabled}
      testID={testID}
      onPress={onPress}
    />
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const {disabled, destructive} = useMenuItemContext()
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="middle"
      style={[
        a.flex_1,
        a.text_md,
        a.font_semi_bold,
        t.atoms.text_contrast_high,
        style,
        destructive && {color: t.palette.negative_500},
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp, fill}: ItemIconProps) {
  const t = useTheme()
  const {disabled, destructive} = useMenuItemContext()
  return (
    <Comp
      size="lg"
      fill={
        fill
          ? fill({disabled})
          : disabled
            ? t.atoms.text_contrast_low.color
            : destructive
              ? t.palette.negative_500
              : t.atoms.text_contrast_medium.color
      }
    />
  )
}

export function ItemRadio({selected}: {selected: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        t.atoms.border_contrast_high,
        {
          borderWidth: 1,
          height: 20,
          width: 20,
        },
      ]}>
      {selected ? (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 14, width: 14},
            selected
              ? {
                  backgroundColor: t.palette.primary_500,
                }
              : {},
          ]}
        />
      ) : null}
    </View>
  )
}

/**
 * NATIVE ONLY - for adding non-pressable items to the menu
 *
 * @platform ios, android
 */
export function ContainerItem({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const inline = useContext(Context)?.inline
  // Native menus can't host views.
  if (inline) return null
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.rounded_lg,
        a.curve_continuous,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {paddingVertical: 10},
        style,
      ]}>
      {children}
    </View>
  )
}

export function LabelText({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<TextStyle>
}) {
  const t = useTheme()
  const inline = useContext(Context)?.inline
  // `Outer` makes it the title of the group below it.
  if (inline) return null
  return (
    <Text
      style={[
        a.font_semi_bold,
        t.atoms.text_contrast_medium,
        {marginBottom: -8},
        style,
      ]}>
      {children}
    </Text>
  )
}

export function Group({children, style}: GroupProps) {
  const t = useTheme()
  const inline = useContext(Context)?.inline
  if (inline) {
    return <InlineSection>{children}</InlineSection>
  }
  return (
    <View
      style={[
        a.rounded_lg,
        a.curve_continuous,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        style,
      ]}>
      {flattenReactChildren(children).map((child, i) => {
        return isValidElement(child) &&
          (child.type === Item || child.type === ContainerItem) ? (
          <Fragment key={i}>
            {i > 0 ? (
              <View style={[a.border_b, t.atoms.border_contrast_low]} />
            ) : null}
            {cloneElement(child, {
              // @ts-expect-error cloneElement is not aware of the types
              style: {
                borderRadius: 0,
                borderWidth: 0,
              },
            })}
          </Fragment>
        ) : null
      })}
    </View>
  )
}

function Cancel() {
  const {t: l} = useLingui()
  const context = useMenuContext()

  return (
    <Button
      label={l`Close this dialog`}
      size="small"
      variant="ghost"
      color="secondary"
      onPress={() => context.control.close()}>
      <ButtonText>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}

export function Divider() {
  return null
}
