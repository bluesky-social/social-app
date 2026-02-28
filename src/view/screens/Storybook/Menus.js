var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as Search } from '#/components/icons/MagnifyingGlass';
import * as Menu from '#/components/Menu';
import { Text } from '#/components/Typography';
// import {useDialogStateControlContext} from '#/state/dialogs'
export function Menus() {
    var t = useTheme();
    var menuControl = Menu.useMenuControl();
    // const {closeAllDialogs} = useDialogStateControlContext()
    return (_jsx(View, { style: [a.gap_md], children: _jsx(View, { style: [a.flex_row, a.align_start], children: _jsxs(Menu.Root, { control: menuControl, children: [_jsx(Menu.Trigger, { label: "Open basic menu", children: function (_a) {
                            var state = _a.state, props = _a.props;
                            return (_jsx(Text, __assign({}, props, { style: [
                                    a.py_sm,
                                    a.px_md,
                                    a.rounded_sm,
                                    t.atoms.bg_contrast_50,
                                    (state.hovered || state.focused || state.pressed) && [
                                        t.atoms.bg_contrast_200,
                                    ],
                                ], children: "Open" })));
                        } }), _jsxs(Menu.Outer, { children: [_jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: "Click me", onPress: function () { }, children: [_jsx(Menu.ItemIcon, { icon: Search }), _jsx(Menu.ItemText, { children: "Click me" })] }), _jsx(Menu.Item, { label: "Another item", onPress: function () { return menuControl.close(); }, children: _jsx(Menu.ItemText, { children: "Another item" }) })] }), _jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: "Click me", onPress: function () { }, children: [_jsx(Menu.ItemIcon, { icon: Search }), _jsx(Menu.ItemText, { children: "Click me" })] }), _jsx(Menu.Item, { label: "Another item", onPress: function () { return menuControl.close(); }, children: _jsx(Menu.ItemText, { children: "Another item" }) })] }), _jsx(Menu.Divider, {}), _jsxs(Menu.Item, { label: "Click me", onPress: function () { }, children: [_jsx(Menu.ItemIcon, { icon: Search }), _jsx(Menu.ItemText, { children: "Click me" })] })] })] }) }) }));
}
