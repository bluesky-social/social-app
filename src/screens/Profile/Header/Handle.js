var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { isInvalidHandle, sanitizeHandle } from '#/lib/strings/handles';
import { atoms as a, useTheme, web } from '#/alf';
import { NewskieDialog } from '#/components/NewskieDialog';
import { Text } from '#/components/Typography';
import { IS_IOS, IS_NATIVE } from '#/env';
export function ProfileHeaderHandle(_a) {
    var _b, _c, _d;
    var profile = _a.profile, disableTaps = _a.disableTaps;
    var t = useTheme();
    var _ = useLingui()._;
    var invalidHandle = isInvalidHandle(profile.handle);
    var blockHide = ((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.blocking) || ((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.blockedBy);
    return (_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center, { maxWidth: '100%' }], pointerEvents: disableTaps ? 'none' : IS_IOS ? 'auto' : 'box-none', children: [_jsx(NewskieDialog, { profile: profile, disabled: disableTaps }), ((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.followedBy) && !blockHide ? (_jsx(View, { style: [t.atoms.bg_contrast_50, a.rounded_xs, a.px_sm, a.py_xs], children: _jsx(Text, { style: [t.atoms.text, a.text_sm], children: _jsx(Trans, { children: "Follows you" }) }) })) : undefined, _jsx(Text, { emoji: true, numberOfLines: 1, style: [
                    invalidHandle
                        ? [
                            a.border,
                            a.text_xs,
                            a.px_sm,
                            a.py_xs,
                            a.rounded_xs,
                            { borderColor: t.palette.contrast_200 },
                        ]
                        : [a.text_md, a.leading_snug, t.atoms.text_contrast_medium],
                    web({
                        wordBreak: 'break-all',
                        direction: 'ltr',
                        unicodeBidi: 'isolate',
                    }),
                ], children: invalidHandle
                    ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\u26A0Invalid Handle"], ["\u26A0Invalid Handle"]))))
                    : sanitizeHandle(profile.handle, '@', 
                    // forceLTR handled by CSS above on web
                    IS_NATIVE) })] }));
}
var templateObject_1;
