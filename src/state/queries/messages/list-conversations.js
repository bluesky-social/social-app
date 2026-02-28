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
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { ChatBskyConvoDefs, moderateProfile, } from '@atproto/api';
import { useInfiniteQuery, useQueryClient, } from '@tanstack/react-query';
import throttle from 'lodash.throttle';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { useCurrentConvoId } from '#/state/messages/current-convo-id';
import { useMessagesEventBus } from '#/state/messages/events';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useAgent, useSession } from '#/state/session';
import { useLeftConvos } from './leave-conversation';
export var RQKEY_ROOT = 'convo-list';
export var RQKEY = function (status, readState) {
    if (readState === void 0) { readState = 'all'; }
    return [RQKEY_ROOT, status, readState];
};
export function useListConvosQuery(_a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, enabled = _b.enabled, status = _b.status, _c = _b.readState, readState = _c === void 0 ? 'all' : _c;
    var agent = useAgent();
    return useInfiniteQuery({
        enabled: enabled,
        queryKey: RQKEY(status !== null && status !== void 0 ? status : 'all', readState),
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var data;
            var pageParam = _b.pageParam;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.chat.bsky.convo.listConvos({
                            limit: 20,
                            cursor: pageParam,
                            readState: readState === 'unread' ? 'unread' : undefined,
                            status: status,
                        }, { headers: DM_SERVICE_HEADERS })];
                    case 1:
                        data = (_c.sent()).data;
                        return [2 /*return*/, data];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
    });
}
var ListConvosContext = createContext(null);
ListConvosContext.displayName = 'ListConvosContext';
export function useListConvos() {
    var ctx = useContext(ListConvosContext);
    if (!ctx) {
        throw new Error('useListConvos must be used within a ListConvosProvider');
    }
    return ctx;
}
var empty = { accepted: [], request: [] };
export function ListConvosProvider(_a) {
    var children = _a.children;
    var hasSession = useSession().hasSession;
    if (!hasSession) {
        return (_jsx(ListConvosContext.Provider, { value: empty, children: children }));
    }
    return _jsx(ListConvosProviderInner, { children: children });
}
export function ListConvosProviderInner(_a) {
    var children = _a.children;
    var _b = useListConvosQuery({ readState: 'unread' }), refetch = _b.refetch, data = _b.data;
    var messagesBus = useMessagesEventBus();
    var queryClient = useQueryClient();
    var currentConvoId = useCurrentConvoId().currentConvoId;
    var currentAccount = useSession().currentAccount;
    var leftConvos = useLeftConvos();
    var debouncedRefetch = useMemo(function () {
        var refetchAndInvalidate = function () {
            refetch();
            queryClient.invalidateQueries({ queryKey: [RQKEY_ROOT] });
        };
        return throttle(refetchAndInvalidate, 500, {
            leading: true,
            trailing: true,
        });
    }, [refetch, queryClient]);
    useEffect(function () {
        var unsub = messagesBus.on(function (events) {
            if (events.type !== 'logs')
                return;
            var _loop_1 = function (log) {
                if (ChatBskyConvoDefs.isLogBeginConvo(log)) {
                    debouncedRefetch();
                }
                else if (ChatBskyConvoDefs.isLogLeaveConvo(log)) {
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) { return optimisticDelete(log.convoId, old); });
                }
                else if (ChatBskyConvoDefs.isLogDeleteMessage(log)) {
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
                        return optimisticUpdate(log.convoId, old, function (convo) {
                            if ((ChatBskyConvoDefs.isDeletedMessageView(log.message) ||
                                ChatBskyConvoDefs.isMessageView(log.message)) &&
                                (ChatBskyConvoDefs.isDeletedMessageView(convo.lastMessage) ||
                                    ChatBskyConvoDefs.isMessageView(convo.lastMessage))) {
                                return log.message.id === convo.lastMessage.id
                                    ? __assign(__assign({}, convo), { rev: log.rev, lastMessage: log.message }) : convo;
                            }
                            else {
                                return convo;
                            }
                        });
                    });
                }
                else if (ChatBskyConvoDefs.isLogCreateMessage(log)) {
                    // Store in a new var to avoid TS errors due to closures.
                    var logRef_1 = log;
                    // Get all matching queries
                    var queries = queryClient.getQueriesData({
                        queryKey: [RQKEY_ROOT],
                    });
                    // Check if convo exists in any query
                    var foundConvo = null;
                    for (var _b = 0, queries_1 = queries; _b < queries_1.length; _b++) {
                        var _c = queries_1[_b], _key = _c[0], query = _c[1];
                        if (!query)
                            continue;
                        var convo = getConvoFromQueryData(logRef_1.convoId, query);
                        if (convo) {
                            foundConvo = convo;
                            break;
                        }
                    }
                    if (!foundConvo) {
                        // Convo not found, trigger refetch
                        debouncedRefetch();
                        return { value: void 0 };
                    }
                    // Update the convo
                    var updatedConvo_1 = __assign(__assign({}, foundConvo), { rev: logRef_1.rev, lastMessage: logRef_1.message, unreadCount: foundConvo.id !== currentConvoId
                            ? (ChatBskyConvoDefs.isMessageView(logRef_1.message) ||
                                ChatBskyConvoDefs.isDeletedMessageView(logRef_1.message)) &&
                                logRef_1.message.sender.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)
                                ? foundConvo.unreadCount + 1
                                : foundConvo.unreadCount
                            : 0 });
                    function filterConvoFromPage(convo) {
                        return convo.filter(function (c) { return c.id !== logRef_1.convoId; });
                    }
                    // Update all matching queries
                    function updateFn(old) {
                        if (!old)
                            return old;
                        return __assign(__assign({}, old), { pages: old.pages.map(function (page, i) {
                                if (i === 0) {
                                    return __assign(__assign({}, page), { convos: __spreadArray([
                                            updatedConvo_1
                                        ], filterConvoFromPage(page.convos), true) });
                                }
                                return __assign(__assign({}, page), { convos: filterConvoFromPage(page.convos) });
                            }) });
                    }
                    // always update the unread one
                    queryClient.setQueriesData({ queryKey: RQKEY('all', 'unread') }, function (old) {
                        return old
                            ? updateFn(old)
                            : {
                                pageParams: [undefined],
                                pages: [{ convos: [updatedConvo_1], cursor: undefined }],
                            };
                    });
                    // update the other ones based on status of the incoming message
                    if (updatedConvo_1.status === 'accepted') {
                        queryClient.setQueriesData({ queryKey: RQKEY('accepted') }, updateFn);
                    }
                    else if (updatedConvo_1.status === 'request') {
                        queryClient.setQueriesData({ queryKey: RQKEY('request') }, updateFn);
                    }
                }
                else if (ChatBskyConvoDefs.isLogReadMessage(log)) {
                    var logRef_2 = log;
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
                        return optimisticUpdate(logRef_2.convoId, old, function (convo) { return (__assign(__assign({}, convo), { unreadCount: 0, rev: logRef_2.rev })); });
                    });
                }
                else if (ChatBskyConvoDefs.isLogAcceptConvo(log)) {
                    var logRef_3 = log;
                    var requests = queryClient.getQueryData(RQKEY('request'));
                    if (!requests) {
                        debouncedRefetch();
                        return { value: void 0 };
                    }
                    var acceptedConvo_1 = getConvoFromQueryData(log.convoId, requests);
                    if (!acceptedConvo_1) {
                        debouncedRefetch();
                        return { value: void 0 };
                    }
                    queryClient.setQueryData(RQKEY('request'), function (old) {
                        return optimisticDelete(logRef_3.convoId, old);
                    });
                    queryClient.setQueriesData({ queryKey: RQKEY('accepted') }, function (old) {
                        if (!old) {
                            debouncedRefetch();
                            return old;
                        }
                        return __assign(__assign({}, old), { pages: old.pages.map(function (page, i) {
                                if (i === 0) {
                                    return __assign(__assign({}, page), { convos: __spreadArray([
                                            __assign(__assign({}, acceptedConvo_1), { status: 'accepted' })
                                        ], page.convos, true) });
                                }
                                return page;
                            }) });
                    });
                }
                else if (ChatBskyConvoDefs.isLogMuteConvo(log)) {
                    var logRef_4 = log;
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
                        return optimisticUpdate(logRef_4.convoId, old, function (convo) { return (__assign(__assign({}, convo), { muted: true, rev: logRef_4.rev })); });
                    });
                }
                else if (ChatBskyConvoDefs.isLogUnmuteConvo(log)) {
                    var logRef_5 = log;
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
                        return optimisticUpdate(logRef_5.convoId, old, function (convo) { return (__assign(__assign({}, convo), { muted: false, rev: logRef_5.rev })); });
                    });
                }
                else if (ChatBskyConvoDefs.isLogAddReaction(log)) {
                    var logRef_6 = log;
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
                        return optimisticUpdate(logRef_6.convoId, old, function (convo) { return (__assign(__assign({}, convo), { lastReaction: {
                                $type: 'chat.bsky.convo.defs#messageAndReactionView',
                                reaction: logRef_6.reaction,
                                message: logRef_6.message,
                            }, rev: logRef_6.rev })); });
                    });
                }
                else if (ChatBskyConvoDefs.isLogRemoveReaction(log)) {
                    var logRef_7 = log;
                    queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
                        return optimisticUpdate(logRef_7.convoId, old, function (convo) {
                            if (
                            // if the convo is the same
                            logRef_7.convoId === convo.id &&
                                ChatBskyConvoDefs.isMessageAndReactionView(convo.lastReaction) &&
                                ChatBskyConvoDefs.isMessageView(logRef_7.message) &&
                                // ...and the message is the same
                                convo.lastReaction.message.id === logRef_7.message.id &&
                                // ...and the reaction is the same
                                convo.lastReaction.reaction.sender.did ===
                                    logRef_7.reaction.sender.did &&
                                convo.lastReaction.reaction.value === logRef_7.reaction.value) {
                                return __assign(__assign({}, convo), { 
                                    // ...remove the reaction. hopefully they didn't react twice in a row!
                                    lastReaction: undefined, rev: logRef_7.rev });
                            }
                            else {
                                return convo;
                            }
                        });
                    });
                }
            };
            for (var _i = 0, _a = events.logs; _i < _a.length; _i++) {
                var log = _a[_i];
                var state_1 = _loop_1(log);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        }, {
            // get events for all chats
            convoId: undefined,
        });
        return function () { return unsub(); };
    }, [
        messagesBus,
        currentConvoId,
        queryClient,
        currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        debouncedRefetch,
    ]);
    var ctx = useMemo(function () {
        var _a;
        var convos = (_a = data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.convos; }).filter(function (convo) { return !leftConvos.includes(convo.id); })) !== null && _a !== void 0 ? _a : [];
        return {
            accepted: convos.filter(function (conv) { return conv.status === 'accepted'; }),
            request: convos.filter(function (conv) { return conv.status === 'request'; }),
        };
    }, [data, leftConvos]);
    return (_jsx(ListConvosContext.Provider, { value: ctx, children: children }));
}
export function useUnreadMessageCount() {
    var currentConvoId = useCurrentConvoId().currentConvoId;
    var currentAccount = useSession().currentAccount;
    var _a = useListConvos(), accepted = _a.accepted, request = _a.request;
    var moderationOpts = useModerationOpts();
    return useMemo(function () {
        var acceptedCount = calculateCount(accepted, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, currentConvoId, moderationOpts);
        var requestCount = calculateCount(request, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, currentConvoId, moderationOpts);
        if (acceptedCount > 0) {
            var total = acceptedCount + Math.min(requestCount, 1);
            return {
                count: total,
                numUnread: total > 10 ? '10+' : String(total),
                // only needed when numUnread is undefined
                hasNew: false,
            };
        }
        else if (requestCount > 0) {
            return {
                count: 1,
                numUnread: undefined,
                hasNew: true,
            };
        }
        else {
            return {
                count: 0,
                numUnread: undefined,
                hasNew: false,
            };
        }
    }, [accepted, request, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, currentConvoId, moderationOpts]);
}
function calculateCount(convos, currentAccountDid, currentConvoId, moderationOpts) {
    var _a;
    return ((_a = convos
        .filter(function (convo) { return convo.id !== currentConvoId; })
        .reduce(function (acc, convo) {
        var otherMember = convo.members.find(function (member) { return member.did !== currentAccountDid; });
        if (!otherMember || !moderationOpts)
            return acc;
        var moderation = moderateProfile(otherMember, moderationOpts);
        var shouldIgnore = convo.muted ||
            moderation.blocked ||
            otherMember.handle === 'missing.invalid';
        var unreadCount = !shouldIgnore && convo.unreadCount > 0 ? 1 : 0;
        return acc + unreadCount;
    }, 0)) !== null && _a !== void 0 ? _a : 0);
}
export function useOnMarkAsRead() {
    var queryClient = useQueryClient();
    return useCallback(function (chatId) {
        queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, function (old) {
            if (!old)
                return old;
            return optimisticUpdate(chatId, old, function (convo) { return (__assign(__assign({}, convo), { unreadCount: 0 })); });
        });
    }, [queryClient]);
}
function optimisticUpdate(chatId, old, updateFn) {
    if (!old || !updateFn)
        return old;
    return __assign(__assign({}, old), { pages: old.pages.map(function (page) { return (__assign(__assign({}, page), { convos: page.convos.map(function (convo) {
                return chatId === convo.id ? updateFn(convo) : convo;
            }) })); }) });
}
function optimisticDelete(chatId, old) {
    if (!old)
        return old;
    return __assign(__assign({}, old), { pages: old.pages.map(function (page) { return (__assign(__assign({}, page), { convos: page.convos.filter(function (convo) { return chatId !== convo.id; }) })); }) });
}
export function getConvoFromQueryData(chatId, old) {
    for (var _i = 0, _a = old.pages; _i < _a.length; _i++) {
        var page = _a[_i];
        for (var _b = 0, _c = page.convos; _b < _c.length; _b++) {
            var convo = _c[_b];
            if (convo.id === chatId) {
                return convo;
            }
        }
    }
    return null;
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, convo, _f, _g, member;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _h.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 10];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 9];
                }
                _b = 0, _c = queryData.pages;
                _h.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 9];
                page = _c[_b];
                _d = 0, _e = page.convos;
                _h.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 8];
                convo = _e[_d];
                _f = 0, _g = convo.members;
                _h.label = 4;
            case 4:
                if (!(_f < _g.length)) return [3 /*break*/, 7];
                member = _g[_f];
                if (!(member.did === did)) return [3 /*break*/, 6];
                return [4 /*yield*/, member];
            case 5:
                _h.sent();
                _h.label = 6;
            case 6:
                _f++;
                return [3 /*break*/, 4];
            case 7:
                _d++;
                return [3 /*break*/, 3];
            case 8:
                _b++;
                return [3 /*break*/, 2];
            case 9:
                _i++;
                return [3 /*break*/, 1];
            case 10: return [2 /*return*/];
        }
    });
}
