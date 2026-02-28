var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useNuxDialogContext } from '#/components/dialogs/nuxs';
import { Sparkle_Stroke2_Corner0_Rounded as SparkleIcon } from '#/components/icons/Sparkle';
import { Text } from '#/components/Typography';
import { IS_E2E, IS_NATIVE, IS_WEB } from '#/env';
import { createIsEnabledCheck, isExistingUserAsOf } from './utils';
export var enabled = createIsEnabledCheck(function (props) {
    return (!IS_E2E &&
        IS_NATIVE &&
        isExistingUserAsOf('2026-02-05T00:00:00.000Z', props.currentProfile.createdAt));
});
export function DraftsAnnouncement() {
    var t = useTheme();
    var _ = useLingui()._;
    var nuxDialogs = useNuxDialogContext();
    var control = Dialog.useDialogControl();
    Dialog.useAutoOpen(control);
    var onClose = useCallback(function () {
        nuxDialogs.dismissActiveNux();
    }, [nuxDialogs]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, { fill: t.palette.primary_400 }), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Introducing drafts"], ["Introducing drafts"])))), style: [web({ maxWidth: 440 })], contentContainerStyle: [
                    {
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                    },
                ], children: [_jsxs(View, { style: [
                            a.align_center,
                            a.overflow_hidden,
                            {
                                paddingTop: IS_WEB ? 24 : 40,
                                borderTopLeftRadius: a.rounded_md.borderRadius,
                                borderTopRightRadius: a.rounded_md.borderRadius,
                            },
                        ], children: [_jsx(LinearGradient, { colors: [t.palette.primary_100, t.palette.primary_200], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, style: [a.absolute, a.inset_0] }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs, { marginBottom: -12 }], children: [_jsx(SparkleIcon, { fill: t.palette.primary_800, size: "sm" }), _jsx(Text, { style: [
                                            a.font_semi_bold,
                                            {
                                                color: t.palette.primary_800,
                                            },
                                        ], children: _jsx(Trans, { children: "New Feature" }) })] }), _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/drafts_announcement_nux.webp'), style: [
                                    a.w_full,
                                    {
                                        aspectRatio: 393 / 226,
                                    },
                                ], alt: _(msg({
                                    message: "A screenshot of the post composer with a new button next to the post button that says \"Drafts\", with a rainbow firework effect. Below, the text in the composer reads \"Hey, did you hear the news? Bluesky has drafts now!!!\".",
                                    comment: 'Contains a post that originally appeared in English. Consider translating the post text if it makes sense in your language, and noting that the post was translated from English.',
                                })) })] }), _jsxs(View, { style: [a.align_center, a.px_xl, a.pt_xl, a.gap_2xl, a.pb_sm], children: [_jsxs(View, { style: [a.gap_sm, a.align_center], children: [_jsx(Text, { style: [
                                            a.text_3xl,
                                            a.leading_tight,
                                            a.font_bold,
                                            a.text_center,
                                            {
                                                fontSize: IS_WEB ? 28 : 32,
                                                maxWidth: 300,
                                            },
                                        ], children: _jsx(Trans, { children: "Drafts" }) }), _jsx(Text, { style: [
                                            a.text_md,
                                            a.leading_snug,
                                            a.text_center,
                                            {
                                                maxWidth: 340,
                                            },
                                        ], children: _jsx(Trans, { children: "Not ready to hit post? Keep your best ideas in Drafts until the timing is just right." }) })] }), !IS_WEB && (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close"], ["Close"])))), size: "large", color: "primary", onPress: function () { return control.close(); }, style: [a.w_full], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Finally!" }) }) }))] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2;
