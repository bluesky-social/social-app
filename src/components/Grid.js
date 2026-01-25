import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { atoms as a } from '#/alf';
var Context = createContext({
    gap: 0,
});
Context.displayName = 'GridContext';
export function Row(_a) {
    var children = _a.children, _b = _a.gap, gap = _b === void 0 ? 0 : _b, style = _a.style;
    return (_jsx(Context.Provider, { value: useMemo(function () { return ({ gap: gap }); }, [gap]), children: _jsx(View, { style: [
                a.flex_row,
                a.flex_1,
                {
                    marginLeft: -gap / 2,
                    marginRight: -gap / 2,
                },
                style,
            ], children: children }) }));
}
export function Col(_a) {
    var children = _a.children, _b = _a.width, width = _b === void 0 ? 1 : _b, style = _a.style;
    var gap = useContext(Context).gap;
    return (_jsx(View, { style: [
            a.flex_col,
            {
                paddingLeft: gap / 2,
                paddingRight: gap / 2,
                width: "".concat(width * 100, "%"),
            },
            style,
        ], children: children }));
}
