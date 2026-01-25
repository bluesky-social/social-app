var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { urls } from '#/lib/constants';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useNuxDialogContext } from '#/components/dialogs/nuxs';
import { Sparkle_Stroke2_Corner0_Rounded as SparkleIcon } from '#/components/icons/Sparkle';
import { VerifierCheck } from '#/components/icons/VerifierCheck';
import { Link } from '#/components/Link';
import { Span, Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
export function InitialVerificationAnnouncement() {
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gtMobile = useBreakpoints().gtMobile;
    var nuxDialogs = useNuxDialogContext();
    var control = Dialog.useDialogControl();
    Dialog.useAutoOpen(control);
    var onClose = useCallback(function () {
        nuxDialogs.dismissActiveNux();
    }, [nuxDialogs]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Announcing verification on Bluesky"], ["Announcing verification on Bluesky"])))), style: [
                    gtMobile ? { width: 'auto', maxWidth: 400, minWidth: 200 } : a.w_full,
                ], children: [_jsxs(View, { style: [a.align_start, a.gap_xl], children: [_jsxs(View, { style: [
                                    a.pl_sm,
                                    a.pr_md,
                                    a.py_sm,
                                    a.rounded_full,
                                    a.flex_row,
                                    a.align_center,
                                    a.gap_xs,
                                    {
                                        backgroundColor: t.palette.primary_25,
                                    },
                                ], children: [_jsx(SparkleIcon, { fill: t.palette.primary_700, size: "sm" }), _jsx(Text, { style: [
                                            a.font_semi_bold,
                                            {
                                                color: t.palette.primary_700,
                                            },
                                        ], children: _jsx(Trans, { children: "New Feature" }) })] }), _jsx(View, { style: [
                                    a.w_full,
                                    a.rounded_md,
                                    a.overflow_hidden,
                                    t.atoms.bg_contrast_25,
                                    { minHeight: 100 },
                                ], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/initial_verification_announcement_1.png'), style: [
                                        {
                                            aspectRatio: 353 / 160,
                                        },
                                    ], alt: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts."], ["An illustration showing that Bluesky selects trusted verifiers, and trusted verifiers in turn verify individual user accounts."])))) }) }), _jsxs(View, { style: [a.gap_xs], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { children: "A new form of verification" }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsx(Trans, { children: "We\u2019re introducing a new layer of verification on Bluesky \u2014 an easy-to-see checkmark." }) })] }), _jsx(View, { style: [
                                    a.w_full,
                                    a.rounded_md,
                                    a.overflow_hidden,
                                    t.atoms.bg_contrast_25,
                                    { minHeight: 100 },
                                ], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/initial_verification_announcement_2.png'), style: [
                                        {
                                            aspectRatio: 353 / 196,
                                        },
                                    ], alt: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["An mockup of a iPhone showing the Bluesky app open to the profile of a verified user with a blue checkmark next to their display name."], ["An mockup of a iPhone showing the Bluesky app open to the profile of a verified user with a blue checkmark next to their display name."])))) }) }), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(VerifierCheck, { width: 14 }), _jsx(Text, { style: [a.text_lg, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { children: "Who can verify?" }) })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsx(Trans, { children: "Bluesky will proactively verify notable and authentic accounts." }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsxs(Trans, { children: ["Trust emerges from relationships, communities, and shared context, so we\u2019re also enabling", ' ', _jsx(Span, { style: [a.font_semi_bold], children: "trusted verifiers" }), ": organizations that can directly issue verification."] }) }), _jsx(Text, { style: [a.leading_snug, a.text_md], children: _jsx(Trans, { children: "When you tap on a check, you\u2019ll see which organizations have granted verification." }) })] })] }), _jsxs(View, { style: [a.w_full, a.gap_md], children: [_jsx(Link, { overridePresentation: true, to: urls.website.blog.initialVerificationAnnouncement, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Read blog post"], ["Read blog post"])))), size: "small", variant: "solid", color: "primary", style: [a.justify_center, a.w_full], onPress: function () {
                                            ax.metric('verification:learn-more', {
                                                location: 'initialAnnouncementeNux',
                                            });
                                        }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Read blog post" }) }) }), IS_NATIVE && (_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Close"], ["Close"])))), size: "small", variant: "solid", color: "secondary", style: [a.justify_center, a.w_full], onPress: function () {
                                            control.close();
                                        }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }))] })] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
