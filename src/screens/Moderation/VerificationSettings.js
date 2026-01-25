var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { urls } from '#/lib/constants';
import { usePreferencesQuery, } from '#/state/queries/preferences';
import { useSetVerificationPrefsMutation } from '#/state/queries/preferences';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import { atoms as a, useGutters } from '#/alf';
import { Admonition } from '#/components/Admonition';
import * as Toggle from '#/components/forms/Toggle';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { useAnalytics } from '#/analytics';
export function Screen() {
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gutters = useGutters(['base']);
    var preferences = usePreferencesQuery().data;
    return (_jsxs(Layout.Screen, { testID: "ModerationVerificationSettingsScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Verification Settings" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsx(SettingsList.Item, { children: _jsx(Admonition, { type: "tip", style: [a.flex_1], children: _jsxs(Trans, { children: ["Verifications on Bluesky work differently than on other platforms.", ' ', _jsx(InlineLinkText, { overridePresentation: true, to: urls.website.blog.initialVerificationAnnouncement, label: _(msg({
                                                message: "Learn more",
                                                context: "english-only-resource",
                                            })), onPress: function () {
                                                ax.metric('verification:learn-more', {
                                                    location: 'verificationSettings',
                                                });
                                            }, children: "Learn more here." })] }) }) }), preferences ? (_jsx(Inner, { preferences: preferences })) : (_jsx(View, { style: [gutters, a.justify_center, a.align_center], children: _jsx(Loader, { size: "xl" }) }))] }) })] }));
}
function Inner(_a) {
    var preferences = _a.preferences;
    var _ = useLingui()._;
    var hideBadges = preferences.verificationPrefs.hideBadges;
    var _b = useSetVerificationPrefsMutation(), setVerificationPrefs = _b.mutate, isPending = _b.isPending;
    return (_jsx(Toggle.Item, { type: "checkbox", name: "hideBadges", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Hide verification badges"], ["Hide verification badges"])))), value: hideBadges, disabled: isPending, onChange: function (value) {
            setVerificationPrefs({ hideBadges: value });
        }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: CircleCheck }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Hide verification badges" }) }), _jsx(Toggle.Platform, {})] }) }));
}
var templateObject_1;
