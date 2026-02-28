import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useBreakpoints, useGutters } from '#/alf';
import { Text } from '#/components/Typography';
export function FormContainer(_a) {
    var testID = _a.testID, titleText = _a.titleText, children = _a.children, style = _a.style;
    var gtMobile = useBreakpoints().gtMobile;
    var gutter = useGutters([0, 'wide']);
    return (_jsxs(View, { testID: testID, style: [a.gap_md, a.flex_1, !gtMobile && gutter, style], children: [titleText && !gtMobile && (_jsx(Text, { style: [a.text_3xl, a.font_bold], children: titleText })), children] }));
}
