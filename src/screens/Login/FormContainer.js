import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
export function FormContainer(_a) {
    var testID = _a.testID, titleText = _a.titleText, children = _a.children, style = _a.style;
    var gtMobile = useBreakpoints().gtMobile;
    var t = useTheme();
    return (_jsxs(View, { testID: testID, style: [a.gap_md, a.flex_1, !gtMobile && [a.px_lg, a.py_md], style], children: [titleText && !gtMobile && (_jsx(Text, { style: [a.text_xl, a.font_semi_bold, t.atoms.text_contrast_high], children: titleText })), children] }));
}
