var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme, web } from '#/alf';
import { transparentifyColor } from '#/alf/util/colorGeneration';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useNuxDialogContext } from '#/components/dialogs/nuxs';
import { Sparkle_Stroke2_Corner0_Rounded as SparkleIcon } from '#/components/icons/Sparkle';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
export function BookmarksAnnouncement() {
    var t = useTheme();
    var _ = useLingui()._;
    var nuxDialogs = useNuxDialogContext();
    var control = Dialog.useDialogControl();
    Dialog.useAutoOpen(control);
    var onClose = useCallback(function () {
        nuxDialogs.dismissActiveNux();
    }, [nuxDialogs]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Introducing saved posts AKA bookmarks"], ["Introducing saved posts AKA bookmarks"])))), style: [web({ maxWidth: 440 })], contentContainerStyle: [
                    {
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                    },
                ], children: [_jsxs(View, { style: [
                            a.align_center,
                            a.overflow_hidden,
                            {
                                gap: 16,
                                paddingTop: IS_WEB ? 24 : 40,
                                borderTopLeftRadius: a.rounded_md.borderRadius,
                                borderTopRightRadius: a.rounded_md.borderRadius,
                            },
                        ], children: [_jsx(LinearGradient, { colors: [t.palette.primary_25, t.palette.primary_100], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, style: [a.absolute, a.inset_0] }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(SparkleIcon, { fill: t.palette.primary_800, size: "sm" }), _jsx(Text, { style: [
                                            a.font_semi_bold,
                                            {
                                                color: t.palette.primary_800,
                                            },
                                        ], children: _jsx(Trans, { children: "New Feature" }) })] }), _jsx(View, { style: [
                                    a.relative,
                                    a.w_full,
                                    {
                                        paddingTop: 8,
                                        paddingHorizontal: 32,
                                        paddingBottom: 32,
                                    },
                                ], children: _jsx(View, { style: [
                                        {
                                            borderRadius: 24,
                                            aspectRatio: 333 / 104,
                                        },
                                        IS_WEB
                                            ? [
                                                {
                                                    boxShadow: "0px 10px 15px -3px ".concat(transparentifyColor(t.palette.black, 0.2)),
                                                },
                                            ]
                                            : [
                                                t.atoms.shadow_md,
                                                {
                                                    shadowOpacity: 0.2,
                                                    shadowOffset: {
                                                        width: 0,
                                                        height: 10,
                                                    },
                                                },
                                            ],
                                    ], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/bookmarks_announcement_nux.webp'), style: [
                                            a.w_full,
                                            {
                                                aspectRatio: 333 / 104,
                                            },
                                        ], alt: _(msg({
                                            message: "A screenshot of a post with a new button next to the share button that allows you to save the post to your bookmarks. The post is from @jcsalterego.bsky.social and reads \"inventing a saturday that immediately follows monday\".",
                                            comment: 'Contains a post that originally appeared in English. Consider translating the post text if it makes sense in your language, and noting that the post was translated from English.',
                                        })) }) }) })] }), _jsxs(View, { style: [a.align_center, a.px_xl, a.pt_xl, a.gap_2xl, a.pb_sm], children: [_jsxs(View, { style: [a.gap_sm, a.align_center], children: [_jsx(Text, { style: [
                                            a.text_3xl,
                                            a.leading_tight,
                                            a.font_bold,
                                            a.text_center,
                                            {
                                                fontSize: IS_WEB ? 28 : 32,
                                                maxWidth: 300,
                                            },
                                        ], children: _jsx(Trans, { children: "Saved Posts" }) }), _jsx(Text, { style: [
                                            a.text_md,
                                            a.leading_snug,
                                            a.text_center,
                                            {
                                                maxWidth: 340,
                                            },
                                        ], children: _jsx(Trans, { children: "Finally! Keep track of posts that matter to you. Save them to revisit anytime." }) })] }), !IS_WEB && (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close"], ["Close"])))), size: "large", color: "primary", onPress: function () {
                                    control.close();
                                }, style: [a.w_full], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }))] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2;
