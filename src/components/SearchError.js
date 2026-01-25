import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
export function SearchError(_a) {
    var title = _a.title, children = _a.children;
    var gtMobile = useBreakpoints().gtMobile;
    var t = useTheme();
    return (_jsx(Layout.Content, { children: _jsxs(View, { style: [
                a.align_center,
                a.gap_4xl,
                a.px_xl,
                {
                    paddingVertical: 150,
                },
            ], children: [_jsx(XIcon, { width: 32, style: [t.atoms.text_contrast_low] }), _jsxs(View, { style: [
                        a.align_center,
                        { maxWidth: gtMobile ? 394 : 294 },
                        gtMobile ? a.gap_md : a.gap_sm,
                    ], children: [_jsx(Text, { style: [
                                a.font_semi_bold,
                                a.text_lg,
                                a.text_center,
                                a.leading_snug,
                            ], children: title }), children] })] }) }));
}
