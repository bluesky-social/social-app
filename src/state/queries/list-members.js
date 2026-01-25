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
import { STALE } from '#/state/queries';
import { useAgent } from '#/state/session';
var PAGE_SIZE = 30;
var RQKEY_ROOT = 'list-members';
var RQKEY_ROOT_ALL = 'list-members-all';
export var RQKEY = function (uri) { return [RQKEY_ROOT, uri]; };
export var RQKEY_ALL = function (uri) { return [RQKEY_ROOT_ALL, uri]; };
export function useListMembersQuery(uri, limit) {
    if (limit === void 0) { limit = PAGE_SIZE; }
    var agent = useAgent();
    return useInfiniteQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: RQKEY(uri !== null && uri !== void 0 ? uri : ''),
        queryFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var res;
                var pageParam = _b.pageParam;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, agent.app.bsky.graph.getList({
                                list: uri, // the enabled flag will prevent this from running until uri is set
                                limit: limit,
                                cursor: pageParam,
                            })];
                        case 1:
                            res = _c.sent();
                            return [2 /*return*/, res.data];
                    }
                });
            });
        },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
        enabled: Boolean(uri),
    });
}
export function useAllListMembersQuery(uri) {
    var _this = this;
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: RQKEY_ALL(uri !== null && uri !== void 0 ? uri : ''),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getAllListMembers(agent, uri)];
            });
        }); },
        enabled: Boolean(uri),
    });
}
export function getAllListMembers(agent, uri) {
    return __awaiter(this, void 0, void 0, function () {
        var hasMore, cursor, listItems, i, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    hasMore = true;
                    listItems = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(hasMore && i < 6)) return [3 /*break*/, 3];
                    return [4 /*yield*/, agent.app.bsky.graph.getList({
                            list: uri,
                            limit: 50,
                            cursor: cursor,
                        })];
                case 2:
                    res = _a.sent();
                    listItems.push.apply(listItems, res.data.items);
                    hasMore = Boolean(res.data.cursor);
                    cursor = res.data.cursor;
                    i++;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, listItems];
            }
        });
    });
}
export function invalidateListMembersQuery(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var queryClient = _b.queryClient, uri = _b.uri;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: RQKEY(uri) })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, item, allQueryData, _f, allQueryData_1, _g, _queryKey, queryData, _h, queryData_1, item;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, queryDatas_1 = queryDatas;
                _j.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 10];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 9];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _j.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 9];
                page = _c[_b];
                if (!(page.list.creator.did === did)) return [3 /*break*/, 4];
                return [4 /*yield*/, page.list.creator];
            case 3:
                _j.sent();
                _j.label = 4;
            case 4:
                _d = 0, _e = page.items;
                _j.label = 5;
            case 5:
                if (!(_d < _e.length)) return [3 /*break*/, 8];
                item = _e[_d];
                if (!(item.subject.did === did)) return [3 /*break*/, 7];
                return [4 /*yield*/, item.subject];
            case 6:
                _j.sent();
                _j.label = 7;
            case 7:
                _d++;
                return [3 /*break*/, 5];
            case 8:
                _b++;
                return [3 /*break*/, 2];
            case 9:
                _i++;
                return [3 /*break*/, 1];
            case 10:
                allQueryData = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT_ALL],
                });
                _f = 0, allQueryData_1 = allQueryData;
                _j.label = 11;
            case 11:
                if (!(_f < allQueryData_1.length)) return [3 /*break*/, 16];
                _g = allQueryData_1[_f], _queryKey = _g[0], queryData = _g[1];
                if (!queryData) {
                    return [3 /*break*/, 15];
                }
                _h = 0, queryData_1 = queryData;
                _j.label = 12;
            case 12:
                if (!(_h < queryData_1.length)) return [3 /*break*/, 15];
                item = queryData_1[_h];
                if (!(item.subject.did === did)) return [3 /*break*/, 14];
                return [4 /*yield*/, item.subject];
            case 13:
                _j.sent();
                _j.label = 14;
            case 14:
                _h++;
                return [3 /*break*/, 12];
            case 15:
                _f++;
                return [3 /*break*/, 11];
            case 16: return [2 /*return*/];
        }
    });
}
