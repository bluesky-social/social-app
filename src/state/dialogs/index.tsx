import React from 'react'
import {SharedValue, useSharedValue} from 'react-native-reanimated'

import {DialogControlRefProps} from '#/components/Dialog'
import {Provider as GlobalDialogsProvider} from '#/components/dialogs/Context'

interface IDialogContext {
  /**
   * The currently active `useDialogControl` hooks.
   */
  activeDialogs: React.MutableRefObject<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >
  /**
   * The currently open dialogs, referenced by their IDs, generated from
   * `useId`.
   */
  openDialogs: React.MutableRefObject<Set<string>>
  /**
   * The counterpart to `accessibilityViewIsModal` for Android. This property
   * applies to the parent of all non-modal views, and prevents TalkBack from
   * navigating within content beneath an open dialog.
   *
   * @see https://reactnative.dev/docs/accessibility#importantforaccessibility-android
   */
  importantForAccessibility: SharedValue<'auto' | 'no-hide-descendants'>
}

const DialogContext = React.createContext<IDialogContext>({} as IDialogContext)

const DialogControlContext = React.createContext<{
  closeAllDialogs(): boolean
  setDialogIsOpen(id: string, isOpen: boolean): void
}>({
  closeAllDialogs: () => false,
  setDialogIsOpen: () => {},
})

export function useDialogStateContext() {
  return React.useContext(DialogContext)
}

export function useDialogStateControlContext() {
  return React.useContext(DialogControlContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const activeDialogs = React.useRef<
    Map<string, React.MutableRefObject<DialogControlRefProps>>
  >(new Map())
  const openDialogs = React.useRef<Set<string>>(new Set())
  const importantForAccessibility = useSharedValue<
    'auto' | 'no-hide-descendants'
  >('auto')

  const closeAllDialogs = React.useCallback(() => {
    openDialogs.current.forEach(id => {
      const dialog = activeDialogs.current.get(id)
      if (dialog) dialog.current.close()
    })
    return openDialogs.current.size > 0
  }, [])

  const setDialogIsOpen = React.useCallback(
    (id: string, isOpen: boolean) => {
      if (isOpen) {
        openDialogs.current.add(id)
        importantForAccessibility.value = 'no-hide-descendants'
      } else {
        openDialogs.current.delete(id)
        if (openDialogs.current.size < 1) {
          importantForAccessibility.value = 'auto'
        }
      }
    },
    [importantForAccessibility],
  )

  const context = React.useMemo<IDialogContext>(
    () => ({
      activeDialogs,
      openDialogs,
      importantForAccessibility,
    }),
    [importantForAccessibility, activeDialogs, openDialogs],
  )
  const controls = React.useMemo(
    () => ({closeAllDialogs, setDialogIsOpen}),
    [closeAllDialogs, setDialogIsOpen],
  )

  return (
    <DialogContext.Provider value={context}>
      <DialogControlContext.Provider value={controls}>
        <GlobalDialogsProvider>{children}</GlobalDialogsProvider>
      </DialogControlContext.Provider>
    </DialogContext.Provider>
  )
}
