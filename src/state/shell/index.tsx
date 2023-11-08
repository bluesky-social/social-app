import React from 'react'
import {Provider as DrawerOpenProvider} from './drawer-open'
import {Provider as DrawerSwipableProvider} from './drawer-swipe-disabled'
import {Provider as MinimalModeProvider} from './minimal-mode'
import {Provider as ColorModeProvider} from './color-mode'

export {useIsDrawerOpen, useSetDrawerOpen} from './drawer-open'
export {
  useIsDrawerSwipeDisabled,
  useSetDrawerSwipeDisabled,
} from './drawer-swipe-disabled'
export {useMinimalShellMode, useSetMinimalShellMode} from './minimal-mode'
export {useColorMode, useSetColorMode} from './color-mode'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <DrawerOpenProvider>
      <DrawerSwipableProvider>
        <MinimalModeProvider>
          <ColorModeProvider>{children}</ColorModeProvider>
        </MinimalModeProvider>
      </DrawerSwipableProvider>
    </DrawerOpenProvider>
  )
}
