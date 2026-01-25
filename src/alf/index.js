import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { computeFontScaleMultiplier, getFontFamily, getFontScale, setFontFamily as persistFontFamily, setFontScale as persistFontScale, } from '#/alf/fonts';
import { themes } from '#/alf/themes';
export { utils, } from '@bsky.app/alf';
export { atoms } from '#/alf/atoms';
export * from '#/alf/breakpoints';
export * from '#/alf/fonts';
export * as tokens from '#/alf/tokens';
export * from '#/alf/util/flatten';
export * from '#/alf/util/platform';
export * from '#/alf/util/themeSelector';
export * from '#/alf/util/useGutters';
/*
 * Context
 */
export var Context = React.createContext({
    themeName: 'light',
    theme: themes.light,
    themes: themes,
    fonts: {
        scale: getFontScale(),
        scaleMultiplier: computeFontScaleMultiplier(getFontScale()),
        family: getFontFamily(),
        setFontScale: function () { },
        setFontFamily: function () { },
    },
    flags: {},
});
Context.displayName = 'AlfContext';
export function ThemeProvider(_a) {
    var children = _a.children, themeName = _a.theme;
    var _b = React.useState(function () {
        return getFontScale();
    }), fontScale = _b[0], setFontScale = _b[1];
    var _c = React.useState(function () {
        return computeFontScaleMultiplier(fontScale);
    }), fontScaleMultiplier = _c[0], setFontScaleMultiplier = _c[1];
    var setFontScaleAndPersist = React.useCallback(function (fs) {
        setFontScale(fs);
        persistFontScale(fs);
        setFontScaleMultiplier(computeFontScaleMultiplier(fs));
    }, [setFontScale]);
    var _d = React.useState(function () { return getFontFamily(); }), fontFamily = _d[0], setFontFamily = _d[1];
    var setFontFamilyAndPersist = React.useCallback(function (ff) {
        setFontFamily(ff);
        persistFontFamily(ff);
    }, [setFontFamily]);
    var value = React.useMemo(function () { return ({
        themes: themes,
        themeName: themeName,
        theme: themes[themeName],
        fonts: {
            scale: fontScale,
            scaleMultiplier: fontScaleMultiplier,
            family: fontFamily,
            setFontScale: setFontScaleAndPersist,
            setFontFamily: setFontFamilyAndPersist,
        },
        flags: {},
    }); }, [
        themeName,
        fontScale,
        setFontScaleAndPersist,
        fontFamily,
        setFontFamilyAndPersist,
        fontScaleMultiplier,
    ]);
    return _jsx(Context.Provider, { value: value, children: children });
}
export function useAlf() {
    return React.useContext(Context);
}
export function useTheme(theme) {
    var alf = useAlf();
    return React.useMemo(function () {
        return theme ? alf.themes[theme] : alf.theme;
    }, [theme, alf]);
}
