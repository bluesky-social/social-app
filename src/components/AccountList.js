var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useActorStatus } from '#/lib/actor-status';
import { isJwtExpired } from '#/lib/jwt';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useProfilesQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon } from '#/components/icons/Chevron';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
export function AccountList(_a) {
    var onSelectAccount = _a.onSelectAccount, onSelectOther = _a.onSelectOther, otherLabel = _a.otherLabel, pendingDid = _a.pendingDid;
    var _b = useSession(), currentAccount = _b.currentAccount, accounts = _b.accounts;
    var t = useTheme();
    var _ = useLingui()._;
    var profiles = useProfilesQuery({
        handles: accounts.map(function (acc) { return acc.did; }),
    }).data;
    var onPressAddAccount = useCallback(function () {
        onSelectOther();
    }, [onSelectOther]);
    return (_jsxs(View, { pointerEvents: pendingDid ? 'none' : 'auto', style: [
            a.rounded_lg,
            a.overflow_hidden,
            a.border,
            t.atoms.border_contrast_low,
        ], children: [accounts.map(function (account) { return (_jsxs(React.Fragment, { children: [_jsx(AccountItem, { profile: profiles === null || profiles === void 0 ? void 0 : profiles.profiles.find(function (p) { return p.did === account.did; }), account: account, onSelect: onSelectAccount, isCurrentAccount: account.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did), isPendingAccount: account.did === pendingDid }), _jsx(View, { style: [a.border_b, t.atoms.border_contrast_low] })] }, account.did)); }), _jsx(Button, { testID: "chooseAddAccountBtn", style: [a.flex_1], onPress: pendingDid ? undefined : onPressAddAccount, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Sign in to account that is not listed"], ["Sign in to account that is not listed"])))), children: function (_a) {
                    var hovered = _a.hovered, pressed = _a.pressed;
                    return (_jsxs(View, { style: [
                            a.flex_1,
                            a.flex_row,
                            a.align_center,
                            a.p_lg,
                            a.gap_sm,
                            (hovered || pressed) && t.atoms.bg_contrast_25,
                        ], children: [_jsx(View, { style: [
                                    t.atoms.bg_contrast_25,
                                    a.rounded_full,
                                    { width: 48, height: 48 },
                                    a.justify_center,
                                    a.align_center,
                                    (hovered || pressed) && t.atoms.bg_contrast_50,
                                ], children: _jsx(PlusIcon, { style: [t.atoms.text_contrast_low], size: "md" }) }), _jsx(Text, { style: [a.flex_1, a.leading_tight, a.text_md, a.font_medium], children: otherLabel !== null && otherLabel !== void 0 ? otherLabel : _jsx(Trans, { children: "Other account" }) }), _jsx(ChevronIcon, { size: "md", style: [t.atoms.text_contrast_low] })] }));
                } })] }));
}
function AccountItem(_a) {
    var profile = _a.profile, account = _a.account, onSelect = _a.onSelect, isCurrentAccount = _a.isCurrentAccount, isPendingAccount = _a.isPendingAccount;
    var t = useTheme();
    var _ = useLingui()._;
    var verification = useSimpleVerificationState({ profile: profile });
    var live = useActorStatus(profile).isActive;
    var onPress = useCallback(function () {
        onSelect(account);
    }, [account, onSelect]);
    var isLoggedOut = !account.refreshJwt || isJwtExpired(account.refreshJwt);
    return (_jsx(Button, { testID: "chooseAccountBtn-".concat(account.handle), style: [a.w_full], onPress: onPress, label: isCurrentAccount
            ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Continue as ", " (currently signed in)"], ["Continue as ", " (currently signed in)"])), account.handle))
            : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Sign in as ", ""], ["Sign in as ", ""])), account.handle)), children: function (_a) {
            var _b;
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(View, { style: [
                    a.flex_1,
                    a.flex_row,
                    a.align_center,
                    a.p_lg,
                    a.gap_sm,
                    (hovered || pressed || isPendingAccount) && t.atoms.bg_contrast_25,
                ], children: [_jsx(UserAvatar, { avatar: profile === null || profile === void 0 ? void 0 : profile.avatar, size: 48, type: ((_b = profile === null || profile === void 0 ? void 0 : profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: live, hideLiveBadge: true }), _jsxs(View, { style: [a.flex_1, a.gap_2xs, a.pr_2xl], children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(Text, { emoji: true, style: [a.font_medium, a.leading_tight, a.text_md], numberOfLines: 1, children: sanitizeDisplayName((profile === null || profile === void 0 ? void 0 : profile.displayName) || (profile === null || profile === void 0 ? void 0 : profile.handle) || account.handle) }), verification.showBadge && (_jsx(View, { children: _jsx(VerificationCheck, { width: 12, verifier: verification.role === 'verifier' }) }))] }), _jsx(Text, { style: [
                                    a.leading_tight,
                                    t.atoms.text_contrast_medium,
                                    a.text_sm,
                                ], children: sanitizeHandle(account.handle, '@') }), isLoggedOut && (_jsx(Text, { style: [
                                    a.leading_tight,
                                    a.text_xs,
                                    a.italic,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsx(Trans, { children: "Logged out" }) }))] }), isCurrentAccount ? (_jsx(View, { style: [
                            {
                                width: 20,
                                height: 20,
                                backgroundColor: t.palette.positive_500,
                            },
                            a.rounded_full,
                            a.justify_center,
                            a.align_center,
                        ], children: _jsx(CheckIcon, { size: "xs", style: [{ color: t.palette.white }] }) })) : (_jsx(ChevronIcon, { size: "md", style: [t.atoms.text_contrast_low] }))] }));
        } }, account.did));
}
var templateObject_1, templateObject_2, templateObject_3;
