import React from 'react'

import * as Dialog from '#/components/Dialog'

/**
 * Type util for global dialog components. Wrap individual dialog component
 * types with this to get types for the additional properties applied by the
 * the global dialon controller.
 */
export type GlobalDialogProps<T = any> = {
  params: T
  cleanup(): void
  options?: Dialog.DialogControlOpenOptions
}

type ActiveDialog<T extends React.ComponentType<GlobalDialogProps>> = {
  component: T
  props: React.ComponentProps<T>
  options?: Dialog.DialogControlOpenOptions
}

type ContextProps = {
  activeDialogs: ActiveDialog<any>[]
  open<T extends React.ComponentType<GlobalDialogProps>>(
    component: T,
    props: React.ComponentProps<T>['params'],
    options?: Dialog.DialogControlOpenOptions,
  ): void
  popTopDialog(): void
}

export const Context = React.createContext<ContextProps>({
  activeDialogs: [],
  open() {},
  popTopDialog() {},
})

/**
 * Hook to open a "global" dialog.
 *
 * @example
 * ```tsx
 * const openGlobalDialog = useOpenGlobalDialog()
 * openGlobalDialog(
 *   MyDialog,
 *   // component props
 *   {foo: 'bar'},
 *   // base Dialog options
 *   { index: 1 }
 * )
 * ```
 */
export function useOpenGlobalDialog() {
  return React.useContext(Context).open
}

/**
 * Provider for "global" dialogs _only_. ALL dialogs are still registered by
 * `#/state/dialogs` as well.
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const [activeDialogs, setActiveDialogs] = React.useState<ActiveDialog<any>[]>(
    [],
  )
  const ctx = React.useMemo<ContextProps>(
    () => ({
      activeDialogs,
      open(component, props, options) {
        setActiveDialogs(s => [...s, {component, props, options}])
      },
      popTopDialog() {
        setActiveDialogs(s => s.slice(0, -1))
      },
    }),
    [activeDialogs, setActiveDialogs],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

/**
 * Outlet for any active "global" dialogs. Since these are rendered into a
 * portal in the root, this is technically not their final resting place.
 */
export function GlobalDialog() {
  const {activeDialogs, popTopDialog} = React.useContext(Context)

  const cleanup = React.useCallback(() => {
    popTopDialog()
  }, [popTopDialog])

  return activeDialogs.map(({component: Comp, props, options}, i) => {
    return <Comp key={i} {...props} cleanup={cleanup} options={options} />
  })
}
