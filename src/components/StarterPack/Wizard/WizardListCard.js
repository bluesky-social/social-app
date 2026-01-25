var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Keyboard, View } from 'react-native';
import { moderateFeedGenerator, moderateProfile, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { DISCOVER_FEED_URI, STARTER_PACK_MAX_SIZE } from '#/lib/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useSession } from '#/state/session';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Toggle from '#/components/forms/Toggle';
import { Checkbox } from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
function WizardListCard(_a) {
    var type = _a.type, btnType = _a.btnType, displayName = _a.displayName, subtitle = _a.subtitle, onPress = _a.onPress, avatar = _a.avatar, included = _a.included, disabled = _a.disabled, moderationUi = _a.moderationUi;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsxs(Toggle.Item, { name: type === 'user' ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Person toggle"], ["Person toggle"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Feed toggle"], ["Feed toggle"])))), label: included
            ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Remove ", " from starter pack"], ["Remove ", " from starter pack"])), displayName))
            : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Add ", " to starter pack"], ["Add ", " to starter pack"])), displayName)), value: included, disabled: btnType === 'remove' || disabled, onChange: onPress, style: [
            a.flex_row,
            a.align_center,
            a.px_lg,
            a.py_md,
            a.gap_md,
            a.border_b,
            t.atoms.border_contrast_low,
        ], children: [_jsx(UserAvatar, { size: 45, avatar: avatar, moderation: moderationUi, type: type }), _jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(Text, { emoji: true, style: [
                            a.flex_1,
                            a.font_semi_bold,
                            a.text_md,
                            a.leading_tight,
                            a.self_start,
                        ], numberOfLines: 1, children: displayName }), _jsx(Text, { style: [a.flex_1, a.leading_tight, t.atoms.text_contrast_medium], numberOfLines: 1, children: subtitle })] }), btnType === 'checkbox' ? (_jsx(Checkbox, {})) : !disabled ? (_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Remove"], ["Remove"])))), variant: "solid", color: "secondary", size: "small", style: [a.self_center, { marginLeft: 'auto' }], onPress: onPress, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Remove" }) }) })) : null] }));
}
export function WizardProfileCard(_a) {
    var btnType = _a.btnType, state = _a.state, dispatch = _a.dispatch, profile = _a.profile, moderationOpts = _a.moderationOpts;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    // Determine the "main" profile for this starter pack - either targetDid or current account
    var targetProfileDid = state.targetDid || (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var isTarget = profile.did === targetProfileDid;
    var included = isTarget || state.profiles.some(function (p) { return p.did === profile.did; });
    var disabled = isTarget ||
        (!included && state.profiles.length >= STARTER_PACK_MAX_SIZE - 1);
    var moderationUi = moderateProfile(profile, moderationOpts).ui('avatar');
    var displayName = profile.displayName
        ? sanitizeDisplayName(profile.displayName)
        : "@".concat(sanitizeHandle(profile.handle));
    var onPress = function () {
        if (disabled)
            return;
        Keyboard.dismiss();
        if (profile.did === targetProfileDid)
            return;
        if (!included) {
            ax.metric('starterPack:addUser', {});
            dispatch({ type: 'AddProfile', profile: profile });
        }
        else {
            ax.metric('starterPack:removeUser', {});
            dispatch({ type: 'RemoveProfile', profileDid: profile.did });
        }
    };
    return (_jsx(WizardListCard, { type: "user", btnType: btnType, displayName: displayName, subtitle: "@".concat(sanitizeHandle(profile.handle)), onPress: onPress, avatar: profile.avatar, included: included, disabled: disabled, moderationUi: moderationUi }));
}
export function WizardFeedCard(_a) {
    var btnType = _a.btnType, generator = _a.generator, state = _a.state, dispatch = _a.dispatch, moderationOpts = _a.moderationOpts;
    var isDiscover = generator.uri === DISCOVER_FEED_URI;
    var included = isDiscover || state.feeds.some(function (f) { return f.uri === generator.uri; });
    var disabled = isDiscover || (!included && state.feeds.length >= 3);
    var moderationUi = moderateFeedGenerator(generator, moderationOpts).ui('avatar');
    var onPress = function () {
        if (disabled)
            return;
        Keyboard.dismiss();
        if (included) {
            dispatch({ type: 'RemoveFeed', feedUri: generator.uri });
        }
        else {
            dispatch({ type: 'AddFeed', feed: generator });
        }
    };
    return (_jsx(WizardListCard, { type: "algo", btnType: btnType, displayName: sanitizeDisplayName(generator.displayName), subtitle: "Feed by @".concat(sanitizeHandle(generator.creator.handle)), onPress: onPress, avatar: generator.avatar, included: included, disabled: disabled, moderationUi: moderationUi }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
