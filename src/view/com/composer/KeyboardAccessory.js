import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { atoms as a, useTheme } from '#/alf';
import { IS_WEB } from '#/env';
export function KeyboardAccessory(_a) {
    var children = _a.children;
    var t = useTheme();
    var bottom = useSafeAreaInsets().bottom;
    var style = [
        a.flex_row,
        a.py_xs,
        a.pl_sm,
        a.pr_xl,
        a.align_center,
        a.border_t,
        t.atoms.border_contrast_medium,
        t.atoms.bg,
    ];
    // todo: when iPad support is added, it should also not use the KeyboardStickyView
    if (IS_WEB) {
        return _jsx(View, { style: style, children: children });
    }
    return (_jsx(KeyboardStickyView, { offset: { closed: -bottom }, style: style, children: children }));
}
