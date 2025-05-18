import type React from 'react'

import {Provider as ColorModeProvider} from './color-mode'
import {Provider as DrawerOpenProvider} from './drawer-open'
import {Provider as DrawerSwipableProvider} from './drawer-swipe-disabled'
import {Provider as MinimalModeProvider} from './minimal-mode'
import {Provider as OnboardingProvider} from './onboarding'
import {Provider as ShellLayoutProvder} from './shell-layout'
import {Provider as TickEveryMinuteProvider} from './tick-every-minute'

export {useSetThemePrefs, useThemePrefs} from './color-mode'
export {useIsDrawerOpen, useSetDrawerOpen} from './drawer-open'
export {
  useIsDrawerSwipeDisabled,
  useSetDrawerSwipeDisabled,
} from './drawer-swipe-disabled'
export {useMinimalShellMode, useSetMinimalShellMode} from './minimal-mode'
export {useOnboardingDispatch, useOnboardingState} from './onboarding'
export {useTickEveryMinute} from './tick-every-minute'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <ShellLayoutProvder>
      <DrawerOpenProvider>
        <DrawerSwipableProvider>
          <MinimalModeProvider>
            <ColorModeProvider>
              <OnboardingProvider>
                <TickEveryMinuteProvider>{children}</TickEveryMinuteProvider>
              </OnboardingProvider>
            </ColorModeProvider>
          </MinimalModeProvider>
        </DrawerSwipableProvider>
      </DrawerOpenProvider>
    </ShellLayoutProvder>
  )
}
