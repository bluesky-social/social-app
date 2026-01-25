var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { RichText } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useTranslate } from '#/lib/hooks/useTranslate';
import { richTextToString } from '#/lib/strings/rich-text-helpers';
import { useConvoActive } from '#/state/messages/convo';
import { useLanguagePrefs } from '#/state/preferences';
import { useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import * as ContextMenu from '#/components/ContextMenu';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { BubbleQuestion_Stroke2_Corner0_Rounded as Translate } from '#/components/icons/Bubble';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { usePromptControl } from '#/components/Prompt';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { EmojiReactionPicker } from './EmojiReactionPicker';
import { hasReachedReactionLimit } from './util';
export var MessageContextMenu = function (_a) {
    var _b, _c;
    var message = _a.message, children = _a.children;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var convo = useConvoActive();
    var deleteControl = usePromptControl();
    var reportControl = usePromptControl();
    var blockOrDeleteControl = usePromptControl();
    var langPrefs = useLanguagePrefs();
    var translate = useTranslate();
    var isFromSelf = ((_b = message.sender) === null || _b === void 0 ? void 0 : _b.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var onCopyMessage = useCallback(function () {
        var str = richTextToString(new RichText({
            text: message.text,
            facets: message.facets,
        }), true);
        Clipboard.setStringAsync(str);
        Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Copied to clipboard"], ["Copied to clipboard"])))), 'clipboard-check');
    }, [_, message.text, message.facets]);
    var onPressTranslateMessage = useCallback(function () {
        translate(message.text, langPrefs.primaryLanguage);
        ax.metric('translate', {
            sourceLanguages: [],
            targetLanguage: langPrefs.primaryLanguage,
            textLength: message.text.length,
        });
    }, [ax, langPrefs.primaryLanguage, message.text, translate]);
    var onDelete = useCallback(function () {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        convo
            .deleteMessage(message.id)
            .then(function () {
            return Toast.show(_(msg({ message: 'Message deleted', context: 'toast' })));
        })
            .catch(function () { return Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to delete message"], ["Failed to delete message"]))))); });
    }, [_, convo, message.id]);
    var onEmojiSelect = useCallback(function (emoji) {
        var _a;
        if ((_a = message.reactions) === null || _a === void 0 ? void 0 : _a.find(function (reaction) {
            return reaction.value === emoji &&
                reaction.sender.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
        })) {
            convo
                .removeReaction(message.id, emoji)
                .catch(function () { return Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to remove emoji reaction"], ["Failed to remove emoji reaction"]))))); });
        }
        else {
            if (hasReachedReactionLimit(message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did))
                return;
            convo
                .addReaction(message.id, emoji)
                .catch(function () {
                return Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to add emoji reaction"], ["Failed to add emoji reaction"])))), 'xmark');
            });
        }
    }, [_, convo, message, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did]);
    var sender = convo.convo.members.find(function (member) { return member.did === message.sender.did; });
    return (_jsxs(_Fragment, { children: [_jsxs(ContextMenu.Root, { children: [IS_NATIVE && (_jsx(ContextMenu.AuxiliaryView, { align: isFromSelf ? 'right' : 'left', children: _jsx(EmojiReactionPicker, { message: message, onEmojiSelect: onEmojiSelect }) })), _jsx(ContextMenu.Trigger, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Message options"], ["Message options"])))), contentLabel: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Message from @", ": ", ""], ["Message from @", // should always be defined
                            ": ", ""])), (_c = sender === null || sender === void 0 ? void 0 : sender.handle) !== null && _c !== void 0 ? _c : 'unknown' // should always be defined
                        , message.text)), children: children }), _jsxs(ContextMenu.Outer, { align: isFromSelf ? 'right' : 'left', children: [message.text.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(ContextMenu.Item, { testID: "messageDropdownTranslateBtn", label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Translate"], ["Translate"])))), onPress: onPressTranslateMessage, children: [_jsx(ContextMenu.ItemText, { children: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Translate"], ["Translate"])))) }), _jsx(ContextMenu.ItemIcon, { icon: Translate, position: "right" })] }), _jsxs(ContextMenu.Item, { testID: "messageDropdownCopyBtn", label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Copy message text"], ["Copy message text"])))), onPress: onCopyMessage, children: [_jsx(ContextMenu.ItemText, { children: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Copy message text"], ["Copy message text"])))) }), _jsx(ContextMenu.ItemIcon, { icon: ClipboardIcon, position: "right" })] }), _jsx(ContextMenu.Divider, {})] })), _jsxs(ContextMenu.Item, { testID: "messageDropdownDeleteBtn", label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Delete message for me"], ["Delete message for me"])))), onPress: function () { return deleteControl.open(); }, children: [_jsx(ContextMenu.ItemText, { children: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Delete for me"], ["Delete for me"])))) }), _jsx(ContextMenu.ItemIcon, { icon: Trash, position: "right" })] }), !isFromSelf && (_jsxs(ContextMenu.Item, { testID: "messageDropdownReportBtn", label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Report message"], ["Report message"])))), onPress: function () { return reportControl.open(); }, children: [_jsx(ContextMenu.ItemText, { children: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Report"], ["Report"])))) }), _jsx(ContextMenu.ItemIcon, { icon: Warning, position: "right" })] }))] })] }), _jsx(ReportDialog
            // currentScreen="conversation"
            , { 
                // currentScreen="conversation"
                control: reportControl, subject: {
                    view: 'message',
                    convoId: convo.convo.id,
                    message: message,
                }, onAfterSubmit: function () {
                    blockOrDeleteControl.open();
                } }), _jsx(AfterReportDialog, { control: blockOrDeleteControl, currentScreen: "conversation", params: {
                    convoId: convo.convo.id,
                    message: message,
                } }), _jsx(Prompt.Basic, { control: deleteControl, title: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Delete message"], ["Delete message"])))), description: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Are you sure you want to delete this message? The message will be deleted for you, but not for the other participant."], ["Are you sure you want to delete this message? The message will be deleted for you, but not for the other participant."])))), confirmButtonCta: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Delete"], ["Delete"])))), confirmButtonColor: "negative", onConfirm: onDelete })] }));
};
MessageContextMenu = memo(MessageContextMenu);
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17;
