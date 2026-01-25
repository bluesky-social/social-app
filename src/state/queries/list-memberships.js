/**
 * NOTE
 *
 * This query is a temporary solution to our lack of server API for
 * querying user membership in an API. It is extremely inefficient.
 *
 * THIS SHOULD ONLY BE USED IN MODALS FOR MODIFYING A USER'S LIST MEMBERSHIP!
 * Use the list-members query for rendering a list's members.
 *
 * It works by fetching *all* of the user's list item records and querying
 * or manipulating that cache. For users with large lists, it will fall
 * down completely, so be very conservative about how you use it.
 *
 * -prf
 */
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
import { AtUri } from '@atproto/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE } from '#/state/queries';
import { RQKEY as LIST_MEMBERS_RQKEY } from '#/state/queries/list-members';
import { useAgent, useSession } from '#/state/session';
// sanity limit is SANITY_PAGE_LIMIT*PAGE_SIZE total records
var SANITY_PAGE_LIMIT = 1000;
var PAGE_SIZE = 100;
// ...which comes 100,000k list members
var RQKEY_ROOT = 'list-memberships';
export var RQKEY = function () { return [RQKEY_ROOT]; };
/**
 * This API is dangerous! Read the note above!
 */
export function useDangerousListMembershipsQuery() {
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.MINUTES.FIVE,
        queryKey: RQKEY(),
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                var cursor, arr, i, res;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!currentAccount) {
                                return [2 /*return*/, []];
                            }
                            arr = [];
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < SANITY_PAGE_LIMIT)) return [3 /*break*/, 4];
                            return [4 /*yield*/, agent.app.bsky.graph.listitem.list({
                                    repo: currentAccount.did,
                                    limit: PAGE_SIZE,
                                    cursor: cursor,
                                })];
                        case 2:
                            res = _a.sent();
                            arr = arr.concat(res.records.map(function (r) { return ({
                                membershipUri: r.uri,
                                listUri: r.value.list,
                                actorDid: r.value.subject,
                            }); }));
                            cursor = res.cursor;
                            if (!cursor) {
                                return [3 /*break*/, 4];
                            }
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, arr];
                    }
                });
            });
        },
    });
}
/**
 * Returns undefined for pending, false for not a member, and string for a member (the URI of the membership record)
 */
export function getMembership(memberships, list, actor) {
    if (!memberships) {
        return undefined;
    }
    var membership = memberships.find(function (m) { return m.listUri === list && m.actorDid === actor; });
    return membership ? membership.membershipUri : false;
}
export function useListMembershipAddMutation(_a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, onSuccess = _b.onSuccess, onError = _b.onError;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var res;
            var listUri = _b.listUri, actorDid = _b.actorDid;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!currentAccount) {
                            throw new Error('Not signed in');
                        }
                        return [4 /*yield*/, agent.app.bsky.graph.listitem.create({ repo: currentAccount.did }, {
                                subject: actorDid,
                                list: listUri,
                                createdAt: new Date().toISOString(),
                            })
                            // TODO
                            // we need to wait for appview to update, but there's not an efficient
                            // query for that, so we use a timeout below
                            // -prf
                        ];
                    case 1:
                        res = _c.sent();
                        // TODO
                        // we need to wait for appview to update, but there's not an efficient
                        // query for that, so we use a timeout below
                        // -prf
                        return [2 /*return*/, res];
                }
            });
        }); },
        onSuccess: function (data, variables) {
            // manually update the cache; a refetch is too expensive
            var memberships = queryClient.getQueryData(RQKEY());
            if (memberships) {
                memberships = memberships
                    // avoid dups
                    .filter(function (m) {
                    return !(m.actorDid === variables.actorDid &&
                        m.listUri === variables.listUri);
                })
                    .concat([
                    __assign(__assign({}, variables), { membershipUri: data.uri }),
                ]);
                queryClient.setQueryData(RQKEY(), memberships);
            }
            // invalidate the members queries (used for rendering the listings)
            // use a timeout to wait for the appview (see above)
            setTimeout(function () {
                queryClient.invalidateQueries({
                    queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
                });
            }, 1e3);
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(data);
        },
        onError: onError,
    });
}
export function useListMembershipRemoveMutation(_a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, onSuccess = _b.onSuccess, onError = _b.onError;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var membershipUrip;
            var membershipUri = _b.membershipUri;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!currentAccount) {
                            throw new Error('Not signed in');
                        }
                        membershipUrip = new AtUri(membershipUri);
                        return [4 /*yield*/, agent.app.bsky.graph.listitem.delete({
                                repo: currentAccount.did,
                                rkey: membershipUrip.rkey,
                            })
                            // TODO
                            // we need to wait for appview to update, but there's not an efficient
                            // query for that, so we use a timeout below
                            // -prf
                        ];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (data, variables) {
            // manually update the cache; a refetch is too expensive
            var memberships = queryClient.getQueryData(RQKEY());
            if (memberships) {
                memberships = memberships.filter(function (m) {
                    return !(m.actorDid === variables.actorDid &&
                        m.listUri === variables.listUri);
                });
                queryClient.setQueryData(RQKEY(), memberships);
            }
            // invalidate the members queries (used for rendering the listings)
            // use a timeout to wait for the appview (see above)
            setTimeout(function () {
                queryClient.invalidateQueries({
                    queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
                });
            }, 1e3);
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(data);
        },
        onError: onError,
    });
}
