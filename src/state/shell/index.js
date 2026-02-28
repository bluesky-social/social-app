import { jsx as _jsx } from "react/jsx-runtime";
import { Provider as ColorModeProvider } from './color-mode';
import { Provider as DrawerOpenProvider } from './drawer-open';
import { Provider as DrawerSwipableProvider } from './drawer-swipe-disabled';
import { Provider as MinimalModeProvider } from './minimal-mode';
import { Provider as ShellLayoutProvder } from './shell-layout';
import { Provider as TickEveryMinuteProvider } from './tick-every-minute';
export { useSetThemePrefs, useThemePrefs } from './color-mode';
export { useIsDrawerOpen, useSetDrawerOpen } from './drawer-open';
export { useIsDrawerSwipeDisabled, useSetDrawerSwipeDisabled, } from './drawer-swipe-disabled';
export { useMinimalShellMode, useSetMinimalShellMode } from './minimal-mode';
export { useOnboardingDispatch, useOnboardingState } from './onboarding';
export { useTickEveryMinute } from './tick-every-minute';
export function Provider(_a) {
    var children = _a.children;
    return (_jsx(ShellLayoutProvder, { children: _jsx(DrawerOpenProvider, { children: _jsx(DrawerSwipableProvider, { children: _jsx(MinimalModeProvider, { children: _jsx(ColorModeProvider, { children: _jsx(TickEveryMinuteProvider, { children: children }) }) }) }) }) }));
}
