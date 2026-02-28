import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { ButtonText } from '#/components/Button';
import { BookmarkDeleteLarge } from '#/components/icons/Bookmark';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
export function EmptyState() {
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsxs(View, { style: [
            a.align_center,
            {
                paddingVertical: 64,
            },
        ], children: [_jsx(BookmarkDeleteLarge, { width: 64, fill: t.atoms.text_contrast_medium.color }), _jsx(View, { style: [a.pt_sm], children: _jsx(Text, { style: [
                        a.text_lg,
                        a.font_medium,
                        a.text_center,
                        t.atoms.text_contrast_medium,
                    ], children: _jsx(Trans, { children: "Nothing saved yet" }) }) }), _jsx(View, { style: [a.pt_2xl], children: _jsx(Link, { to: "/", action: "navigate", label: _(msg({
                        message: "Go home",
                        context: "Button to go back to the home timeline",
                    })), size: "small", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { context: "Button to go back to the home timeline", children: "Go home" }) }) }) })] }));
}
