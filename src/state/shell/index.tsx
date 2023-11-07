import React from 'react'
import {Provider as DrawerOpenProvider} from './drawer-open'
import {Provider as DrawerSwipableProvider} from './drawer-swipe-disabled'
import {Provider as MinimalModeProvider} from './minimal-mode'

export {useIsDrawerOpen, useSetDrawerOpen} from './drawer-open'
export {
  useIsDrawerSwipeDisabled,
  useSetDrawerSwipeDisabled,
} from './drawer-swipe-disabled'
export {useMinimalShellMode, useSetMinimalShellMode} from './minimal-mode'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <DrawerOpenProvider>
      <DrawerSwipableProvider>
        <MinimalModeProvider>{children}</MinimalModeProvider>
      </DrawerSwipableProvider>
    </DrawerOpenProvider>
  )
}
