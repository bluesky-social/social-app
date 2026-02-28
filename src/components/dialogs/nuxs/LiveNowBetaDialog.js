var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a, select, useTheme, utils, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useNuxDialogContext } from '#/components/dialogs/nuxs';
import { createIsEnabledCheck, isExistingUserAsOf, } from '#/components/dialogs/nuxs/utils';
import { Beaker_Stroke2_Corner2_Rounded as BeakerIcon } from '#/components/icons/Beaker';
import { Text } from '#/components/Typography';
import { IS_E2E, IS_WEB } from '#/env';
export var enabled = createIsEnabledCheck(function (props) {
    return (!IS_E2E &&
        isExistingUserAsOf('2026-01-16T00:00:00.000Z', props.currentProfile.createdAt) &&
        !props.features.enabled(props.features.LiveNowBetaDisable));
});
export function LiveNowBetaDialog() {
    var t = useTheme();
    var _ = useLingui()._;
    var nuxDialogs = useNuxDialogContext();
    var control = Dialog.useDialogControl();
    Dialog.useAutoOpen(control);
    var onClose = useCallback(function () {
        nuxDialogs.dismissActiveNux();
    }, [nuxDialogs]);
    var shadowColor = useMemo(function () {
        return select(t.name, {
            light: utils.alpha(t.palette.primary_900, 0.4),
            dark: utils.alpha(t.palette.primary_25, 0.4),
            dim: utils.alpha(t.palette.primary_25, 0.4),
        });
    }, [t]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, { fill: t.palette.primary_700 }), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Show when you\u2019re live"], ["Show when you\u2019re live"])))), style: [web({ maxWidth: 440 })], contentContainerStyle: [
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
                        ], children: [_jsx(LinearGradient, { colors: [
                                    t.palette.primary_100,
                                    utils.alpha(t.palette.primary_100, 0),
                                ], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, style: [a.absolute, a.inset_0] }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(BeakerIcon, { fill: t.palette.primary_700, size: "sm" }), _jsx(Text, { style: [
                                            a.font_semi_bold,
                                            {
                                                color: t.palette.primary_700,
                                            },
                                        ], children: _jsx(Trans, { children: "Beta Feature" }) })] }), _jsx(View, { style: [
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
                                            aspectRatio: 652 / 211,
                                        },
                                        IS_WEB
                                            ? [
                                                {
                                                    boxShadow: "0px 10px 15px -3px ".concat(shadowColor),
                                                },
                                            ]
                                            : [
                                                t.atoms.shadow_md,
                                                {
                                                    shadowColor: shadowColor,
                                                    shadowOpacity: 0.2,
                                                    shadowOffset: {
                                                        width: 0,
                                                        height: 10,
                                                    },
                                                },
                                            ],
                                    ], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/live_now_beta.webp'), style: [
                                            a.w_full,
                                            {
                                                aspectRatio: 652 / 211,
                                            },
                                        ], alt: _(msg({
                                            message: "A screenshot of a post from @esb.lol, showing the user is currently livestreaming content on Twitch. The post reads: \"Hello! I'm live on Twitch, and I'm testing Bluesky's latest feature too!\"",
                                            comment: 'Contains a post that originally appeared in English. Consider translating the post text if it makes sense in your language, and noting that the post was translated from English.',
                                        })) }) }) })] }), _jsxs(View, { style: [a.align_center, a.px_xl, a.gap_2xl, a.pb_sm], children: [_jsxs(View, { style: [a.gap_sm, a.align_center], children: [_jsx(Text, { style: [
                                            a.text_3xl,
                                            a.leading_tight,
                                            a.font_bold,
                                            a.text_center,
                                            {
                                                fontSize: IS_WEB ? 28 : 32,
                                                maxWidth: 360,
                                            },
                                        ], children: _jsx(Trans, { children: "Show when you\u2019re live" }) }), _jsx(Text, { style: [
                                            a.text_md,
                                            a.leading_snug,
                                            a.text_center,
                                            {
                                                maxWidth: 340,
                                            },
                                        ], children: _jsx(Trans, { children: "Streaming on Twitch? Set your live status on Bluesky to add a badge to your avatar. Tapping it takes people straight to your stream." }) })] }), !IS_WEB && (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close"], ["Close"])))), size: "large", color: "primary", onPress: function () {
                                    control.close();
                                }, style: [a.w_full], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }))] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2;
