var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useMemo } from 'react';
import { View, } from 'react-native';
import Animated, { LayoutAnimationConfig, LinearTransition, ZoomIn, ZoomOut, } from 'react-native-reanimated';
import { AppBskyEmbedRecord, ChatBskyConvoDefs, RichText as RichTextAPI, } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { useConvoActive } from '#/state/messages/convo';
import { useSession } from '#/state/session';
import { TimeElapsed } from '#/view/com/util/TimeElapsed';
import { atoms as a, native, useTheme } from '#/alf';
import { isOnlyEmoji } from '#/alf/typography';
import { ActionsWrapper } from '#/components/dms/ActionsWrapper';
import { InlineLinkText } from '#/components/Link';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { DateDivider } from './DateDivider';
import { MessageItemEmbed } from './MessageItemEmbed';
import { localDateString } from './util';
var MessageItem = function (_a) {
    var _b, _c;
    var item = _a.item;
    var t = useTheme();
    var currentAccount = useSession().currentAccount;
    var _ = useLingui()._;
    var convo = useConvoActive().convo;
    var message = item.message, nextMessage = item.nextMessage, prevMessage = item.prevMessage;
    var isPending = item.type === 'pending-message';
    var isFromSelf = ((_b = message.sender) === null || _b === void 0 ? void 0 : _b.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var nextIsMessage = ChatBskyConvoDefs.isMessageView(nextMessage);
    var isNextFromSelf = nextIsMessage && ((_c = nextMessage.sender) === null || _c === void 0 ? void 0 : _c.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var isNextFromSameSender = isNextFromSelf === isFromSelf;
    var isNewDay = useMemo(function () {
        if (!prevMessage)
            return true;
        var thisDate = new Date(message.sentAt);
        var prevDate = new Date(prevMessage.sentAt);
        return localDateString(thisDate) !== localDateString(prevDate);
    }, [message, prevMessage]);
    var isLastMessageOfDay = useMemo(function () {
        if (!nextMessage || !nextIsMessage)
            return true;
        var thisDate = new Date(message.sentAt);
        var prevDate = new Date(nextMessage.sentAt);
        return localDateString(thisDate) !== localDateString(prevDate);
    }, [message.sentAt, nextIsMessage, nextMessage]);
    var needsTail = isLastMessageOfDay || !isNextFromSameSender;
    var isLastInGroup = useMemo(function () {
        // if this message is pending, it means the next message is pending too
        if (isPending && nextMessage) {
            return false;
        }
        // or, if there's a 5 minute gap between this message and the next
        if (ChatBskyConvoDefs.isMessageView(nextMessage)) {
            var thisDate = new Date(message.sentAt);
            var nextDate = new Date(nextMessage.sentAt);
            var diff = nextDate.getTime() - thisDate.getTime();
            // 5 minutes
            return diff > 5 * 60 * 1000;
        }
        return true;
    }, [message, nextMessage, isPending]);
    var pendingColor = t.palette.primary_200;
    var rt = useMemo(function () {
        return new RichTextAPI({ text: message.text, facets: message.facets });
    }, [message.text, message.facets]);
    var appliedReactions = (_jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: message.reactions && message.reactions.length > 0 && (_jsx(View, { style: [isFromSelf ? a.align_end : a.align_start, a.px_sm, a.pb_2xs], children: _jsx(View, { style: [
                    a.flex_row,
                    a.gap_2xs,
                    a.py_xs,
                    a.px_xs,
                    a.justify_center,
                    isFromSelf ? a.justify_end : a.justify_start,
                    a.flex_wrap,
                    a.pb_xs,
                    t.atoms.bg_contrast_25,
                    a.border,
                    t.atoms.border_contrast_low,
                    a.rounded_lg,
                    t.atoms.shadow_sm,
                    {
                        // vibe coded number
                        transform: [{ translateY: -11 }],
                    },
                ], children: message.reactions.map(function (reaction, _i, reactions) {
                    var label;
                    if (reaction.sender.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
                        label = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You reacted ", ""], ["You reacted ", ""])), reaction.value));
                    }
                    else {
                        var senderDid_1 = reaction.sender.did;
                        var sender = convo.members.find(function (member) { return member.did === senderDid_1; });
                        if (sender) {
                            label = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " reacted ", ""], ["", " reacted ", ""])), sanitizeDisplayName(sender.displayName || sender.handle), reaction.value));
                        }
                        else {
                            label = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Someone reacted ", ""], ["Someone reacted ", ""])), reaction.value));
                        }
                    }
                    return (_jsx(Animated.View, { entering: native(ZoomIn.springify(200).delay(400)), exiting: reactions.length > 1 && native(ZoomOut.delay(200)), layout: native(LinearTransition.delay(300)), style: [a.p_2xs], accessible: true, accessibilityLabel: label, accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Double tap or long press the message to add a reaction"], ["Double tap or long press the message to add a reaction"])))), children: _jsx(Text, { emoji: true, style: [a.text_sm], children: reaction.value }) }, reaction.sender.did + reaction.value));
                }) }) })) }));
    return (_jsxs(_Fragment, { children: [isNewDay && _jsx(DateDivider, { date: message.sentAt }), _jsxs(View, { style: [
                    isFromSelf ? a.mr_md : a.ml_md,
                    nextIsMessage && !isNextFromSameSender && a.mb_md,
                ], children: [_jsxs(ActionsWrapper, { isFromSelf: isFromSelf, message: message, children: [AppBskyEmbedRecord.isView(message.embed) && (_jsx(MessageItemEmbed, { embed: message.embed })), rt.text.length > 0 && (_jsx(View, { style: !isOnlyEmoji(message.text) && [
                                    a.py_sm,
                                    a.my_2xs,
                                    a.rounded_md,
                                    {
                                        paddingLeft: 14,
                                        paddingRight: 14,
                                        backgroundColor: isFromSelf
                                            ? isPending
                                                ? pendingColor
                                                : t.palette.primary_500
                                            : t.palette.contrast_50,
                                        borderRadius: 17,
                                    },
                                    isFromSelf ? a.self_end : a.self_start,
                                    isFromSelf
                                        ? { borderBottomRightRadius: needsTail ? 2 : 17 }
                                        : { borderBottomLeftRadius: needsTail ? 2 : 17 },
                                ], children: _jsx(RichText, { value: rt, style: [a.text_md, isFromSelf && { color: t.palette.white }], interactiveStyle: a.underline, enableTags: true, emojiMultiplier: 3, shouldProxyLinks: true }) })), IS_NATIVE && appliedReactions] }), !IS_NATIVE && appliedReactions, isLastInGroup && (_jsx(MessageItemMetadata, { item: item, style: isFromSelf ? a.text_right : a.text_left }))] })] }));
};
MessageItem = React.memo(MessageItem);
export { MessageItem };
var MessageItemMetadata = function (_a) {
    var item = _a.item, style = _a.style;
    var t = useTheme();
    var _ = useLingui()._;
    var message = item.message;
    var handleRetry = useCallback(function (e) {
        if (item.type === 'pending-message' && item.retry) {
            e.preventDefault();
            item.retry();
            return false;
        }
    }, [item]);
    var relativeTimestamp = useCallback(function (i18n, timestamp) {
        var date = new Date(timestamp);
        var now = new Date();
        var time = i18n.date(date, {
            hour: 'numeric',
            minute: 'numeric',
        });
        var diff = now.getTime() - date.getTime();
        // if under 30 seconds
        if (diff < 1000 * 30) {
            return _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Now"], ["Now"]))));
        }
        return time;
    }, [_]);
    return (_jsxs(Text, { style: [
            a.text_xs,
            a.mt_2xs,
            a.mb_lg,
            t.atoms.text_contrast_medium,
            style,
        ], children: [_jsx(TimeElapsed, { timestamp: message.sentAt, timeToString: relativeTimestamp, children: function (_a) {
                    var timeElapsed = _a.timeElapsed;
                    return (_jsx(Text, { style: [a.text_xs, t.atoms.text_contrast_medium], children: timeElapsed }));
                } }), item.type === 'pending-message' && item.failed && (_jsxs(_Fragment, { children: [' ', "\u00B7", ' ', _jsx(Text, { style: [
                            a.text_xs,
                            {
                                color: t.palette.negative_400,
                            },
                        ], children: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Failed to send"], ["Failed to send"])))) }), item.retry && (_jsxs(_Fragment, { children: [' ', "\u00B7", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Click to retry failed message"], ["Click to retry failed message"])))), to: "#", onPress: handleRetry, style: [a.text_xs], children: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Retry"], ["Retry"])))) })] }))] }))] }));
};
MessageItemMetadata = React.memo(MessageItemMetadata);
export { MessageItemMetadata };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
