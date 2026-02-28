var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useNuxDialogContext } from '#/components/dialogs/nuxs';
import { Sparkle_Stroke2_Corner0_Rounded as SparkleIcon } from '#/components/icons/Sparkle';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
export function ActivitySubscriptionsNUX() {
    var t = useTheme();
    var _ = useLingui()._;
    var nuxDialogs = useNuxDialogContext();
    var control = Dialog.useDialogControl();
    Dialog.useAutoOpen(control);
    var onClose = useCallback(function () {
        nuxDialogs.dismissActiveNux();
    }, [nuxDialogs]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Introducing activity notifications"], ["Introducing activity notifications"])))), style: [web({ maxWidth: 400 })], contentContainerStyle: [
                    {
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                    },
                ], children: [_jsxs(View, { style: [
                            a.align_center,
                            a.overflow_hidden,
                            t.atoms.bg_contrast_25,
                            {
                                gap: IS_WEB ? 16 : 24,
                                paddingTop: IS_WEB ? 24 : 48,
                                borderTopLeftRadius: a.rounded_md.borderRadius,
                                borderTopRightRadius: a.rounded_md.borderRadius,
                            },
                        ], children: [_jsxs(View, { style: [
                                    a.pl_sm,
                                    a.pr_md,
                                    a.py_sm,
                                    a.rounded_full,
                                    a.flex_row,
                                    a.align_center,
                                    a.gap_xs,
                                    {
                                        backgroundColor: t.palette.primary_100,
                                    },
                                ], children: [_jsx(SparkleIcon, { fill: t.palette.primary_800, size: "sm" }), _jsx(Text, { style: [
                                            a.font_semi_bold,
                                            {
                                                color: t.palette.primary_800,
                                            },
                                        ], children: _jsx(Trans, { children: "New Feature" }) })] }), _jsxs(View, { style: [a.relative, a.w_full], children: [_jsx(View, { style: [
                                            a.absolute,
                                            t.atoms.bg_contrast_25,
                                            t.atoms.shadow_md,
                                            {
                                                shadowOpacity: 0.4,
                                                top: 5,
                                                bottom: 0,
                                                left: '17%',
                                                right: '17%',
                                                width: '66%',
                                                borderTopLeftRadius: 40,
                                                borderTopRightRadius: 40,
                                            },
                                        ] }), _jsx(View, { style: [
                                            a.overflow_hidden,
                                            {
                                                aspectRatio: 398 / 228,
                                            },
                                        ], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/activity_notifications_announcement.webp'), style: [
                                                a.w_full,
                                                {
                                                    aspectRatio: 398 / 268,
                                                },
                                            ], alt: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["A screenshot of a profile page with a bell icon next to the follow button, indicating the new activity notifications feature."], ["A screenshot of a profile page with a bell icon next to the follow button, indicating the new activity notifications feature."])))) }) })] })] }), _jsxs(View, { style: [
                            a.align_center,
                            a.px_xl,
                            IS_WEB ? [a.pt_xl, a.gap_xl, a.pb_sm] : [a.pt_3xl, a.gap_3xl],
                        ], children: [_jsxs(View, { style: [a.gap_md, a.align_center], children: [_jsx(Text, { style: [
                                            a.text_3xl,
                                            a.leading_tight,
                                            a.font_bold,
                                            a.text_center,
                                            {
                                                fontSize: IS_WEB ? 28 : 32,
                                                maxWidth: 300,
                                            },
                                        ], children: _jsx(Trans, { children: "Get notified when someone posts" }) }), _jsx(Text, { style: [
                                            a.text_md,
                                            a.leading_snug,
                                            a.text_center,
                                            {
                                                maxWidth: 340,
                                            },
                                        ], children: _jsx(Trans, { children: "You can now choose to be notified when specific people post. If there\u2019s someone you want timely updates from, go to their profile and find the new bell icon near the follow button." }) })] }), !IS_WEB && (_jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Close"], ["Close"])))), size: "large", variant: "solid", color: "primary", onPress: function () {
                                    control.close();
                                }, style: [a.w_full, { maxWidth: 280 }], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }))] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
