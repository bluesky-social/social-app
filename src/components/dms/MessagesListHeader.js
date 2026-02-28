var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isConvoActive, useConvo } from '#/state/messages/convo';
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme, web } from '#/alf';
import { ConvoMenu } from '#/components/dms/ConvoMenu';
import { Bell2Off_Filled_Corner0_Rounded as BellStroke } from '#/components/icons/Bell2';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { IS_WEB } from '#/env';
var PFP_SIZE = IS_WEB ? 40 : Layout.HEADER_SLOT_SIZE;
export function MessagesListHeader(_a) {
    var profile = _a.profile, moderation = _a.moderation;
    var t = useTheme();
    var blockInfo = useMemo(function () {
        if (!moderation)
            return;
        var modui = moderation.ui('profileView');
        var blocks = modui.alerts.filter(function (alert) { return alert.type === 'blocking'; });
        var listBlocks = blocks.filter(function (alert) { return alert.source.type === 'list'; });
        var userBlock = blocks.find(function (alert) { return alert.source.type === 'user'; });
        return {
            listBlocks: listBlocks,
            userBlock: userBlock,
        };
    }, [moderation]);
    return (_jsx(Layout.Header.Outer, { children: _jsxs(View, { style: [a.w_full, a.flex_row, a.gap_xs, a.align_start], children: [_jsx(View, { style: [{ minHeight: PFP_SIZE }, a.justify_center], children: _jsx(Layout.Header.BackButton, {}) }), profile && moderation && blockInfo ? (_jsx(HeaderReady, { profile: profile, moderation: moderation, blockInfo: blockInfo })) : (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md, a.flex_1], children: [_jsx(View, { style: [
                                        { width: PFP_SIZE, height: PFP_SIZE },
                                        a.rounded_full,
                                        t.atoms.bg_contrast_25,
                                    ] }), _jsxs(View, { style: a.gap_xs, children: [_jsx(View, { style: [
                                                { width: 120, height: 16 },
                                                a.rounded_xs,
                                                t.atoms.bg_contrast_25,
                                                a.mt_xs,
                                            ] }), _jsx(View, { style: [
                                                { width: 175, height: 12 },
                                                a.rounded_xs,
                                                t.atoms.bg_contrast_25,
                                            ] })] })] }), _jsx(Layout.Header.Slot, {})] }))] }) }));
}
function HeaderReady(_a) {
    var _b;
    var profile = _a.profile, moderation = _a.moderation, blockInfo = _a.blockInfo;
    var _ = useLingui()._;
    var t = useTheme();
    var convoState = useConvo();
    var verification = useSimpleVerificationState({
        profile: profile,
    });
    var isDeletedAccount = (profile === null || profile === void 0 ? void 0 : profile.handle) === 'missing.invalid';
    var displayName = isDeletedAccount
        ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Deleted Account"], ["Deleted Account"]))))
        : sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName'));
    // @ts-ignore findLast is polyfilled - esb
    var latestMessageFromOther = convoState.items.findLast(function (item) {
        return item.type === 'message' && item.message.sender.did === profile.did;
    });
    var latestReportableMessage = (latestMessageFromOther === null || latestMessageFromOther === void 0 ? void 0 : latestMessageFromOther.type) === 'message'
        ? latestMessageFromOther.message
        : undefined;
    return (_jsxs(View, { style: [a.flex_1], children: [_jsxs(View, { style: [a.w_full, a.flex_row, a.align_center, a.justify_between], children: [_jsxs(Link, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View ", "'s profile"], ["View ", "'s profile"])), displayName)), style: [a.flex_row, a.align_start, a.gap_md, a.flex_1, a.pr_md], to: makeProfileLink(profile), children: [_jsx(PreviewableUserAvatar, { size: PFP_SIZE, profile: profile, moderation: moderation.ui('avatar'), disableHoverCard: moderation.blocked }), _jsxs(View, { style: [a.flex_1], children: [_jsxs(View, { style: [a.flex_row, a.align_center], children: [_jsx(Text, { emoji: true, style: [
                                                    a.text_md,
                                                    a.font_semi_bold,
                                                    a.self_start,
                                                    web(a.leading_normal),
                                                ], numberOfLines: 1, children: displayName }), verification.showBadge && (_jsx(View, { style: [a.pl_xs], children: _jsx(VerificationCheck, { width: 14, verifier: verification.role === 'verifier' }) }))] }), !isDeletedAccount && (_jsxs(Text, { style: [
                                            t.atoms.text_contrast_medium,
                                            a.text_xs,
                                            web([a.leading_normal, { marginTop: -2 }]),
                                        ], numberOfLines: 1, children: ["@", profile.handle, ((_b = convoState.convo) === null || _b === void 0 ? void 0 : _b.muted) && (_jsxs(_Fragment, { children: [' ', "\u00B7", ' ', _jsx(BellStroke, { size: "xs", style: t.atoms.text_contrast_medium })] }))] }))] })] }), _jsx(View, { style: [{ minHeight: PFP_SIZE }, a.justify_center], children: _jsx(Layout.Header.Slot, { children: isConvoActive(convoState) && (_jsx(ConvoMenu, { convo: convoState.convo, profile: profile, currentScreen: "conversation", blockInfo: blockInfo, latestReportableMessage: latestReportableMessage })) }) })] }), _jsx(View, { style: [
                    {
                        paddingLeft: PFP_SIZE + a.gap_md.gap,
                    },
                ], children: _jsx(PostAlerts, { modui: moderation.ui('contentList'), size: "lg", style: [a.pt_xs] }) })] }));
}
var templateObject_1, templateObject_2;
