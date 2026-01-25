import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext({
    colorMode: 'system',
    darkTheme: 'dark',
});
stateContext.displayName = 'ColorModeStateContext';
var setContext = React.createContext({});
setContext.displayName = 'ColorModeSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('colorMode')), colorMode = _b[0], setColorMode = _b[1];
    var _c = React.useState(persisted.get('darkTheme')), darkTheme = _c[0], setDarkTheme = _c[1];
    var stateContextValue = React.useMemo(function () { return ({
        colorMode: colorMode,
        darkTheme: darkTheme,
    }); }, [colorMode, darkTheme]);
    var setContextValue = React.useMemo(function () { return ({
        setColorMode: function (_colorMode) {
            setColorMode(_colorMode);
            persisted.write('colorMode', _colorMode);
        },
        setDarkTheme: function (_darkTheme) {
            setDarkTheme(_darkTheme);
            persisted.write('darkTheme', _darkTheme);
        },
    }); }, []);
    React.useEffect(function () {
        var unsub1 = persisted.onUpdate('darkTheme', function (nextDarkTheme) {
            setDarkTheme(nextDarkTheme);
        });
        var unsub2 = persisted.onUpdate('colorMode', function (nextColorMode) {
            setColorMode(nextColorMode);
        });
        return function () {
            unsub1();
            unsub2();
        };
    }, []);
    return (_jsx(stateContext.Provider, { value: stateContextValue, children: _jsx(setContext.Provider, { value: setContextValue, children: children }) }));
}
export function useThemePrefs() {
    return React.useContext(stateContext);
}
export function useSetThemePrefs() {
    return React.useContext(setContext);
}
