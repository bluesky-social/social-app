import React from 'react'
import {Provider as DrawerOpenProvider} from './drawer-open'
import {Provider as DrawerSwipableProvider} from './drawer-swipe-disabled'
import {Provider as MinimalModeProvider} from './minimal-mode'
import {Provider as ColorModeProvider} from './color-mode'
import {Provider as AltTextRequiredProvider} from './alt-text-required'

export {useIsDrawerOpen, useSetDrawerOpen} from './drawer-open'
export {
  useIsDrawerSwipeDisabled,
  useSetDrawerSwipeDisabled,
} from './drawer-swipe-disabled'
export {useMinimalShellMode, useSetMinimalShellMode} from './minimal-mode'
export {useColorMode, useSetColorMode} from './color-mode'
export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <DrawerOpenProvider>
      <DrawerSwipableProvider>
        <MinimalModeProvider>
          <ColorModeProvider>
            <AltTextRequiredProvider>{children}</AltTextRequiredProvider>
          </ColorModeProvider>
        </MinimalModeProvider>
      </DrawerSwipableProvider>
    </DrawerOpenProvider>
  )
}
