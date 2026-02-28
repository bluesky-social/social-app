import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { darkTheme, defaultTheme, dimTheme } from './themes';
export var ThemeContext = createContext(defaultTheme);
ThemeContext.displayName = 'ThemeContext';
export var useTheme = function () { return useContext(ThemeContext); };
function getTheme(theme) {
    switch (theme) {
        case 'light':
            return defaultTheme;
        case 'dim':
            return dimTheme;
        case 'dark':
            return darkTheme;
        default:
            return defaultTheme;
    }
}
export var ThemeProvider = function (_a) {
    var theme = _a.theme, children = _a.children;
    var themeValue = getTheme(theme);
    return (_jsx(ThemeContext.Provider, { value: themeValue, children: children }));
};
