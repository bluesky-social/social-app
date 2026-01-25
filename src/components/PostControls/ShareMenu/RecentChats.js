var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ScrollView, View } from 'react-native';
import { moderateProfile } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useSession } from '#/state/session';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, tokens, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { useDialogContext } from '#/components/Dialog';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { useAnalytics } from '#/analytics';
export function RecentChats(_a) {
    var _b, _c;
    var postUri = _a.postUri;
    var ax = useAnalytics();
    var control = useDialogContext();
    var currentAccount = useSession().currentAccount;
    var data = useListConvosQuery({ status: 'accepted' }).data;
    var convos = (_c = (_b = data === null || data === void 0 ? void 0 : data.pages[0]) === null || _b === void 0 ? void 0 : _b.convos) === null || _c === void 0 ? void 0 : _c.slice(0, 10);
    var moderationOpts = useModerationOpts();
    var navigation = useNavigation();
    var onSelectChat = function (convoId) {
        control.close(function () {
            ax.metric('share:press:recentDm', {});
            navigation.navigate('MessagesConversation', {
                conversation: convoId,
                embed: postUri,
            });
        });
    };
    if (!moderationOpts)
        return null;
    return (_jsxs(View, { style: [a.relative, a.flex_1, { marginHorizontal: tokens.space.md * -1 }], children: [_jsx(ScrollView, { horizontal: true, style: [a.flex_1, a.pt_2xs, { minHeight: 98 }], contentContainerStyle: [a.gap_sm, a.px_md], showsHorizontalScrollIndicator: false, nestedScrollEnabled: true, children: convos && convos.length > 0 ? (convos.map(function (convo) {
                    var otherMember = convo.members.find(function (member) { return member.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); });
                    if (!otherMember ||
                        otherMember.handle === 'missing.invalid' ||
                        convo.muted)
                        return null;
                    return (_jsx(RecentChatItem, { profile: otherMember, onPress: function () { return onSelectChat(convo.id); }, moderationOpts: moderationOpts }, convo.id));
                })) : (_jsxs(_Fragment, { children: [_jsx(ConvoSkeleton, {}), _jsx(ConvoSkeleton, {}), _jsx(ConvoSkeleton, {}), _jsx(ConvoSkeleton, {}), _jsx(ConvoSkeleton, {})] })) }), convos && convos.length === 0 && _jsx(NoConvos, {})] }));
}
var WIDTH = 80;
function RecentChatItem(_a) {
    var _b;
    var profileUnshadowed = _a.profile, onPress = _a.onPress, moderationOpts = _a.moderationOpts;
    var _ = useLingui()._;
    var t = useTheme();
    var profile = useProfileShadow(profileUnshadowed);
    var moderation = moderateProfile(profile, moderationOpts);
    var name = sanitizeDisplayName(profile.displayName || sanitizeHandle(profile.handle), moderation.ui('displayName'));
    var verification = useSimpleVerificationState({ profile: profile });
    if (isBlockedOrBlocking(profile) || isMuted(profile)) {
        return null;
    }
    return (_jsxs(Button, { onPress: onPress, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Send post to ", ""], ["Send post to ", ""])), name)), style: [
            a.flex_col,
            { width: WIDTH },
            a.gap_sm,
            a.justify_start,
            a.align_center,
        ], children: [_jsx(UserAvatar, { avatar: profile.avatar, size: WIDTH - 8, type: ((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', moderation: moderation.ui('avatar') }), _jsxs(View, { style: [a.flex_row, a.align_center, a.justify_center, a.w_full], children: [_jsx(Text, { emoji: true, style: [a.text_xs, a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: 1, children: name }), verification.showBadge && (_jsx(View, { style: [a.pl_2xs], children: _jsx(VerificationCheck, { width: 10, verifier: verification.role === 'verifier' }) }))] })] }));
}
function ConvoSkeleton() {
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_col,
            { width: WIDTH, height: WIDTH + 15 },
            a.gap_xs,
            a.justify_start,
            a.align_center,
        ], children: [_jsx(View, { style: [
                    t.atoms.bg_contrast_50,
                    { width: WIDTH - 8, height: WIDTH - 8 },
                    a.rounded_full,
                ] }), _jsx(View, { style: [
                    t.atoms.bg_contrast_50,
                    { width: WIDTH - 8, height: 10 },
                    a.rounded_xs,
                ] })] }));
}
function NoConvos() {
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.absolute,
            a.inset_0,
            a.justify_center,
            a.align_center,
            a.px_2xl,
        ], children: [_jsx(View, { style: [a.absolute, a.inset_0, t.atoms.bg_contrast_25, { opacity: 0.5 }] }), _jsx(Text, { style: [
                    a.text_sm,
                    t.atoms.text_contrast_high,
                    a.text_center,
                    a.font_semi_bold,
                ], children: _jsx(Trans, { children: "Start a conversation, and it will appear here." }) })] }));
}
var templateObject_1;
