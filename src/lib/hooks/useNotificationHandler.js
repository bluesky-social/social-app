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
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountSwitcher } from '#/lib/hooks/useAccountSwitcher';
import { logger as notyLogger } from '#/lib/notifications/util';
import { useCurrentConvoId } from '#/state/messages/current-convo-id';
import { RQKEY as RQKEY_NOTIFS } from '#/state/queries/notifications/feed';
import { invalidateCachedUnreadPage } from '#/state/queries/notifications/unread';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useCloseAllActiveElements } from '#/state/util';
import { useAnalytics } from '#/analytics';
import { IS_ANDROID, IS_IOS } from '#/env';
import { resetToTab } from '#/Navigation';
import { router } from '#/routes';
var DEFAULT_HANDLER_OPTIONS = {
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
};
/**
 * Cached notification payload if we handled a notification while the user was
 * using a different account. This is consumed after we finish switching
 * accounts.
 */
var storedAccountSwitchPayload;
/**
 * Used to ensure we don't handle the same notification twice
 */
var lastHandledNotificationDateDedupe = 0;
export function useNotificationsHandler() {
    var _this = this;
    var ax = useAnalytics();
    var logger = ax.logger.useChild(ax.logger.Context.Notifications);
    var queryClient = useQueryClient();
    var _a = useSession(), currentAccount = _a.currentAccount, accounts = _a.accounts;
    var onPressSwitchAccount = useAccountSwitcher().onPressSwitchAccount;
    var navigation = useNavigation();
    var currentConvoId = useCurrentConvoId().currentConvoId;
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var closeAllActiveElements = useCloseAllActiveElements();
    var _ = useLingui()._;
    // On Android, we cannot control which sound is used for a notification on Android
    // 28 or higher. Instead, we have to configure a notification channel ahead of time
    // which has the sounds we want in the configuration for that channel. These two
    // channels allow for the mute/unmute functionality we want for the background
    // handler.
    useEffect(function () {
        if (!IS_ANDROID)
            return;
        // assign both chat notifications to a group
        // NOTE: I don't think that it will retroactively move them into the group
        // if the channels already exist. no big deal imo -sfn
        var CHAT_GROUP = 'chat';
        Notifications.setNotificationChannelGroupAsync(CHAT_GROUP, {
            name: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Chat"], ["Chat"])))),
            description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You can choose whether chat notifications have sound in the chat settings within the app"], ["You can choose whether chat notifications have sound in the chat settings within the app"])))),
        });
        Notifications.setNotificationChannelAsync('chat-messages', {
            name: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Chat messages - sound"], ["Chat messages - sound"])))),
            groupId: CHAT_GROUP,
            importance: Notifications.AndroidImportance.MAX,
            sound: 'dm.mp3',
            showBadge: true,
            vibrationPattern: [250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
        });
        Notifications.setNotificationChannelAsync('chat-messages-muted', {
            name: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Chat messages - silent"], ["Chat messages - silent"])))),
            groupId: CHAT_GROUP,
            importance: Notifications.AndroidImportance.MAX,
            sound: null,
            showBadge: true,
            vibrationPattern: [250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
        });
        Notifications.setNotificationChannelAsync('like', {
            name: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Likes"], ["Likes"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('repost', {
            name: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Reposts"], ["Reposts"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('reply', {
            name: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Replies"], ["Replies"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('mention', {
            name: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Mentions"], ["Mentions"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('quote', {
            name: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Quotes"], ["Quotes"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('follow', {
            name: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["New followers"], ["New followers"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('like-via-repost', {
            name: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Likes of your reposts"], ["Likes of your reposts"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('repost-via-repost', {
            name: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Reposts of your reposts"], ["Reposts of your reposts"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
        Notifications.setNotificationChannelAsync('subscribed-post', {
            name: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Activity from others"], ["Activity from others"])))),
            importance: Notifications.AndroidImportance.HIGH,
        });
    }, [_]);
    useEffect(function () {
        var handleNotification = function (payload) {
            if (!payload)
                return;
            if (payload.reason === 'chat-message') {
                logger.debug("useNotificationsHandler: handling chat message", {
                    payload: payload,
                });
                if (payload.recipientDid !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
                    !storedAccountSwitchPayload) {
                    storePayloadForAccountSwitch(payload);
                    closeAllActiveElements();
                    var account = accounts.find(function (a) { return a.did === payload.recipientDid; });
                    if (account) {
                        onPressSwitchAccount(account, 'Notification');
                    }
                    else {
                        setShowLoggedOut(true);
                    }
                }
                else {
                    navigation.dispatch(function (state) {
                        if (state.routes[0].name === 'Messages') {
                            if (state.routes[state.routes.length - 1].name ===
                                'MessagesConversation') {
                                return CommonActions.reset(__assign(__assign({}, state), { routes: __spreadArray(__spreadArray([], state.routes.slice(0, state.routes.length - 1), true), [
                                        {
                                            name: 'MessagesConversation',
                                            params: {
                                                conversation: payload.convoId,
                                            },
                                        },
                                    ], false) }));
                            }
                            else {
                                return CommonActions.navigate('MessagesConversation', {
                                    conversation: payload.convoId,
                                });
                            }
                        }
                        else {
                            return CommonActions.navigate('MessagesTab', {
                                screen: 'Messages',
                                params: {
                                    pushToConversation: payload.convoId,
                                },
                            });
                        }
                    });
                }
            }
            else {
                var url = notificationToURL(payload);
                if (url === '/notifications') {
                    resetToTab('NotificationsTab');
                }
                else if (url) {
                    var _a = router.matchPath(url), screen_1 = _a[0], params = _a[1];
                    // @ts-expect-error router is not typed :/ -sfn
                    navigation.navigate('HomeTab', { screen: screen_1, params: params });
                    logger.debug("useNotificationsHandler: navigate", {
                        screen: screen_1,
                        params: params,
                    });
                }
            }
        };
        Notifications.setNotificationHandler({
            handleNotification: function (e) { return __awaiter(_this, void 0, void 0, function () {
                var payload, shouldAlert;
                return __generator(this, function (_a) {
                    payload = getNotificationPayload(e);
                    if (!payload)
                        return [2 /*return*/, DEFAULT_HANDLER_OPTIONS];
                    logger.debug('useNotificationsHandler: incoming', { e: e, payload: payload });
                    if (payload.reason === 'chat-message' &&
                        payload.recipientDid === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
                        shouldAlert = payload.convoId !== currentConvoId;
                        return [2 /*return*/, {
                                shouldShowList: shouldAlert,
                                shouldShowBanner: shouldAlert,
                                shouldPlaySound: false,
                                shouldSetBadge: false,
                            }];
                    }
                    // Any notification other than a chat message should invalidate the unread page
                    invalidateCachedUnreadPage();
                    return [2 /*return*/, DEFAULT_HANDLER_OPTIONS];
                });
            }); },
        });
        var responseReceivedListener = Notifications.addNotificationResponseReceivedListener(function (e) {
            if (e.notification.date === lastHandledNotificationDateDedupe)
                return;
            lastHandledNotificationDateDedupe = e.notification.date;
            logger.debug('useNotificationsHandler: response received', {
                actionIdentifier: e.actionIdentifier,
            });
            if (e.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
                return;
            }
            var payload = getNotificationPayload(e.notification);
            if (payload) {
                logger.debug('User pressed a notification, opening notifications tab', {});
                ax.metric('notifications:openApp', {
                    reason: payload.reason,
                    causedBoot: false,
                });
                invalidateCachedUnreadPage();
                truncateAndInvalidate(queryClient, RQKEY_NOTIFS('all'));
                if (payload.reason === 'mention' ||
                    payload.reason === 'quote' ||
                    payload.reason === 'reply') {
                    truncateAndInvalidate(queryClient, RQKEY_NOTIFS('mentions'));
                }
                logger.debug('Notifications: handleNotification', {
                    content: e.notification.request.content,
                    payload: payload,
                });
                handleNotification(payload);
                Notifications.dismissAllNotificationsAsync();
            }
            else {
                logger.error('useNotificationsHandler: received no payload', {
                    identifier: e.notification.request.identifier,
                });
            }
        });
        // Whenever there's a stored payload, that means we had to switch accounts before handling the notification.
        // Whenever currentAccount changes, we should try to handle it again.
        if ((storedAccountSwitchPayload === null || storedAccountSwitchPayload === void 0 ? void 0 : storedAccountSwitchPayload.reason) === 'chat-message' &&
            (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === storedAccountSwitchPayload.recipientDid) {
            handleNotification(storedAccountSwitchPayload);
            storedAccountSwitchPayload = undefined;
        }
        return function () {
            responseReceivedListener.remove();
        };
    }, [
        ax,
        logger,
        queryClient,
        currentAccount,
        currentConvoId,
        accounts,
        closeAllActiveElements,
        currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        navigation,
        onPressSwitchAccount,
        setShowLoggedOut,
    ]);
}
export function storePayloadForAccountSwitch(payload) {
    storedAccountSwitchPayload = payload;
}
export function getNotificationPayload(e) {
    if (e.request.trigger == null ||
        typeof e.request.trigger !== 'object' ||
        !('type' in e.request.trigger) ||
        e.request.trigger.type !== 'push') {
        return null;
    }
    var payload = (IS_IOS ? e.request.trigger.payload : e.request.content.data);
    if (payload && payload.reason) {
        return payload;
    }
    else {
        if (payload) {
            notyLogger.debug('getNotificationPayload: received unknown payload', {
                payload: payload,
                identifier: e.request.identifier,
            });
        }
        return null;
    }
}
export function notificationToURL(payload) {
    switch (payload === null || payload === void 0 ? void 0 : payload.reason) {
        case 'like':
        case 'repost':
        case 'like-via-repost':
        case 'repost-via-repost': {
            var urip = new AtUri(payload.subject);
            if (urip.collection === 'app.bsky.feed.post') {
                return "/profile/".concat(urip.host, "/post/").concat(urip.rkey);
            }
            else {
                return '/notifications';
            }
        }
        case 'reply':
        case 'quote':
        case 'mention':
        case 'subscribed-post': {
            var urip = new AtUri(payload.uri);
            if (urip.collection === 'app.bsky.feed.post') {
                return "/profile/".concat(urip.host, "/post/").concat(urip.rkey);
            }
            else {
                return '/notifications';
            }
        }
        case 'follow':
        case 'starterpack-joined': {
            var urip = new AtUri(payload.uri);
            return "/profile/".concat(urip.host);
        }
        case 'chat-message':
            // should be handled separately
            return null;
        case 'verified':
        case 'unverified':
            return '/notifications';
        default:
            // do nothing if we don't know what to do with it
            return null;
    }
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13;
