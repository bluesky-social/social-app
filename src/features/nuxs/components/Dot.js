import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
/**
 * The little blue dot used to nudge a user towards a certain feature. The dot
 * is absolutely positioned, and is intended to be configured by passing in
 * positional styles via `top`, `bottom`, `left`, and `right` props.
 */
export function Dot(_a) {
    var top = _a.top, bottom = _a.bottom, left = _a.left, right = _a.right;
    var t = useTheme();
    return (_jsx(View, { style: [a.absolute, { top: top, bottom: bottom, left: left, right: right }], children: _jsx(View, { style: [
                a.rounded_full,
                {
                    height: 8,
                    width: 8,
                    backgroundColor: t.palette.primary_500,
                },
            ] }) }));
}
