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
import { isFindContactsFeatureEnabled } from '#/components/contacts/country-allowlist';
import * as Dialog from '#/components/Dialog';
import { useNuxDialogContext } from '#/components/dialogs/nuxs';
import { createIsEnabledCheck, isExistingUserAsOf, } from '#/components/dialogs/nuxs/utils';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_E2E, IS_NATIVE, IS_WEB } from '#/env';
import { navigate } from '#/Navigation';
export var enabled = createIsEnabledCheck(function (props) {
    return (!IS_E2E &&
        IS_NATIVE &&
        isExistingUserAsOf('2025-12-16T00:00:00.000Z', props.currentProfile.createdAt) &&
        isFindContactsFeatureEnabled(props.geolocation.countryCode));
});
export function FindContactsAnnouncement() {
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var nuxDialogs = useNuxDialogContext();
    var control = Dialog.useDialogControl();
    Dialog.useAutoOpen(control);
    var onClose = useCallback(function () {
        nuxDialogs.dismissActiveNux();
    }, [nuxDialogs]);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Introducing finding friends via contacts"], ["Introducing finding friends via contacts"])))), style: [web({ maxWidth: 440 })], contentContainerStyle: [
                    {
                        paddingTop: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                    },
                ], children: [_jsxs(View, { style: [a.align_center, a.pt_3xl], children: [_jsx(LinearGradient, { colors: [t.palette.primary_200, t.atoms.bg.backgroundColor], locations: [0, 1], start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, style: [a.absolute, a.inset_0] }), _jsx(View, { style: [a.w_full, a.pt_sm, a.px_5xl, a.pb_4xl], children: _jsx(Image, { accessibilityIgnoresInvertColors: true, source: require('../../../../assets/images/find_friends_illustration.webp'), style: [a.w_full, { aspectRatio: 1278 / 661 }], alt: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["An illustration depicting user avatars flowing from a contact book into the Bluesky app"], ["An illustration depicting user avatars flowing from a contact book into the Bluesky app"])))) }) })] }), _jsxs(View, { style: [a.align_center, a.px_xl, a.gap_5xl], children: [_jsxs(View, { style: [a.gap_sm, a.align_center], children: [_jsx(Text, { style: [
                                            a.text_4xl,
                                            a.leading_tight,
                                            a.font_bold,
                                            a.text_center,
                                            {
                                                fontSize: IS_WEB ? 28 : 32,
                                                maxWidth: 300,
                                            },
                                        ], children: _jsx(Trans, { children: "Find your friends" }) }), _jsx(Text, { style: [
                                            a.text_md,
                                            t.atoms.text_contrast_medium,
                                            a.leading_snug,
                                            a.text_center,
                                            { maxWidth: 340 },
                                        ], children: _jsx(Trans, { children: "Bluesky is more fun with friends! Import your contacts to see who\u2019s already here." }) })] }), _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Import Contacts"], ["Import Contacts"])))), size: "large", color: "primary", onPress: function () {
                                    ax.metric('contacts:nux:ctaPressed', {});
                                    control.close(function () {
                                        navigate('FindContactsFlow');
                                    });
                                }, style: [a.w_full], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Import Contacts" }) }) })] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
