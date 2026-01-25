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
import { moderateFeedGenerator, } from '@atproto/api';
import { useInfiniteQuery, } from '@tanstack/react-query';
import { useAgent } from '#/state/session';
import { useModerationOpts } from '../preferences/moderation-opts';
var PAGE_SIZE = 50;
// TODO refactor invalidate on mutate?
export var RQKEY_ROOT = 'profile-feedgens';
export var RQKEY = function (did) { return [RQKEY_ROOT, did]; };
export function useProfileFeedgensQuery(did, opts) {
    var moderationOpts = useModerationOpts();
    var enabled = (opts === null || opts === void 0 ? void 0 : opts.enabled) !== false && Boolean(moderationOpts);
    var agent = useAgent();
    return useInfiniteQuery({
        queryKey: RQKEY(did),
        queryFn: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var res;
                var pageParam = _b.pageParam;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, agent.app.bsky.feed.getActorFeeds({
                                actor: did,
                                limit: PAGE_SIZE,
                                cursor: pageParam,
                            })];
                        case 1:
                            res = _c.sent();
                            res.data.feeds.sort(function (a, b) {
                                return (b.likeCount || 0) - (a.likeCount || 0);
                            });
                            return [2 /*return*/, res.data];
                    }
                });
            });
        },
        initialPageParam: undefined,
        getNextPageParam: function (lastPage) { return lastPage.cursor; },
        enabled: enabled,
        select: function (data) {
            return __assign(__assign({}, data), { pages: data.pages.map(function (page) {
                    return __assign(__assign({}, page), { feeds: page.feeds
                            // filter by labels
                            .filter(function (list) {
                            var decision = moderateFeedGenerator(list, moderationOpts);
                            return !decision.ui('contentList').filter;
                        }) });
                }) });
        },
    });
}
