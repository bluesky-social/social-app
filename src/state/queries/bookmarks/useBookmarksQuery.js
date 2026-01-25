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
import { AppBskyFeedDefs, AtUri, } from '@atproto/api';
import { useInfiniteQuery, } from '@tanstack/react-query';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost, } from '#/state/queries/util';
import { useAgent } from '#/state/session';
import * as bsky from '#/types/bsky';
export var bookmarksQueryKeyRoot = 'bookmarks';
export var createBookmarksQueryKey = function () { return [bookmarksQueryKeyRoot]; };
export function useBookmarksQuery() {
    var agent = useAgent();
    return useInfiniteQuery({
        queryKey: createBookmarksQueryKey(),
        queryFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var res;
                var pageParam = _b.pageParam;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, agent.app.bsky.bookmark.getBookmarks({
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
    });
}
export function truncateAndInvalidate(qc) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            qc.setQueriesData({ queryKey: [bookmarksQueryKeyRoot] }, function (data) {
                if (data) {
                    return {
                        pageParams: data.pageParams.slice(0, 1),
                        pages: data.pages.slice(0, 1),
                    };
                }
                return data;
            });
            return [2 /*return*/, qc.invalidateQueries({ queryKey: [bookmarksQueryKeyRoot] })];
        });
    });
}
export function optimisticallySaveBookmark(qc, post) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            qc.setQueriesData({
                queryKey: [bookmarksQueryKeyRoot],
            }, function (data) {
                if (!data)
                    return data;
                return __assign(__assign({}, data), { pages: data.pages.map(function (page, index) {
                        if (index === 0) {
                            post.$type = 'app.bsky.feed.defs#postView';
                            return __assign(__assign({}, page), { bookmarks: __spreadArray([
                                    {
                                        createdAt: new Date().toISOString(),
                                        subject: {
                                            uri: post.uri,
                                            cid: post.cid,
                                        },
                                        item: post,
                                    }
                                ], page.bookmarks, true) });
                        }
                        return page;
                    }) });
            });
            return [2 /*return*/];
        });
    });
}
export function optimisticallyDeleteBookmark(qc_1, _a) {
    return __awaiter(this, arguments, void 0, function (qc, _b) {
        var uri = _b.uri;
        return __generator(this, function (_c) {
            qc.setQueriesData({
                queryKey: [bookmarksQueryKeyRoot],
            }, function (data) {
                if (!data)
                    return data;
                return __assign(__assign({}, data), { pages: data.pages.map(function (page) {
                        return __assign(__assign({}, page), { bookmarks: page.bookmarks.filter(function (b) { return b.subject.uri !== uri; }) });
                    }) });
            });
            return [2 /*return*/];
        });
    });
}
export function findAllPostsInQueryData(queryClient, uri) {
    var queryDatas, atUri, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, bookmark, quotedPost;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [bookmarksQueryKeyRoot],
                });
                atUri = new AtUri(uri);
                _i = 0, queryDatas_1 = queryDatas;
                _f.label = 1;
            case 1:
                if (!(_i < queryDatas_1.length)) return [3 /*break*/, 10];
                _a = queryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 9];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _f.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 9];
                page = _c[_b];
                _d = 0, _e = page.bookmarks;
                _f.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 8];
                bookmark = _e[_d];
                if (!bsky.dangerousIsType(bookmark.item, AppBskyFeedDefs.isPostView))
                    return [3 /*break*/, 7];
                if (!didOrHandleUriMatches(atUri, bookmark.item)) return [3 /*break*/, 5];
                return [4 /*yield*/, bookmark.item];
            case 4:
                _f.sent();
                _f.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(bookmark.item.embed);
                if (!(quotedPost && didOrHandleUriMatches(atUri, quotedPost))) return [3 /*break*/, 7];
                return [4 /*yield*/, embedViewRecordToPostView(quotedPost)];
            case 6:
                _f.sent();
                _f.label = 7;
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
