import React from 'react'

import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'

import {ContextType, TriggerChildProps} from '#/components/Menu/types'
import {Context} from '#/components/Menu/context'

export {useDialogControl as useMenuControl} from '#/components/Dialog'

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogOuterProps['control']
}>) {
  const defaultControl = Dialog.useDialogControl()
  const context = React.useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
    }),
    [control, defaultControl],
  )

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function Trigger({
  children,
}: {
  children(props: TriggerChildProps): React.ReactNode
}) {
  const {control} = React.useContext(Context)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  if (!control) {
    throw new Error('Menu.Trigger must be used within a Menu.Root')
  }

  return children({
    isNative: true,
    control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    handlers: {
      onPress: control.open,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
    },
  })
}

export function Outer({children}: React.PropsWithChildren<{}>) {
  const {control} = React.useContext(Context)

  if (!control) {
    throw new Error('Menu.Outer must be used within a Menu.Root')
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label="Menu TODO">
        {children}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function Button({}: {}) {}
