var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAppState } from '#/lib/appState';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { listenSoftReset } from '#/state/events';
import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';
import { useLeftConvos } from '#/state/queries/messages/leave-conversation';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useSession } from '#/state/session';
import { List } from '#/view/com/util/List';
import { ChatListLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { AgeRestrictedScreen } from '#/components/ageAssurance/AgeRestrictedScreen';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { NewChat } from '#/components/dms/dialogs/NewChatDialog';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon } from '#/components/icons/SettingsGear2';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { ChatListItem } from './components/ChatListItem';
import { InboxPreview } from './components/InboxPreview';
function renderItem(_a) {
    var item = _a.item;
    switch (item.type) {
        case 'INBOX':
            return _jsx(InboxPreview, { profiles: item.profiles });
        case 'CONVERSATION':
            return _jsx(ChatListItem, { convo: item.conversation });
    }
}
function keyExtractor(item) {
    return item.type === 'INBOX' ? 'INBOX' : item.conversation.id;
}
export function MessagesScreen(props) {
    var _ = useLingui()._;
    var aaCopy = useAgeAssuranceCopy();
    return (_jsx(AgeRestrictedScreen, { screenTitle: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Chats"], ["Chats"])))), infoText: aaCopy.chatsInfoText, rightHeaderSlot: _jsx(Link, { to: "/messages/settings", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Chat settings"], ["Chat settings"])))), size: "small", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Chat settings" }) }) }), children: _jsx(MessagesScreenInner, __assign({}, props)) }));
}
export function MessagesScreenInner(_a) {
    var _this = this;
    var _b, _c;
    var navigation = _a.navigation, route = _a.route;
    var _ = useLingui()._;
    var t = useTheme();
    var currentAccount = useSession().currentAccount;
    var newChatControl = useDialogControl();
    var scrollElRef = useAnimatedRef();
    var pushToConversation = (_b = route.params) === null || _b === void 0 ? void 0 : _b.pushToConversation;
    // Whenever we have `pushToConversation` set, it means we pressed a notification for a chat without being on
    // this tab. We should immediately push to the conversation after pressing the notification.
    // After we push, reset with `setParams` so that this effect will fire next time we press a notification, even if
    // the conversation is the same as before
    useEffect(function () {
        if (pushToConversation) {
            navigation.navigate('MessagesConversation', {
                conversation: pushToConversation,
            });
            navigation.setParams({ pushToConversation: undefined });
        }
    }, [navigation, pushToConversation]);
    // Request the poll interval to be 10s (or whatever the MESSAGE_SCREEN_POLL_INTERVAL is set to in the future)
    // but only when the screen is active
    var messagesBus = useMessagesEventBus();
    var state = useAppState();
    var isActive = state === 'active';
    useFocusEffect(useCallback(function () {
        if (isActive) {
            var unsub_1 = messagesBus.requestPollInterval(MESSAGE_SCREEN_POLL_INTERVAL);
            return function () { return unsub_1(); };
        }
    }, [messagesBus, isActive]));
    var initialNumToRender = useInitialNumToRender({ minItemHeight: 80 });
    var _d = useState(false), isPTRing = _d[0], setIsPTRing = _d[1];
    var _e = useListConvosQuery({ status: 'accepted' }), data = _e.data, isLoading = _e.isLoading, isFetchingNextPage = _e.isFetchingNextPage, hasNextPage = _e.hasNextPage, fetchNextPage = _e.fetchNextPage, isError = _e.isError, error = _e.error, refetch = _e.refetch;
    var _f = useListConvosQuery({
        status: 'request',
    }), inboxData = _f.data, refetchInbox = _f.refetch;
    useRefreshOnFocus(refetch);
    useRefreshOnFocus(refetchInbox);
    var leftConvos = useLeftConvos();
    var inboxAllConvos = (_c = inboxData === null || inboxData === void 0 ? void 0 : inboxData.pages.flatMap(function (page) { return page.convos; }).filter(function (convo) {
        return !leftConvos.includes(convo.id) &&
            !convo.muted &&
            convo.members.every(function (member) { return member.handle !== 'missing.invalid'; });
    })) !== null && _c !== void 0 ? _c : [];
    var hasInboxConvos = (inboxAllConvos === null || inboxAllConvos === void 0 ? void 0 : inboxAllConvos.length) > 0;
    var inboxUnreadConvos = inboxAllConvos.filter(function (convo) { return convo.unreadCount > 0; });
    var inboxUnreadConvoMembers = inboxUnreadConvos
        .map(function (x) { return x.members.find(function (y) { return y.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); }); })
        .filter(function (x) { return !!x; });
    var conversations = useMemo(function () {
        if (data === null || data === void 0 ? void 0 : data.pages) {
            var conversations_1 = data.pages
                .flatMap(function (page) { return page.convos; })
                // filter out convos that are actively being left
                .filter(function (convo) { return !leftConvos.includes(convo.id); });
            return __spreadArray(__spreadArray([], (hasInboxConvos
                ? [
                    {
                        type: 'INBOX',
                        count: inboxUnreadConvoMembers.length,
                        profiles: inboxUnreadConvoMembers.slice(0, 3),
                    },
                ]
                : []), true), conversations_1.map(function (convo) {
                return ({
                    type: 'CONVERSATION',
                    conversation: convo,
                });
            }), true);
        }
        return [];
    }, [data, leftConvos, hasInboxConvos, inboxUnreadConvoMembers]);
    var onRefresh = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTRing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([refetch(), refetchInbox()])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    logger.error('Failed to refresh conversations', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4:
                    setIsPTRing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch, refetchInbox, setIsPTRing]);
    var onEndReached = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetchingNextPage || !hasNextPage || isError)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPage()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    logger.error('Failed to load more conversations', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);
    var onNewChat = useCallback(function (conversation) {
        return navigation.navigate('MessagesConversation', { conversation: conversation });
    }, [navigation]);
    var onSoftReset = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
                        animated: IS_NATIVE,
                        offset: 0,
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, refetch()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _b.sent();
                    logger.error('Failed to refresh conversations', { message: err_3 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [scrollElRef, refetch]);
    var isScreenFocused = useIsFocused();
    useEffect(function () {
        if (!isScreenFocused) {
            return;
        }
        return listenSoftReset(onSoftReset);
    }, [onSoftReset, isScreenFocused]);
    // NOTE(APiligrim)
    // Show empty state only if there are no conversations at all
    var activeConversations = conversations.filter(function (item) { return item.type === 'CONVERSATION'; });
    if (activeConversations.length === 0) {
        return (_jsxs(Layout.Screen, { children: [_jsx(Header, { newChatControl: newChatControl }), _jsxs(Layout.Center, { children: [!isLoading && hasInboxConvos && (_jsx(InboxPreview, { profiles: inboxUnreadConvoMembers })), isLoading ? (_jsx(ChatListLoadingPlaceholder, {})) : (_jsx(_Fragment, { children: isError ? (_jsx(_Fragment, { children: _jsxs(View, { style: [a.pt_3xl, a.align_center], children: [_jsx(CircleInfoIcon, { width: 48, fill: t.atoms.text_contrast_low.color }), _jsx(Text, { style: [a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Whoops!" }) }), _jsx(Text, { style: [
                                                a.text_md,
                                                a.pb_xl,
                                                a.text_center,
                                                a.leading_snug,
                                                t.atoms.text_contrast_medium,
                                                { maxWidth: 360 },
                                            ], children: cleanError(error) ||
                                                _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Failed to load conversations"], ["Failed to load conversations"])))) }), _jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Reload conversations"], ["Reload conversations"])))), size: "small", color: "secondary_inverted", variant: "solid", onPress: function () { return refetch(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: RetryIcon, position: "right" })] })] }) })) : (_jsx(_Fragment, { children: _jsxs(View, { style: [a.pt_3xl, a.align_center], children: [_jsx(MessageIcon, { width: 48, fill: t.palette.primary_500 }), _jsx(Text, { style: [a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Nothing here" }) }), _jsx(Text, { style: [
                                                a.text_md,
                                                a.pb_xl,
                                                a.text_center,
                                                a.leading_snug,
                                                t.atoms.text_contrast_medium,
                                            ], children: _jsx(Trans, { children: "You have no conversations yet. Start one!" }) })] }) })) }))] }), !isLoading && !isError && (_jsx(NewChat, { onNewChat: onNewChat, control: newChatControl }))] }));
    }
    return (_jsxs(Layout.Screen, { testID: "messagesScreen", children: [_jsx(Header, { newChatControl: newChatControl }), _jsx(NewChat, { onNewChat: onNewChat, control: newChatControl }), _jsx(List, { ref: scrollElRef, data: conversations, renderItem: renderItem, keyExtractor: keyExtractor, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage, style: { borderColor: 'transparent' }, hasNextPage: hasNextPage }), onEndReachedThreshold: IS_NATIVE ? 1.5 : 0, initialNumToRender: initialNumToRender, windowSize: 11, desktopFixedHeight: true, sideBorders: false })] }));
}
function Header(_a) {
    var newChatControl = _a.newChatControl;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var requireEmailVerification = useRequireEmailVerification();
    var openChatControl = useCallback(function () {
        newChatControl.open();
    }, [newChatControl]);
    var wrappedOpenChatControl = requireEmailVerification(openChatControl, {
        instructions: [
            _jsx(Trans, { children: "Before you can message another user, you must first verify your email." }, "new-chat"),
        ],
    });
    var settingsLink = (_jsx(Link, { to: "/messages/settings", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Chat settings"], ["Chat settings"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", style: [a.justify_center], children: _jsx(ButtonIcon, { icon: SettingsIcon, size: "lg" }) }));
    return (_jsx(Layout.Header.Outer, { children: gtMobile ? (_jsxs(_Fragment, { children: [_jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Chats" }) }) }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: [settingsLink, _jsxs(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["New chat"], ["New chat"])))), color: "primary", size: "small", variant: "solid", onPress: wrappedOpenChatControl, children: [_jsx(ButtonIcon, { icon: PlusIcon, position: "left" }), _jsx(ButtonText, { children: _jsx(Trans, { children: "New chat" }) })] })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Layout.Header.MenuButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Chats" }) }) }), _jsx(Layout.Header.Slot, { children: settingsLink })] })) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
