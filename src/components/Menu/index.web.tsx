import React from 'react'
import {Pressable} from 'react-native'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {flatten, web} from '#/alf'

import {ContextType, TriggerChildProps} from '#/components/Menu/types'
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
}: {
  children(props: TriggerChildProps): React.ReactNode
}) {
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <DropdownMenu.Trigger asChild>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onFocus={onFocus}
        onBlur={onBlur}
        style={flatten([web({outline: 0})])}
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
            pressed,
          },
          handlers: {},
        })}
      </Pressable>
    </DropdownMenu.Trigger>
  )
}

export function Outer(_props: React.PropsWithChildren<{}>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content sideOffset={5}>
        <DropdownMenu.Item>
          New Tab <div className="RightSlot">⌘+T</div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function Button({}: {}) {}
