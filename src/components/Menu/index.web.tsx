import React from 'react'
import {Pressable, StyleProp, View, ViewStyle} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import {atoms as a, flatten, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  Context,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from '#/components/Menu/context'
import {
  ContextType,
  GroupProps,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
  RadixPassThroughTriggerProps,
  TriggerProps,
} from '#/components/Menu/types'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'

export function useMenuControl(): Dialog.DialogControlProps {
  const id = React.useId()
  const [isOpen, setIsOpen] = React.useState(false)

  return React.useMemo(
    () => ({
      id,
      ref: {current: null},
      isOpen,
      open() {
        setIsOpen(true)
      },
      close() {
        setIsOpen(false)
      },
    }),
    [id, isOpen, setIsOpen],
  )
}

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogOuterProps['control']
}>) {
  const {_} = useLingui()
  const defaultControl = useMenuControl()
  const context = React.useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
    }),
    [control, defaultControl],
  )
  const onOpenChange = React.useCallback(
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

const RadixTriggerPassThrough = React.forwardRef(
  (
    props: {
      children: (
        props: RadixPassThroughTriggerProps & {
          ref: React.Ref<any>
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
            isNative: false,
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

export function Outer({
  children,
  style,
}: React.PropsWithChildren<{
  showCancel?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const t = useTheme()

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content sideOffset={5} loop aria-label="Test">
        <View
          style={[
            a.rounded_sm,
            a.p_xs,
            a.border,
            t.name === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25,
            t.atoms.shadow_md,
            t.atoms.border_contrast_low,
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

export function Item({children, label, onPress, style, ...rest}: ItemProps) {
  const t = useTheme()
  const {control} = useMenuContext()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Item asChild>
      <Pressable
        {...rest}
        className="radix-dropdown-item"
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
        onFocus={onFocus}
        onBlur={onBlur}
        // need `flatten` here for Radix compat
        style={flatten([
          a.flex_row,
          a.align_center,
          a.gap_lg,
          a.py_sm,
          a.rounded_xs,
          {minHeight: 32, paddingHorizontal: 10},
          web({outline: 0}),
          (hovered || focused) &&
            !rest.disabled && [
              web({outline: '0 !important'}),
              t.name === 'light'
                ? t.atoms.bg_contrast_25
                : t.atoms.bg_contrast_50,
            ],
          style,
        ])}
        {...web({
          onMouseEnter,
          onMouseLeave,
        })}>
        <ItemContext.Provider value={{disabled: Boolean(rest.disabled)}}>
          {children}
        </ItemContext.Provider>
      </Pressable>
    </DropdownMenu.Item>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const {disabled} = useMenuItemContext()
  return (
    <Text
      style={[
        a.flex_1,
        a.font_bold,
        t.atoms.text_contrast_high,
        style,
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp, position = 'left'}: ItemIconProps) {
  const t = useTheme()
  const {disabled} = useMenuItemContext()
  return (
    <View
      style={[
        position === 'left' && {
          marginLeft: -2,
        },
        position === 'right' && {
          marginRight: -2,
          marginLeft: 12,
        },
      ]}>
      <Comp
        size="md"
        fill={
          disabled
            ? t.atoms.text_contrast_low.color
            : t.atoms.text_contrast_medium.color
        }
      />
    </View>
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

export function LabelText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.font_bold,
        a.pt_md,
        a.pb_sm,
        t.atoms.text_contrast_low,
        {
          paddingHorizontal: 10,
        },
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
      style={flatten([
        a.my_xs,
        t.atoms.bg_contrast_100,
        {
          height: 1,
        },
      ])}
    />
  )
}
