import React from 'react';
import { useColorScheme } from 'react-native';
import { useThemePrefs } from '#/state/shell';
import { dark, dim, light } from '#/alf/themes';
import { IS_WEB } from '#/env';
export function useColorModeTheme() {
    var theme = useThemeName();
    React.useLayoutEffect(function () {
        updateDocument(theme);
    }, [theme]);
    return theme;
}
export function useThemeName() {
    var colorScheme = useColorScheme();
    var _a = useThemePrefs(), colorMode = _a.colorMode, darkTheme = _a.darkTheme;
    return getThemeName(colorScheme, colorMode, darkTheme);
}
function getThemeName(colorScheme, colorMode, darkTheme) {
    if ((colorMode === 'system' && colorScheme === 'light') ||
        colorMode === 'light') {
        return 'light';
    }
    else {
        return darkTheme !== null && darkTheme !== void 0 ? darkTheme : 'dim';
    }
}
function updateDocument(theme) {
    // @ts-ignore web only
    if (IS_WEB && typeof window !== 'undefined') {
        // @ts-ignore web only
        var html = window.document.documentElement;
        // @ts-ignore web only
        var meta = window.document.querySelector('meta[name="theme-color"]');
        // remove any other color mode classes
        html.className = html.className.replace(/(theme)--\w+/g, '');
        html.classList.add("theme--".concat(theme));
        // set color to 'theme-color' meta tag
        meta === null || meta === void 0 ? void 0 : meta.setAttribute('content', getBackgroundColor(theme));
        window.localStorage.setItem('ALF_THEME', theme);
    }
}
export function getBackgroundColor(theme) {
    switch (theme) {
        case 'light':
            return light.atoms.bg.backgroundColor;
        case 'dark':
            return dark.atoms.bg.backgroundColor;
        case 'dim':
            return dim.atoms.bg.backgroundColor;
    }
}
