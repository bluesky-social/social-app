import {
  forwardRef,
  isValidElement,
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react'
import {Pressable, type StyleProp, type TextStyle, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import flattenReactChildren from 'react-keyed-flatten-children'

import {useA11y} from '#/state/a11y'
import {atoms as a, flatten, flattenToCSS, useTheme, utils, web} from '#/alf'
import type * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Check_Stroke3_Corner0_Rounded as Check} from '#/components/icons/Check'
import {
  Context,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from '#/components/Menu/context'
import {
  type ContextType,
  type GroupProps,
  type ItemIconProps,
  type ItemProps,
  type ItemTextProps,
  type OuterProps,
  type RadixPassThroughTriggerProps,
  type RootProps,
  type TriggerProps,
} from '#/components/Menu/types'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'

export {type DialogControlProps as MenuControlProps} from '#/components/Dialog'

export {useMenuContext}

export function useMenuControl(): Dialog.DialogControlProps {
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)

  return useMemo(
    () => ({
      id,
      ref: {current: null},
      isOpen,
      open() {
        setIsOpen(true)
      },
      close(cb) {
        setIsOpen(false)
        if (cb) setTimeout(cb)
      },
    }),
    [id, isOpen, setIsOpen],
  )
}

/**
 * `inline` has no effect on web, where menus are always dropdowns.
 */
export function Root({children, control}: RootProps) {
  const {_} = useLingui()
  const defaultControl = useMenuControl()
  const context = useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
      inline: false,
    }),
    [control, defaultControl],
  )
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (context.control.isOpen && !open) {
        context.control.close()
      } else if (!context.control.isOpen && open) {
        context.control.open()
      }
    },
    [context.control],
  )

  return (
    <Context.Provider value={context}>
      {context.control.isOpen && (
        <Portal>
          <Pressable
            style={[a.fixed, a.inset_0, a.z_50]}
            onPress={() => context.control.close()}
            accessibilityHint=""
            accessibilityLabel={_(
              msg`Context menu backdrop, click to close the menu.`,
            )}
          />
        </Portal>
      )}
      <DropdownMenu.Root
        open={context.control.isOpen}
        onOpenChange={onOpenChange}>
        {children}
      </DropdownMenu.Root>
    </Context.Provider>
  )
}

const RadixTriggerPassThrough = forwardRef(
  (
    props: {
      children: (
        props: RadixPassThroughTriggerProps & {
          ref: React.Ref<HTMLElement>
        },
      ) => React.ReactNode
    },
    ref,
  ) => {
    // @ts-expect-error Radix provides no types of this stuff
    return props.children({...props, ref})
  },
)
RadixTriggerPassThrough.displayName = 'RadixTriggerPassThrough'

export function Trigger({
  children,
  label,
  role = 'button',
  hint,
}: TriggerProps) {
  const {control} = useMenuContext()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Trigger asChild>
      <RadixTriggerPassThrough>
        {props =>
          children({
            IS_NATIVE: false,
            control,
            state: {
              hovered,
              focused,
              pressed: false,
            },
            props: {
              ...props,
              // No-op override to prevent false positive that interprets mobile scroll as a tap.
              // This requires the custom onPress handler below to compensate.
              // https://github.com/radix-ui/primitives/issues/1912
              onPointerDown: undefined,
              onPress: () => {
                if (window.event instanceof KeyboardEvent) {
                  // The onPointerDown hack above is not relevant to this press, so don't do anything.
                  return
                }
                // Compensate for the disabled onPointerDown above by triggering it manually.
                if (control.isOpen) {
                  control.close()
                } else {
                  control.open()
                }
              },
              onFocus: onFocus,
              onBlur: onBlur,
              onMouseEnter,
              onMouseLeave,
              accessibilityHint: hint,
              accessibilityLabel: label,
              accessibilityRole: role,
            },
          })
        }
      </RadixTriggerPassThrough>
    </DropdownMenu.Trigger>
  )
}

