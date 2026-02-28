var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { atoms, useTheme } from '#/alf';
/**
 * NOT FINISHED, just here as a reference
 */
export function InputGroup(props) {
    var t = useTheme();
    var children = React.Children.toArray(props.children);
    var total = children.length;
    return (_jsx(View, { style: [atoms.w_full], children: children.map(function (child, i) {
            var _a;
            return React.isValidElement(child) ? (_jsxs(React.Fragment, { children: [i > 0 ? (_jsx(View, { style: [atoms.border_b, { borderColor: t.palette.contrast_500 }] })) : null, React.cloneElement(child, {
                        // @ts-ignore
                        style: __spreadArray(__spreadArray([], (Array.isArray((_a = child.props) === null || _a === void 0 ? void 0 : _a.style)
                            ? // @ts-ignore
                                child.props.style
                            : // @ts-ignore
                                [child.props.style || {}]), true), [
                            {
                                borderTopLeftRadius: i > 0 ? 0 : undefined,
                                borderTopRightRadius: i > 0 ? 0 : undefined,
                                borderBottomLeftRadius: i < total - 1 ? 0 : undefined,
                                borderBottomRightRadius: i < total - 1 ? 0 : undefined,
                                borderBottomWidth: i < total - 1 ? 0 : undefined,
                            },
                        ], false),
                    })] }, i)) : null;
        }) }));
}
