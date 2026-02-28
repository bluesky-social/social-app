var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { moderateProfile } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { differenceInSeconds } from 'date-fns';
import { HITSLOP_10 } from '#/lib/constants';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useDialogControl } from '#/components/Dialog';
import { Newskie } from '#/components/icons/Newskie';
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
export function NewskieDialog(_a) {
    var profile = _a.profile, disabled = _a.disabled;
    var _ = useLingui()._;
    var control = useDialogControl();
    var createdAt = profile.createdAt;
    var now = useState(function () { return Date.now(); })[0];
    var daysOld = useMemo(function () {
        if (!createdAt)
            return Infinity;
        return differenceInSeconds(now, new Date(createdAt)) / 86400;
    }, [createdAt, now]);
    if (!createdAt || daysOld > 7)
        return null;
    return (_jsxs(View, { style: [a.pr_2xs], children: [_jsx(Button, { disabled: disabled, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["This user is new here. Press for more info about when they joined."], ["This user is new here. Press for more info about when they joined."])))), hitSlop: HITSLOP_10, onPress: control.open, children: function (_a) {
                    var hovered = _a.hovered, pressed = _a.pressed;
                    return (_jsx(Newskie, { size: "lg", fill: "#FFC404", style: {
                            opacity: hovered || pressed ? 0.5 : 1,
                        } }));
                } }), _jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { profile: profile, createdAt: createdAt, now: now })] })] }));
}
function DialogInner(_a) {
    var profile = _a.profile, createdAt = _a.createdAt, now = _a.now;
    var control = Dialog.useDialogContext();
    var _ = useLingui()._;
    var t = useTheme();
    var moderationOpts = useModerationOpts();
    var currentAccount = useSession().currentAccount;
    var timeAgo = useGetTimeAgo();
    var isMe = profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var profileName = useMemo(function () {
        if (!moderationOpts)
            return profile.displayName || profile.handle;
        var moderation = moderateProfile(profile, moderationOpts);
        return sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName'));
    }, [moderationOpts, profile]);
    var getJoinMessage = function () {
        var timeAgoString = timeAgo(createdAt, now, { format: 'long' });
        if (isMe) {
            if (profile.joinedViaStarterPack) {
                return _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You joined Bluesky using a starter pack ", " ago"], ["You joined Bluesky using a starter pack ", " ago"])), timeAgoString));
            }
            else {
                return _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You joined Bluesky ", " ago"], ["You joined Bluesky ", " ago"])), timeAgoString));
            }
        }
        else {
            if (profile.joinedViaStarterPack) {
                return _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " joined Bluesky using a starter pack ", " ago"], ["", " joined Bluesky using a starter pack ", " ago"])), profileName, timeAgoString));
            }
            else {
                return _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " joined Bluesky ", " ago"], ["", " joined Bluesky ", " ago"])), profileName, timeAgoString));
            }
        }
    };
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["New user info dialog"], ["New user info dialog"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: [a.gap_md], children: [_jsxs(View, { style: [a.align_center], children: [_jsx(View, { style: [
                                    {
                                        height: 60,
                                        width: 64,
                                    },
                                ], children: _jsx(Newskie, { width: 64, height: 64, fill: "#FFC404", style: [a.absolute, a.inset_0] }) }), _jsx(Text, { style: [a.font_semi_bold, a.text_xl], children: isMe ? _jsx(Trans, { children: "Welcome, friend!" }) : _jsx(Trans, { children: "Say hello!" }) })] }), _jsx(Text, { style: [a.text_md, a.text_center, a.leading_snug], children: getJoinMessage() }), profile.joinedViaStarterPack ? (_jsx(StarterPackCard.Link, { starterPack: profile.joinedViaStarterPack, onPress: function () { return control.close(); }, children: _jsx(View, { style: [
                                a.w_full,
                                a.mt_sm,
                                a.p_lg,
                                a.border,
                                a.rounded_sm,
                                t.atoms.border_contrast_low,
                            ], children: _jsx(StarterPackCard.Card, { starterPack: profile.joinedViaStarterPack }) }) })) : null, IS_NATIVE && (_jsx(Button, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Close"], ["Close"])))), color: "secondary", size: "small", style: [a.mt_sm], onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) }))] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