export function Outer({children, style, onCloseAutoFocus}: OuterProps) {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={5}
        collisionPadding={{left: 5, right: 5, bottom: 5}}
        loop
        aria-label="Test"
        onCloseAutoFocus={onCloseAutoFocus}
        className="dropdown-menu-transform-origin dropdown-menu-constrain-size">
        <View
          style={[
            /*
             * Material 3's menu tokens: items inset 4px, and the first and
             * last items' outer corners concentric with these, i.e. the
             * radius minus the padding. See `[data-menu-item]` in
             * `src/style.css`.
             */
            a.rounded_lg,
            a.p_xs,
            t.name === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
            {borderWidth: 0.5, minWidth: 160},
            web({
              boxShadow: `0 16px 24px 0 ${utils.alpha(
                t.palette.black,
                t.scheme === 'light' ? 0.08 : 0.4,
              )}`,
            }),
            a.overflow_auto,
            !reduceMotionEnabled && a.zoom_fade_in,
            style,
          ]}>
          {children}
        </View>

        {/* Disabled until we can fix positioning
        <DropdownMenu.Arrow
          className="DropdownMenuArrow"
          fill={
            (t.name === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25)
              .backgroundColor
          }
        />
          */}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

/**
 * A selected item's colours. Dark themes go a shade lighter, so the pill and
 * its label don't turn muddy. Their palettes run the other way, so that's a
 * higher number.
 */
function useSelectedColors() {
  const t = useTheme()
  const dark = t.scheme === 'dark'
  return {
    pill: dark ? t.palette.primary_100 : t.palette.primary_50,
    pillHovered: dark ? t.palette.primary_200 : t.palette.primary_100,
    content: dark ? t.palette.primary_600 : t.palette.primary_500,
  }
}

export function Item({
  children,
  label,
  onPress,
  style,
  destructive = false,
  ...rest
}: ItemProps) {
  const t = useTheme()
  const selectedColors = useSelectedColors()
  const {control} = useMenuContext()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const disabled = Boolean(rest.disabled)
  const {selected, content} = arrangeItemContent(children)
  const highlighted = (hovered || focused) && !disabled
  /*
   * Radix also focuses items as the pointer moves over them, so only focus
   * the browser treats as keyboard focus gets the ring.
   */
  const [focusVisible, setFocusVisible] = useState(false)

  return (
    <DropdownMenu.Item asChild disabled={disabled}>
      <Pressable
        {...rest}
        // For the item shapes in style.css
        dataSet={{menuItem: ''}}
        accessibilityHint=""
        accessibilityLabel={label}
        onPress={e => {
          onPress(e)

          /**
           * Ported forward from Radix
           * @see https://www.radix-ui.com/primitives/docs/components/dropdown-menu#item
           */
          if (!e.defaultPrevented) {
            control.close()
          }
        }}
        onFocus={e => {
          onFocus()
          setFocusVisible(
            (e.target as unknown as Element).matches(':focus-visible'),
          )
        }}
        onBlur={() => {
          onBlur()
          setFocusVisible(false)
        }}
        // need `flatten` here for Radix compat
        style={flatten([
          a.flex_row,
          a.align_center,
          a.gap_sm,
          // Less on the leading side, for the icon's visual balance
          a.pl_md,
          a.pr_lg,
          a.py_sm,
          a.overflow_hidden,
          {minHeight: 40},
          web({outline: 0}),
          /*
           * The selected item's pill is evenly rounded, overriding the
           * positional corners. Hovered items keep them.
           */
          selected && a.rounded_sm,
          selected && {backgroundColor: selectedColors.pill},
          highlighted && [
            web({outline: '0 !important'}),
            selected
              ? {backgroundColor: selectedColors.pillHovered}
              : t.name === 'light'
                ? t.atoms.bg_contrast_50
                : t.atoms.bg_contrast_100,
          ],
          focusVisible &&
            !disabled &&
            web({
              outline: `2px solid ${t.palette.primary_500}`,
              outlineOffset: -2,
            }),
          style,
        ])}
        {...web({
          onMouseEnter,
          onMouseLeave,
        })}>
        <ItemContext.Provider value={{disabled, destructive, selected}}>
          {content}
        </ItemContext.Provider>
      </Pressable>
    </DropdownMenu.Item>
  )
}

/**
 * Puts an item's icons on the leading side, whatever order they're written
 * in, like Android's menus. A radio item leads with its check instead, and its
 * icons trail.
 */
function arrangeItemContent(children: React.ReactNode) {
  let radio: React.ReactElement<{selected: boolean}> | undefined
  const icons: React.ReactNode[] = []
  const rest: React.ReactNode[] = []
  for (const child of flattenReactChildren(children)) {
    if (isValidElement(child) && child.type === ItemIcon) {
      icons.push(child)
    } else if (
      isValidElement<{selected: boolean}>(child) &&
      child.type === ItemRadio
    ) {
      radio = child
    } else {
      rest.push(child)
    }
  }
  return {
    selected: radio?.props.selected,
    content: radio ? [radio, ...rest, ...icons] : [...icons, ...rest],
  }
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const selectedColors = useSelectedColors()
  const {disabled, destructive, selected} = useMenuItemContext()
  return (
    <Text
      style={[
        a.flex_1,
        a.text_sm,
        a.font_medium,
        a.leading_snug,
        t.atoms.text,
        style,
        selected && {color: selectedColors.content},
        destructive && {color: t.palette.negative_500},
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

/**
 * `position` has no effect: icons always lead, or trail in radio items.
 */
export function ItemIcon({icon: Comp, fill}: ItemIconProps) {
  const t = useTheme()
  const selectedColors = useSelectedColors()
  const {disabled, destructive, selected} = useMenuItemContext()
  return (
    <Comp
      // Between `sm` and `md`, to sit with the 13px labels
      width={18}
      fill={
        fill
          ? fill({disabled})
          : disabled
            ? t.atoms.text_contrast_low.color
            : destructive
              ? t.palette.negative_500
              : selected
                ? selectedColors.content
                : t.atoms.text.color
      }
    />
  )
}

/**
 * The selected item's check. Every radio item keeps the space for it, so
 * labels don't move when the selection changes. `Item` puts it first.
 */
export function ItemRadio({selected}: {selected: boolean}) {
  const t = useTheme()
  const selectedColors = useSelectedColors()
  const {disabled} = useMenuItemContext()
  return (
    <View style={{height: 16, width: 16}}>
      {selected && (
        <Check
          size="sm"
          fill={
            disabled ? t.atoms.text_contrast_low.color : selectedColors.content
          }
        />
      )}
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
  return (
    <Text
      // For the item shapes in style.css
      dataSet={{menuLabel: ''}}
      style={[
        a.px_md,
        // With the 17px line, a 32px row.
        {paddingVertical: 7.5},
        a.text_sm,
        a.font_semi_bold,
        a.leading_snug,
        t.atoms.text,
        style,
      ]}>
      {children}
    </Text>
  )
}

export function Group({children}: GroupProps) {
  return children
}

export function Divider() {
  const t = useTheme()
  return (
    <DropdownMenu.Separator
      style={flattenToCSS([
        // Keeps a highlighted item's fill off the line
        a.mx_xs,
        a.my_xs,
        t.atoms.bg_contrast_100,
        a.flex_shrink_0,
        {height: 1},
      ])}
    />
  )
}

export function ContainerItem() {
  return null
}
