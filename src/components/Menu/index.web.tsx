import React from 'react'
import {View, Pressable} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {atoms as a, useTheme, flatten, web, ViewStyleProp} from '#/alf'
import {Text} from '#/components/Typography'

import {
  ContextType,
  TriggerChildProps,
  ItemProps,
  GroupProps,
  ItemTextProps,
  ItemIconProps,
} from '#/components/Menu/types'
import {Context} from '#/components/Menu/context'

export function useMenuControl(): Dialog.DialogControlProps {
  return {
    id: '',
    // @ts-ignore
    ref: null,
    open: () => {
      throw new Error(`Menu controls are only available on native platforms`)
    },
    close: () => {
      throw new Error(`Menu controls are only available on native platforms`)
    },
  }
}

export function Root({
  children,
}: React.PropsWithChildren<{
  control?: Dialog.DialogOuterProps['control']
}>) {
  const context = React.useMemo<ContextType>(
    () => ({
      control: null,
    }),
    [],
  )

  return (
    <Context.Provider value={context}>
      <DropdownMenu.Root>{children}</DropdownMenu.Root>
    </Context.Provider>
  )
}

export function Trigger({
  children,
  style,
}: ViewStyleProp & {
  children(props: TriggerChildProps): React.ReactNode
}) {
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Trigger asChild>
      <Pressable
        onFocus={onFocus}
        onBlur={onBlur}
        style={flatten([style, web({outline: 0})])}
        {...web({
          onMouseEnter,
          onMouseLeave,
        })}>
        {children({
          isNative: false,
          control: null,
          state: {
            hovered,
            focused,
            pressed: false,
          },
          handlers: {},
        })}
      </Pressable>
    </DropdownMenu.Trigger>
  )
}

export function Outer({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content sideOffset={5} loop>
        <View style={[a.rounded_sm, t.atoms.bg_contrast_50, {padding: 6}]}>
          {children}
        </View>

        <DropdownMenu.Arrow
          className="DropdownMenuArrow"
          fill={t.atoms.bg_contrast_50.backgroundColor}
        />
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function Item({children, label, onPress}: ItemProps) {
  const t = useTheme()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  return (
    <DropdownMenu.Item asChild onSelect={onPress}>
      <Pressable
        className="radix-dropdown-item"
        accessibilityHint=""
        accessibilityLabel={label}
        onFocus={onFocus}
        onBlur={onBlur}
        style={flatten([
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.py_sm,
          a.px_md,
          a.rounded_xs,
          {minHeight: 36},
          web({outline: 0}),
          (hovered || focused) && [
            web({outline: '0 !important'}),
            t.atoms.bg_contrast_25,
          ],
        ])}
        {...web({
          onMouseEnter,
          onMouseLeave,
        })}>
        {children}
      </Pressable>
    </DropdownMenu.Item>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  return (
    <Text style={[a.font_bold, t.atoms.text_contrast_high, style]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp, position = 'left'}: ItemIconProps) {
  const t = useTheme()
  return (
    <Comp
      size="md"
      fill={t.atoms.text_contrast_medium.color}
      style={[
        {
          marginLeft: position === 'left' ? -2 : 0,
          marginRight: position === 'right' ? -2 : 0,
        },
      ]}
    />
  )
}

export function Group({children}: GroupProps) {
  return children
}

export function Divider() {
  const t = useTheme()
  return (
    <DropdownMenu.Separator
      style={{
        height: 1,
        backgroundColor: t.atoms.bg_contrast_100.backgroundColor,
        marginTop: 6,
        marginBottom: 6,
      }}
    />
  )
}
