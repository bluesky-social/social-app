var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppBskyEmbedRecord, ChatBskyConvoDefs, moderateProfile, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { GestureActionView } from '#/lib/custom-animations/GestureActionView';
import { useHaptics } from '#/lib/haptics';
import { decrementBadgeCount } from '#/lib/notifications/notifications';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { postUriToRelativePath, toBskyAppUrl, toShortUrl, } from '#/lib/strings/url-helpers';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { precacheConvoQuery, useMarkAsReadMutation, } from '#/state/queries/messages/conversation';
import { precacheProfile } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { TimeElapsed } from '#/view/com/util/TimeElapsed';
import { PreviewableUserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import * as tokens from '#/alf/tokens';
import { useDialogControl } from '#/components/Dialog';
import { ConvoMenu } from '#/components/dms/ConvoMenu';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { Bell2Off_Filled_Corner0_Rounded as BellStroke } from '#/components/icons/Bell2';
import { Envelope_Open_Stroke2_Corner0_Rounded as EnvelopeOpen } from '#/components/icons/EnveopeOpen';
import { Trash_Stroke2_Corner0_Rounded } from '#/components/icons/Trash';
import { Link } from '#/components/Link';
import { useMenuControl } from '#/components/Menu';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { createPortalGroup } from '#/components/Portal';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
export var ChatListItemPortal = createPortalGroup();
export var ChatListItem = function (_a) {
    var convo = _a.convo, _b = _a.showMenu, showMenu = _b === void 0 ? true : _b, children = _a.children;
    var currentAccount = useSession().currentAccount;
    var moderationOpts = useModerationOpts();
    var otherUser = convo.members.find(function (member) { return member.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); });
    if (!otherUser || !moderationOpts) {
        return null;
    }
    return (_jsx(ChatListItemReady, { convo: convo, profile: otherUser, moderationOpts: moderationOpts, showMenu: showMenu, children: children }));
};
ChatListItem = React.memo(ChatListItem);
function ChatListItemReady(_a) {
    var convo = _a.convo, profileUnshadowed = _a.profile, moderationOpts = _a.moderationOpts, showMenu = _a.showMenu, children = _a.children;
    var ax = useAnalytics();
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var menuControl = useMenuControl();
    var leaveConvoControl = useDialogControl();
    var gtMobile = useBreakpoints().gtMobile;
    var profile = useProfileShadow(profileUnshadowed);
    var markAsRead = useMarkAsReadMutation().mutate;
    var moderation = React.useMemo(function () { return moderateProfile(profile, moderationOpts); }, [profile, moderationOpts]);
    var playHaptic = useHaptics();
    var queryClient = useQueryClient();
    var isUnread = convo.unreadCount > 0;
    var verification = useSimpleVerificationState({
        profile: profile,
    });
    var blockInfo = useMemo(function () {
        var modui = moderation.ui('profileView');
        var blocks = modui.alerts.filter(function (alert) { return alert.type === 'blocking'; });
        var listBlocks = blocks.filter(function (alert) { return alert.source.type === 'list'; });
        var userBlock = blocks.find(function (alert) { return alert.source.type === 'user'; });
        return {
            listBlocks: listBlocks,
            userBlock: userBlock,
        };
    }, [moderation]);
    var isDeletedAccount = profile.handle === 'missing.invalid';
    var displayName = isDeletedAccount
        ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Deleted Account"], ["Deleted Account"]))))
        : sanitizeDisplayName(profile.displayName || profile.handle, moderation.ui('displayName'));
    var isDimStyle = convo.muted || moderation.blocked || isDeletedAccount;
    var _b = useMemo(function () {
        var _a;
        var lastMessage = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["No messages yet"], ["No messages yet"]))));
        var lastMessageSentAt = null;
        var latestReportableMessage;
        if (ChatBskyConvoDefs.isMessageView(convo.lastMessage)) {
            var isFromMe = ((_a = convo.lastMessage.sender) === null || _a === void 0 ? void 0 : _a.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
            if (!isFromMe) {
                latestReportableMessage = convo.lastMessage;
            }
            if (convo.lastMessage.text) {
                if (isFromMe) {
                    lastMessage = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You: ", ""], ["You: ", ""])), convo.lastMessage.text));
                }
                else {
                    lastMessage = convo.lastMessage.text;
                }
            }
            else if (convo.lastMessage.embed) {
                var defaultEmbeddedContentMessage = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(contains embedded content)"], ["(contains embedded content)"]))));
                if (AppBskyEmbedRecord.isView(convo.lastMessage.embed)) {
                    var embed = convo.lastMessage.embed;
                    if (AppBskyEmbedRecord.isViewRecord(embed.record)) {
                        var record = embed.record;
                        var path = postUriToRelativePath(record.uri, {
                            handle: record.author.handle,
                        });
                        var href = path ? toBskyAppUrl(path) : undefined;
                        var short = href
                            ? toShortUrl(href)
                            : defaultEmbeddedContentMessage;
                        if (isFromMe) {
                            lastMessage = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["You: ", ""], ["You: ", ""])), short));
                        }
                        else {
                            lastMessage = short;
                        }
                    }
                }
                else {
                    if (isFromMe) {
                        lastMessage = _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["You: ", ""], ["You: ", ""])), defaultEmbeddedContentMessage));
                    }
                    else {
                        lastMessage = defaultEmbeddedContentMessage;
                    }
                }
            }
            lastMessageSentAt = convo.lastMessage.sentAt;
        }
        if (ChatBskyConvoDefs.isDeletedMessageView(convo.lastMessage)) {
            lastMessageSentAt = convo.lastMessage.sentAt;
            lastMessage = isDeletedAccount
                ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Conversation deleted"], ["Conversation deleted"]))))
                : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Message deleted"], ["Message deleted"]))));
        }
        if (ChatBskyConvoDefs.isMessageAndReactionView(convo.lastReaction)) {
            if (!lastMessageSentAt ||
                new Date(lastMessageSentAt) <
                    new Date(convo.lastReaction.reaction.createdAt)) {
                var isFromMe = convo.lastReaction.reaction.sender.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
                var lastMessageText = convo.lastReaction.message.text;
                var fallbackMessage = _(msg({
                    message: 'a message',
                    comment: "If last message does not contain text, fall back to \"{user} reacted to {a message}\"",
                }));
                if (isFromMe) {
                    lastMessage = _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["You reacted ", " to ", ""], ["You reacted ", " to ", ""])), convo.lastReaction.reaction.value, lastMessageText
                        ? "\"".concat(convo.lastReaction.message.text, "\"")
                        : fallbackMessage));
                }
                else {
                    var senderDid_1 = convo.lastReaction.reaction.sender.did;
                    var sender = convo.members.find(function (member) { return member.did === senderDid_1; });
                    if (sender) {
                        lastMessage = _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " reacted ", " to ", ""], ["", " reacted ", " to ", ""])), sanitizeDisplayName(sender.displayName || sender.handle), convo.lastReaction.reaction.value, lastMessageText
                            ? "\"".concat(convo.lastReaction.message.text, "\"")
                            : fallbackMessage));
                    }
                    else {
                        lastMessage = _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Someone reacted ", " to ", ""], ["Someone reacted ", " to ", ""])), convo.lastReaction.reaction.value, lastMessageText
                            ? "\"".concat(convo.lastReaction.message.text, "\"")
                            : fallbackMessage));
                    }
                }
            }
        }
        return {
            lastMessage: lastMessage,
            lastMessageSentAt: lastMessageSentAt,
            latestReportableMessage: latestReportableMessage,
        };
    }, [
        _,
        convo.lastMessage,
        convo.lastReaction,
        currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        isDeletedAccount,
        convo.members,
    ]), lastMessage = _b.lastMessage, lastMessageSentAt = _b.lastMessageSentAt, latestReportableMessage = _b.latestReportableMessage;
    var _c = useState(false), showActions = _c[0], setShowActions = _c[1];
    var onMouseEnter = useCallback(function () {
        setShowActions(true);
    }, []);
    var onMouseLeave = useCallback(function () {
        setShowActions(false);
    }, []);
    var onFocus = useCallback(function (e) {
        if (e.nativeEvent.relatedTarget == null)
            return;
        setShowActions(true);
    }, []);
    var onPress = useCallback(function (e) {
        precacheProfile(queryClient, profile);
        precacheConvoQuery(queryClient, convo);
        decrementBadgeCount(convo.unreadCount);
        if (isDeletedAccount) {
            e.preventDefault();
            menuControl.open();
            return false;
        }
        else {
            ax.metric('chat:open', { logContext: 'ChatsList' });
        }
    }, [ax, isDeletedAccount, menuControl, queryClient, profile, convo]);
    var onLongPress = useCallback(function () {
        playHaptic();
        menuControl.open();
    }, [playHaptic, menuControl]);
    var markReadAction = {
        threshold: 120,
        color: t.palette.primary_500,
        icon: EnvelopeOpen,
        action: function () {
            markAsRead({
                convoId: convo.id,
            });
        },
    };
    var deleteAction = {
        threshold: 225,
        color: t.palette.negative_500,
        icon: Trash_Stroke2_Corner0_Rounded,
        action: function () {
            leaveConvoControl.open();
        },
    };
    var actions = isUnread
        ? {
            leftFirst: markReadAction,
            leftSecond: deleteAction,
        }
        : {
            leftFirst: deleteAction,
        };
    var hasUnread = convo.unreadCount > 0 && !isDeletedAccount;
    return (_jsx(ChatListItemPortal.Provider, { children: _jsx(GestureActionView, { actions: actions, children: _jsxs(View, { onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, 
                // @ts-expect-error web only
                onFocus: onFocus, onBlur: onMouseLeave, style: [a.relative, t.atoms.bg], children: [_jsx(View, { style: [
                            a.z_10,
                            a.absolute,
                            { top: tokens.space.md, left: tokens.space.lg },
                        ], children: _jsx(PreviewableUserAvatar, { profile: profile, size: 52, moderation: moderation.ui('avatar') }) }), _jsx(Link, { to: "/messages/".concat(convo.id), label: displayName, accessibilityHint: !isDeletedAccount
                            ? _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Go to conversation with ", ""], ["Go to conversation with ", ""])), profile.handle))
                            : _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["This conversation is with a deleted or a deactivated account. Press for options"], ["This conversation is with a deleted or a deactivated account. Press for options"])))), accessibilityActions: IS_NATIVE
                            ? [
                                {
                                    name: 'magicTap',
                                    label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Open conversation options"], ["Open conversation options"])))),
                                },
                                {
                                    name: 'longpress',
                                    label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Open conversation options"], ["Open conversation options"])))),
                                },
                            ]
                            : undefined, onPress: onPress, onLongPress: IS_NATIVE ? onLongPress : undefined, onAccessibilityAction: onLongPress, children: function (_a) {
                            var hovered = _a.hovered, pressed = _a.pressed, focused = _a.focused;
                            return (_jsxs(View, { style: [
                                    a.flex_row,
                                    isDeletedAccount ? a.align_center : a.align_start,
                                    a.flex_1,
                                    a.px_lg,
                                    a.py_md,
                                    a.gap_md,
                                    (hovered || pressed || focused) && t.atoms.bg_contrast_25,
                                ], children: [_jsx(View, { style: { width: 52, height: 52 } }), _jsxs(View, { style: [a.flex_1, a.justify_center, web({ paddingRight: 45 })], children: [_jsxs(View, { style: [a.w_full, a.flex_row, a.align_end, a.pb_2xs], children: [_jsx(View, { style: [a.flex_shrink], children: _jsx(Text, { emoji: true, numberOfLines: 1, style: [
                                                                a.text_md,
                                                                t.atoms.text,
                                                                a.font_semi_bold,
                                                                { lineHeight: 21 },
                                                                isDimStyle && t.atoms.text_contrast_medium,
                                                            ], children: displayName }) }), verification.showBadge && (_jsx(View, { style: [a.pl_xs, a.self_center], children: _jsx(VerificationCheck, { width: 14, verifier: verification.role === 'verifier' }) })), lastMessageSentAt && (_jsx(View, { style: [a.pl_xs], children: _jsx(TimeElapsed, { timestamp: lastMessageSentAt, children: function (_a) {
                                                                var timeElapsed = _a.timeElapsed;
                                                                return (_jsxs(Text, { style: [
                                                                        a.text_sm,
                                                                        { lineHeight: 21 },
                                                                        t.atoms.text_contrast_medium,
                                                                        web({ whiteSpace: 'preserve nowrap' }),
                                                                    ], children: ["\u00B7 ", timeElapsed] }));
                                                            } }) })), (convo.muted || moderation.blocked) && (_jsxs(Text, { style: [
                                                            a.text_sm,
                                                            { lineHeight: 21 },
                                                            t.atoms.text_contrast_medium,
                                                            web({ whiteSpace: 'preserve nowrap' }),
                                                        ], children: [' ', "\u00B7", ' ', _jsx(BellStroke, { size: "xs", style: [t.atoms.text_contrast_medium] })] }))] }), !isDeletedAccount && (_jsxs(Text, { numberOfLines: 1, style: [
                                                    a.text_sm,
                                                    t.atoms.text_contrast_medium,
                                                    a.pb_xs,
                                                ], children: ["@", profile.handle] })), _jsx(Text, { emoji: true, numberOfLines: 2, style: [
                                                    a.text_sm,
                                                    a.leading_snug,
                                                    hasUnread ? a.font_semi_bold : t.atoms.text_contrast_high,
                                                    isDimStyle && t.atoms.text_contrast_medium,
                                                ], children: lastMessage }), _jsx(PostAlerts, { modui: moderation.ui('contentList'), size: "lg", style: [a.pt_xs] }), children] }), hasUnread && (_jsx(View, { style: [
                                            a.absolute,
                                            a.rounded_full,
                                            {
                                                backgroundColor: isDimStyle
                                                    ? t.palette.contrast_200
                                                    : t.palette.primary_500,
                                                height: 7,
                                                width: 7,
                                                top: 15,
                                                right: 12,
                                            },
                                        ] }))] }));
                        } }), _jsx(ChatListItemPortal.Outlet, {}), showMenu && (_jsx(ConvoMenu, { convo: convo, profile: profile, control: menuControl, currentScreen: "list", showMarkAsRead: convo.unreadCount > 0, hideTrigger: IS_NATIVE, blockInfo: blockInfo, style: [
                            a.absolute,
                            a.h_full,
                            a.self_end,
                            a.justify_center,
                            {
                                right: tokens.space.lg,
                                opacity: !gtMobile || showActions || menuControl.isOpen ? 1 : 0,
                            },
                        ], latestReportableMessage: latestReportableMessage })), _jsx(LeaveConvoPrompt, { control: leaveConvoControl, convoId: convo.id, currentScreen: "list" })] }) }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15;
