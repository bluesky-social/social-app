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
import React from 'react';
import { AtUri, moderatePost, } from '@atproto/api';
import { useInfiniteQuery, } from '@tanstack/react-query';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useAgent } from '#/state/session';
import { didOrHandleUriMatches, embedViewRecordToPostView, getEmbeddedPost, } from './util';
var searchPostsQueryKeyRoot = 'search-posts';
var searchPostsQueryKey = function (_a) {
    var query = _a.query, sort = _a.sort;
    return [
        searchPostsQueryKeyRoot,
        query,
        sort,
    ];
};
export function useSearchPostsQuery(_a) {
    var _this = this;
    var query = _a.query, sort = _a.sort, enabled = _a.enabled;
    var agent = useAgent();
    var moderationOpts = useModerationOpts();
    var selectArgs = React.useMemo(function () { return ({
        isSearchingSpecificUser: /from:(\w+)/.test(query),
        moderationOpts: moderationOpts,
    }); }, [query, moderationOpts]);
    var lastRun = React.useRef(null);
    return useInfiniteQuery({
        queryKey: searchPostsQueryKey({ query: query, sort: sort }),
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var res;
            var pageParam = _b.pageParam;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.app.bsky.feed.searchPosts({
                            q: query,
                            limit: 25,
                            cursor: pageParam,
                            sort: sort,
                        })];
                    case 1:
                        res = _c.sent();
                        return [2 /*return*/, res.data];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
        enabled: enabled !== null && enabled !== void 0 ? enabled : !!moderationOpts,
        select: React.useCallback(function (data) {
            var moderationOpts = selectArgs.moderationOpts, isSearchingSpecificUser = selectArgs.isSearchingSpecificUser;
            /*
             * If a user applies the `from:<user>` filter, don't apply any
             * moderation. Note that if we add any more filtering logic below, we
             * may need to adjust this.
             */
            if (isSearchingSpecificUser) {
                return data;
            }
            // Keep track of the last run and whether we can reuse
            // some already selected pages from there.
            var reusedPages = [];
            if (lastRun.current) {
                var _a = lastRun.current, lastData = _a.data, lastArgs = _a.args, lastResult = _a.result;
                var canReuse = true;
                for (var key in selectArgs) {
                    if (selectArgs.hasOwnProperty(key)) {
                        if (selectArgs[key] !== lastArgs[key]) {
                            // Can't do reuse anything if any input has changed.
                            canReuse = false;
                            break;
                        }
                    }
                }
                if (canReuse) {
                    for (var i = 0; i < data.pages.length; i++) {
                        if (data.pages[i] && lastData.pages[i] === data.pages[i]) {
                            reusedPages.push(lastResult.pages[i]);
                            continue;
                        }
                        // Stop as soon as pages stop matching up.
                        break;
                    }
                }
            }
            var result = __assign(__assign({}, data), { pages: __spreadArray(__spreadArray([], reusedPages, true), data.pages.slice(reusedPages.length).map(function (page) {
                    return __assign(__assign({}, page), { posts: page.posts.filter(function (post) {
                            var mod = moderatePost(post, moderationOpts);
                            return !mod.ui('contentList').filter;
                        }) });
                }), true) });
            lastRun.current = { data: data, result: result, args: selectArgs };
            return result;
        }, [selectArgs]),
    });
}
export function findAllPostsInQueryData(queryClient, uri) {
    var queryDatas, atUri, _i, queryDatas_1, _a, _queryKey, queryData, _b, _c, page, _d, _e, post, quotedPost;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [searchPostsQueryKeyRoot],
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
                _d = 0, _e = page.posts;
                _f.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 8];
                post = _e[_d];
                if (!didOrHandleUriMatches(atUri, post)) return [3 /*break*/, 5];
                return [4 /*yield*/, post];
            case 4:
                _f.sent();
                _f.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(post.embed);
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
export function findAllProfilesInQueryData(queryClient, did) {
    var queryDatas, _i, queryDatas_2, _a, _queryKey, queryData, _b, _c, page, _d, _e, post, quotedPost;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                queryDatas = queryClient.getQueriesData({
                    queryKey: [searchPostsQueryKeyRoot],
                });
                _i = 0, queryDatas_2 = queryDatas;
                _f.label = 1;
            case 1:
                if (!(_i < queryDatas_2.length)) return [3 /*break*/, 10];
                _a = queryDatas_2[_i], _queryKey = _a[0], queryData = _a[1];
                if (!(queryData === null || queryData === void 0 ? void 0 : queryData.pages)) {
                    return [3 /*break*/, 9];
                }
                _b = 0, _c = queryData === null || queryData === void 0 ? void 0 : queryData.pages;
                _f.label = 2;
            case 2:
                if (!(_b < _c.length)) return [3 /*break*/, 9];
                page = _c[_b];
                _d = 0, _e = page.posts;
                _f.label = 3;
            case 3:
                if (!(_d < _e.length)) return [3 /*break*/, 8];
                post = _e[_d];
                if (!(post.author.did === did)) return [3 /*break*/, 5];
                return [4 /*yield*/, post.author];
            case 4:
                _f.sent();
                _f.label = 5;
            case 5:
                quotedPost = getEmbeddedPost(post.embed);
                if (!((quotedPost === null || quotedPost === void 0 ? void 0 : quotedPost.author.did) === did)) return [3 /*break*/, 7];
                return [4 /*yield*/, quotedPost.author];
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
