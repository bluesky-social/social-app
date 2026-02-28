var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { AvatarStack } from '#/components/AvatarStack';
import { ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon } from '#/components/icons/Arrow';
import { Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon } from '#/components/icons/Envelope';
import { Link } from '#/components/Link';
export function InboxPreview(_a) {
    var profiles = _a.profiles;
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsxs(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Chat request inbox"], ["Chat request inbox"])))), style: [
            a.flex_1,
            a.px_xl,
            a.py_sm,
            a.flex_row,
            a.align_center,
            a.gap_md,
            a.border_t,
            { marginTop: a.border_t.borderTopWidth * -1 },
            a.border_b,
            t.atoms.border_contrast_low,
            { minHeight: 44 },
            a.rounded_0,
        ], to: "/messages/inbox", color: "secondary", variant: "solid", children: [_jsxs(View, { style: [a.relative], children: [_jsx(ButtonIcon, { icon: EnvelopeIcon, size: "lg" }), profiles.length > 0 && (_jsx(View, { style: [
                            a.absolute,
                            a.rounded_full,
                            a.z_20,
                            {
                                top: -4,
                                right: -5,
                                width: 10,
                                height: 10,
                                backgroundColor: t.palette.primary_500,
                            },
                        ] }))] }), _jsx(ButtonText, { style: [a.flex_1, a.font_semi_bold, a.text_left], numberOfLines: 1, children: _jsx(Trans, { children: "Chat requests" }) }), _jsx(AvatarStack, { profiles: profiles, backgroundColor: t.atoms.bg_contrast_25.backgroundColor }), _jsx(ButtonIcon, { icon: ArrowRightIcon, size: "lg" })] }));
}
var templateObject_1;
