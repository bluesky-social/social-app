import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { ButtonText } from '#/components/Button';
import { InlineLinkText, Link } from '#/components/Link';
import { H1, Text } from '#/components/Typography';
export function Links() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.gap_md, a.align_start], children: [_jsx(H1, { children: "Links" }), _jsxs(View, { style: [a.gap_md, a.align_start], children: [_jsx(InlineLinkText, { label: "foo", to: "https://google.com", style: [a.text_lg], children: "https://google.com" }), _jsx(InlineLinkText, { label: "foo", to: "https://google.com", style: [a.text_lg], children: "External with custom children (google.com)" }), _jsx(InlineLinkText, { label: "foo", to: "https://bsky.social", style: [a.text_md, t.atoms.text_contrast_low], children: "Internal (bsky.social)" }), _jsx(InlineLinkText, { label: "foo", to: "https://bsky.app/profile/bsky.app", style: [a.text_md], children: "Internal (bsky.app)" }), _jsx(Link, { variant: "solid", color: "primary", size: "large", label: "View @bsky.app's profile", to: "https://bsky.app/profile/bsky.app", children: _jsx(ButtonText, { children: "Link as a button" }) }), _jsx(Link, { label: "View @bsky.app's profile", to: "https://bsky.app/profile/bsky.app", children: _jsxs(View, { style: [
                                a.flex_row,
                                a.align_center,
                                a.gap_md,
                                a.rounded_md,
                                a.p_md,
                                t.atoms.bg_contrast_25,
                            ], children: [_jsx(View, { style: [
                                        { width: 32, height: 32 },
                                        a.rounded_full,
                                        t.atoms.bg_contrast_200,
                                    ] }), _jsx(Text, { children: "View @bsky.app's profile" })] }) })] })] }));
}
