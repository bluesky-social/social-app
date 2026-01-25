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
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A kind of companion API to ./feed.ts. See that file for more info.
 */
import React, { useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import EventEmitter from 'eventemitter3';
import BroadcastChannel from '#/lib/broadcast';
import { resetBadgeCount } from '#/lib/notifications/notifications';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useAgent, useSession } from '#/state/session';
import { RQKEY as RQKEY_NOTIFS } from './feed';
import { fetchPage } from './util';
var UPDATE_INTERVAL = 30 * 1e3; // 30sec
var broadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL');
var emitter = new EventEmitter();
var stateContext = React.createContext('');
stateContext.displayName = 'NotificationsUnreadStateContext';
var apiContext = React.createContext({
    markAllRead: function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    },
    checkUnread: function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    },
    getCachedUnreadPage: function () { return undefined; },
});
apiContext.displayName = 'NotificationsUnreadApiContext';
export function Provider(_a) {
    var children = _a.children;
    var hasSession = useSession().hasSession;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var moderationOpts = useModerationOpts();
    var _b = React.useState(''), numUnread = _b[0], setNumUnread = _b[1];
    var checkUnreadRef = React.useRef(null);
    var cacheRef = React.useRef({
        usableInFeed: false,
        syncedAt: new Date(),
        data: undefined,
        unreadCount: 0,
    });
    React.useEffect(function () {
        function markAsUnusable() {
            if (cacheRef.current) {
                cacheRef.current.usableInFeed = false;
            }
        }
        emitter.addListener('invalidate', markAsUnusable);
        return function () {
            emitter.removeListener('invalidate', markAsUnusable);
        };
    }, []);
    // periodic sync
    React.useEffect(function () {
        if (!hasSession || !checkUnreadRef.current) {
            return;
        }
        checkUnreadRef.current(); // fire on init
        var interval = setInterval(function () { var _a; return (_a = checkUnreadRef.current) === null || _a === void 0 ? void 0 : _a.call(checkUnreadRef, { isPoll: true }); }, UPDATE_INTERVAL);
        return function () { return clearInterval(interval); };
    }, [hasSession]);
    // listen for broadcasts
    React.useEffect(function () {
        var listener = function (_a) {
            var data = _a.data;
            cacheRef.current = {
                usableInFeed: false,
                syncedAt: new Date(),
                data: undefined,
                unreadCount: data.event === '30+'
                    ? 30
                    : data.event === ''
                        ? 0
                        : parseInt(data.event, 10) || 1,
            };
            setNumUnread(data.event);
        };
        broadcast.addEventListener('message', listener);
        return function () {
            broadcast.removeEventListener('message', listener);
        };
    }, [setNumUnread]);
    var isFetchingRef = useRef(false);
    // create API
    var api = React.useMemo(function () {
        return {
            markAllRead: function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: 
                            // update server
                            return [4 /*yield*/, agent.updateSeenNotifications(cacheRef.current.syncedAt.toISOString())
                                // update & broadcast
                            ];
                            case 1:
                                // update server
                                _a.sent();
                                // update & broadcast
                                setNumUnread('');
                                broadcast.postMessage({ event: '' });
                                resetBadgeCount();
                                return [2 /*return*/];
                        }
                    });
                });
            },
            checkUnread: function () {
                return __awaiter(this, arguments, void 0, function (_a) {
                    var _b, page, lastIndexed, unreadCount, unreadCountStr, now, lastIndexedDate;
                    var _c, _d;
                    var _e = _a === void 0 ? {} : _a, invalidate = _e.invalidate, isPoll = _e.isPoll;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                _f.trys.push([0, , 2, 3]);
                                if (!agent.session)
                                    return [2 /*return*/];
                                if (AppState.currentState !== 'active') {
                                    return [2 /*return*/];
                                }
                                // reduce polling if unread count is set
                                if (isPoll && ((_c = cacheRef.current) === null || _c === void 0 ? void 0 : _c.unreadCount) !== 0) {
                                    // if hit 30+ then don't poll, otherwise reduce polling by 50%
                                    if (((_d = cacheRef.current) === null || _d === void 0 ? void 0 : _d.unreadCount) >= 30 || Math.random() >= 0.5) {
                                        return [2 /*return*/];
                                    }
                                }
                                if (isFetchingRef.current) {
                                    return [2 /*return*/];
                                }
                                // Do not move this without ensuring it gets a symmetrical reset in the finally block.
                                isFetchingRef.current = true;
                                return [4 /*yield*/, fetchPage({
                                        agent: agent,
                                        cursor: undefined,
                                        limit: 40,
                                        queryClient: queryClient,
                                        moderationOpts: moderationOpts,
                                        reasons: [],
                                        // only fetch subjects when the page is going to be used
                                        // in the notifications query, otherwise skip it
                                        fetchAdditionalData: !!invalidate,
                                    })];
                            case 1:
                                _b = _f.sent(), page = _b.page, lastIndexed = _b.indexedAt;
                                unreadCount = countUnread(page);
                                unreadCountStr = unreadCount >= 30
                                    ? '30+'
                                    : unreadCount === 0
                                        ? ''
                                        : String(unreadCount);
                                now = new Date();
                                lastIndexedDate = lastIndexed
                                    ? new Date(lastIndexed)
                                    : undefined;
                                cacheRef.current = {
                                    usableInFeed: !!invalidate, // will be used immediately
                                    data: page,
                                    syncedAt: !lastIndexedDate || now > lastIndexedDate ? now : lastIndexedDate,
                                    unreadCount: unreadCount,
                                };
                                // update & broadcast
                                setNumUnread(unreadCountStr);
                                if (invalidate) {
                                    truncateAndInvalidate(queryClient, RQKEY_NOTIFS('all'));
                                    truncateAndInvalidate(queryClient, RQKEY_NOTIFS('mentions'));
                                }
                                broadcast.postMessage({ event: unreadCountStr });
                                return [3 /*break*/, 3];
                            case 2:
                                isFetchingRef.current = false;
                                return [7 /*endfinally*/];
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            },
            getCachedUnreadPage: function () {
                // return cached page if it's marked as fresh enough
                if (cacheRef.current.usableInFeed) {
                    return cacheRef.current.data;
                }
            },
        };
    }, [setNumUnread, queryClient, moderationOpts, agent]);
    checkUnreadRef.current = api.checkUnread;
    return (_jsx(stateContext.Provider, { value: numUnread, children: _jsx(apiContext.Provider, { value: api, children: children }) }));
}
export function useUnreadNotifications() {
    return React.useContext(stateContext);
}
export function useUnreadNotificationsApi() {
    return React.useContext(apiContext);
}
function countUnread(page) {
    var num = 0;
    for (var _i = 0, _a = page.items; _i < _a.length; _i++) {
        var item = _a[_i];
        if (!item.notification.isRead) {
            num++;
        }
        if (item.additional) {
            for (var _b = 0, _c = item.additional; _b < _c.length; _b++) {
                var item2 = _c[_b];
                if (!item2.isRead) {
                    num++;
                }
            }
        }
    }
    return num;
}
export function invalidateCachedUnreadPage() {
    emitter.emit('invalidate');
}
