var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
export function ContactsHeroImage() {
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(View, { style: [
            a.w_full,
            a.pl_3xl,
            a.pr_2xl,
            a.pt_4xl,
            a.pb_3xl,
            a.rounded_lg,
            { backgroundColor: t.palette.primary_50 },
        ], children: _jsx(Image, { source: require('../../../../assets/images/find_friends_illustration.webp'), accessibilityIgnoresInvertColors: true, style: [a.w_full, { aspectRatio: 1278 / 661 }], alt: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["An illustration depicting user avatars flowing from a contact book into the Bluesky app"], ["An illustration depicting user avatars flowing from a contact book into the Bluesky app"])))) }) }));
}
var templateObject_1;
