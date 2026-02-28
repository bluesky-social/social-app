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
import { useInfiniteQuery, useQuery, } from '@tanstack/react-query';
import { useAgent } from '#/state/session';
import { STALE } from '.';
var RQ_KEY_ROOT = 'find-contacts';
export var findContactsStatusQueryKey = [RQ_KEY_ROOT, 'sync-status'];
export function useContactsSyncStatusQuery() {
    var _this = this;
    var agent = useAgent();
    return useQuery({
        queryKey: findContactsStatusQueryKey,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.contact.getSyncStatus()];
                    case 1:
                        status = _a.sent();
                        return [2 /*return*/, status.data];
                }
            });
        }); },
        staleTime: STALE.SECONDS.THIRTY,
    });
}
export var findContactsGetMatchesQueryKey = [RQ_KEY_ROOT, 'matches'];
export function useContactsMatchesQuery() {
    var _this = this;
    var agent = useAgent();
    return useInfiniteQuery({
        queryKey: findContactsGetMatchesQueryKey,
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var matches;
            var pageParam = _b.pageParam;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.contact.getMatches({
                            cursor: pageParam,
                        })];
                    case 1:
                        matches = _c.sent();
                        return [2 /*return*/, matches.data];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
        staleTime: STALE.MINUTES.ONE,
    });
}
export function optimisticRemoveMatch(queryClient, did) {
    queryClient.setQueryData(findContactsGetMatchesQueryKey, function (old) {
        if (!old)
            return old;
        return __assign(__assign({}, old), { pages: old.pages.map(function (page) { return (__assign(__assign({}, page), { matches: page.matches.filter(function (match) { return match.did !== did; }) })); }) });
    });
}
export var findContactsMatchesPassthroughQueryKey = function (dids) { return [
    RQ_KEY_ROOT,
    'passthrough',
    dids,
]; };
/**
 * DIRTY HACK WARNING!
 *
 * The only way to get shadow state to work is to put it into React Query.
 * However, when we get the matches it's via a POST, not a GET, so we use a mutation,
 * which means we can't use shadowing!
 *
 * In lieu of any better ideas, I'm just going to take the contacts we have and
 * "launder" them through a dummy query. This will then return "shadow-able" profiles.
 */
export function useMatchesPassthroughQuery(matches) {
    var dids = matches.map(function (match) { return match.profile.did; });
    var data = useQuery({
        queryKey: findContactsMatchesPassthroughQueryKey(dids),
        queryFn: function () {
            return matches;
        },
    }).data;
    return data !== null && data !== void 0 ? data : matches;
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, match, passthroughQueryDatas, _f, passthroughQueryDatas_1, _g, _queryKey, queryData, _h, queryData_1, match;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: findContactsGetMatchesQueryKey,
                });
                _i = 0, queryDatas_1 = queryDatas;
                _j.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 8];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 7];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _j.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 7];
                page = _c[_b];
                _d = 0, _e = page.matches;
                _j.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 6];
                match = _e[_d];
                if (!(match.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, match];
            case 4:
                _j.sent();
                _j.label = 5;
            case 5:
                _d++;
                return [3 /*break*/, 3];
            case 6:
                _b++;
                return [3 /*break*/, 2];
            case 7:
                _i++;
                return [3 /*break*/, 1];
            case 8:
                passthroughQueryDatas = queryClient.getQueriesData({
                    queryKey: [RQ_KEY_ROOT, 'passthrough'],
                });
                _f = 0, passthroughQueryDatas_1 = passthroughQueryDatas;
                _j.label = 9;
            case 9:
                if (!(_f < passthroughQueryDatas_1.length)) return [3 /*break*/, 14];
                _g = passthroughQueryDatas_1[_f], _queryKey = _g[0], queryData = _g[1];
                if (!queryData) {
                    return [3 /*break*/, 13];
                }
                _h = 0, queryData_1 = queryData;
                _j.label = 10;
            case 10:
                if (!(_h < queryData_1.length)) return [3 /*break*/, 13];
                match = queryData_1[_h];
                if (!(match.profile.did === did)) return [3 /*break*/, 12];
                return [4 /*yield*/, match.profile];
            case 11:
                _j.sent();
                _j.label = 12;
            case 12:
                _h++;
                return [3 /*break*/, 10];
            case 13:
                _f++;
                return [3 /*break*/, 9];
            case 14: return [2 /*return*/];
        }
    });
}
