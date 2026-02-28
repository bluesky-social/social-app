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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppState } from '#/lib/appState';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { cleanError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { MESSAGE_SCREEN_POLL_INTERVAL } from '#/state/messages/convo/const';
import { useMessagesEventBus } from '#/state/messages/events';
import { useLeftConvos } from '#/state/queries/messages/leave-conversation';
import { useListConvosQuery } from '#/state/queries/messages/list-conversations';
import { useUpdateAllRead } from '#/state/queries/messages/update-all-read';
import { FAB } from '#/view/com/util/fab/FAB';
import { List } from '#/view/com/util/List';
import { ChatListLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { AgeRestrictedScreen } from '#/components/ageAssurance/AgeRestrictedScreen';
import { useAgeAssuranceCopy } from '#/components/ageAssurance/useAgeAssuranceCopy';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useRefreshOnFocus } from '#/components/hooks/useRefreshOnFocus';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Message_Stroke2_Corner0_Rounded as MessageIcon } from '#/components/icons/Message';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { RequestListItem } from './components/RequestListItem';
export function MessagesInboxScreen(props) {
    var _ = useLingui()._;
    var aaCopy = useAgeAssuranceCopy();
    return (_jsx(AgeRestrictedScreen, { screenTitle: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Chat requests"], ["Chat requests"])))), infoText: aaCopy.chatsInfoText, children: _jsx(MessagesInboxScreenInner, __assign({}, props)) }));
}
export function MessagesInboxScreenInner(_a) {
    var gtTablet = useBreakpoints().gtTablet;
    var listConvosQuery = useListConvosQuery({ status: 'request' });
    var data = listConvosQuery.data;
    var leftConvos = useLeftConvos();
    var conversations = useMemo(function () {
        if (data === null || data === void 0 ? void 0 : data.pages) {
            var convos = data.pages
                .flatMap(function (page) { return page.convos; })
                // filter out convos that are actively being left
                .filter(function (convo) { return !leftConvos.includes(convo.id); });
            return convos;
        }
        return [];
    }, [data, leftConvos]);
    var hasUnreadConvos = useMemo(function () {
        return conversations.some(function (conversation) {
            return conversation.members.every(function (member) { return member.handle !== 'missing.invalid'; }) && conversation.unreadCount > 0;
        });
    }, [conversations]);
    return (_jsxs(Layout.Screen, { testID: "messagesInboxScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { align: gtTablet ? 'left' : 'platform', children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Chat requests" }) }) }), hasUnreadConvos && gtTablet ? (_jsx(MarkAsReadHeaderButton, {})) : (_jsx(Layout.Header.Slot, {}))] }), _jsx(RequestList, { listConvosQuery: listConvosQuery, conversations: conversations, hasUnreadConvos: hasUnreadConvos })] }));
}
function RequestList(_a) {
    var _this = this;
    var listConvosQuery = _a.listConvosQuery, conversations = _a.conversations, hasUnreadConvos = _a.hasUnreadConvos;
    var _ = useLingui()._;
    var t = useTheme();
    var navigation = useNavigation();
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
    var initialNumToRender = useInitialNumToRender({ minItemHeight: 130 });
    var _b = useState(false), isPTRing = _b[0], setIsPTRing = _b[1];
    var isLoading = listConvosQuery.isLoading, isFetchingNextPage = listConvosQuery.isFetchingNextPage, hasNextPage = listConvosQuery.hasNextPage, fetchNextPage = listConvosQuery.fetchNextPage, isError = listConvosQuery.isError, error = listConvosQuery.error, refetch = listConvosQuery.refetch;
    useRefreshOnFocus(refetch);
    var onRefresh = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTRing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, refetch()];
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
    }); }, [refetch, setIsPTRing]);
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
    if (conversations.length < 1) {
        return (_jsx(Layout.Center, { children: isLoading ? (_jsx(ChatListLoadingPlaceholder, {})) : (_jsx(_Fragment, { children: isError ? (_jsx(_Fragment, { children: _jsxs(View, { style: [a.pt_3xl, a.align_center], children: [_jsx(CircleInfoIcon, { width: 48, fill: t.atoms.text_contrast_low.color }), _jsx(Text, { style: [a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { children: "Whoops!" }) }), _jsx(Text, { style: [
                                    a.text_md,
                                    a.pb_xl,
                                    a.text_center,
                                    a.leading_snug,
                                    t.atoms.text_contrast_medium,
                                    { maxWidth: 360 },
                                ], children: cleanError(error) || _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to load conversations"], ["Failed to load conversations"])))) }), _jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Reload conversations"], ["Reload conversations"])))), size: "small", color: "secondary_inverted", variant: "solid", onPress: function () { return refetch(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: RetryIcon, position: "right" })] })] }) })) : (_jsx(_Fragment, { children: _jsxs(View, { style: [a.pt_3xl, a.align_center], children: [_jsx(MessageIcon, { width: 48, fill: t.palette.primary_500 }), _jsx(Text, { style: [a.pt_md, a.pb_sm, a.text_2xl, a.font_semi_bold], children: _jsx(Trans, { comment: "Title message shown in chat requests inbox when it's empty", children: "Inbox zero!" }) }), _jsx(Text, { style: [
                                    a.text_md,
                                    a.pb_xl,
                                    a.text_center,
                                    a.leading_snug,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsx(Trans, { children: "You don't have any chat requests at the moment." }) }), _jsxs(Button, { variant: "solid", color: "secondary", size: "small", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Go back"], ["Go back"])))), onPress: function () {
                                    if (navigation.canGoBack()) {
                                        navigation.goBack();
                                    }
                                    else {
                                        navigation.navigate('Messages', { animation: 'pop' });
                                    }
                                }, children: [_jsx(ButtonIcon, { icon: ArrowLeftIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Back to Chats" }) })] })] }) })) })) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(List, { data: conversations, renderItem: renderItem, keyExtractor: keyExtractor, refreshing: isPTRing, onRefresh: onRefresh, onEndReached: onEndReached, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage, style: { borderColor: 'transparent' }, hasNextPage: hasNextPage }), onEndReachedThreshold: IS_NATIVE ? 1.5 : 0, initialNumToRender: initialNumToRender, windowSize: 11, desktopFixedHeight: true, sideBorders: false }), hasUnreadConvos && _jsx(MarkAllReadFAB, {})] }));
}
function keyExtractor(item) {
    return item.id;
}
function renderItem(_a) {
    var item = _a.item;
    return _jsx(RequestListItem, { convo: item });
}
function MarkAllReadFAB() {
    var _ = useLingui()._;
    var t = useTheme();
    var markAllRead = useUpdateAllRead('request', {
        onMutate: function () {
            Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Marked all as read"], ["Marked all as read"])))), 'check');
        },
        onError: function () {
            Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Failed to mark all requests as read"], ["Failed to mark all requests as read"])))), 'xmark');
        },
    }).mutate;
    return (_jsx(FAB, { testID: "markAllAsReadFAB", onPress: function () { return markAllRead(); }, icon: _jsx(CheckIcon, { size: "lg", fill: t.palette.white }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Mark all as read"], ["Mark all as read"])))), accessibilityHint: "" }));
}
function MarkAsReadHeaderButton() {
    var _ = useLingui()._;
    var markAllRead = useUpdateAllRead('request', {
        onMutate: function () {
            Toast.show(_(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Marked all as read"], ["Marked all as read"])))), 'check');
        },
        onError: function () {
            Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Failed to mark all requests as read"], ["Failed to mark all requests as read"])))), 'xmark');
        },
    }).mutate;
    return (_jsxs(Button, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Mark all as read"], ["Mark all as read"])))), size: "small", color: "secondary", variant: "solid", onPress: function () { return markAllRead(); }, children: [_jsx(ButtonIcon, { icon: CheckIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Mark all as read" }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
