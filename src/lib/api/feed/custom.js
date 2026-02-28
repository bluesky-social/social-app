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
import { BskyAgent, jsonStringToLex, } from '@atproto/api';
import { getAppLanguageAsContentLanguage, getContentLanguages, } from '#/state/preferences/languages';
import { createBskyTopicsHeader, isBlueskyOwnedFeed } from './utils';
var CustomFeedAPI = /** @class */ (function () {
    function CustomFeedAPI(_a) {
        var agent = _a.agent, feedParams = _a.feedParams, userInterests = _a.userInterests;
        this.agent = agent;
        this.params = feedParams;
        this.userInterests = userInterests;
    }
    CustomFeedAPI.prototype.peekLatest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var contentLangs, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contentLangs = getContentLanguages().join(',');
                        return [4 /*yield*/, this.agent.app.bsky.feed.getFeed(__assign(__assign({}, this.params), { limit: 1 }), { headers: { 'Accept-Language': contentLangs } })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.feed[0]];
                }
            });
        });
    };
    CustomFeedAPI.prototype.fetch = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var contentLangs, agent, isBlueskyOwned, res, _c;
            var cursor = _b.cursor, limit = _b.limit;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        contentLangs = getContentLanguages().join(',');
                        agent = this.agent;
                        isBlueskyOwned = isBlueskyOwnedFeed(this.params.feed);
                        if (!agent.did) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.agent.app.bsky.feed.getFeed(__assign(__assign({}, this.params), { cursor: cursor, limit: limit }), {
                                headers: __assign(__assign({}, (isBlueskyOwned
                                    ? createBskyTopicsHeader(this.userInterests)
                                    : {})), { 'Accept-Language': contentLangs }),
                            })];
                    case 1:
                        _c = _d.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, loggedOutFetch(__assign(__assign({}, this.params), { cursor: cursor, limit: limit }))];
                    case 3:
                        _c = _d.sent();
                        _d.label = 4;
                    case 4:
                        res = _c;
                        if (res.success) {
                            // NOTE
                            // some custom feeds fail to enforce the pagination limit
                            // so we manually truncate here
                            // -prf
                            if (res.data.feed.length > limit) {
                                res.data.feed = res.data.feed.slice(0, limit);
                            }
                            return [2 /*return*/, {
                                    cursor: res.data.feed.length ? res.data.cursor : undefined,
                                    feed: res.data.feed,
                                }];
                        }
                        return [2 /*return*/, {
                                feed: [],
                            }];
                }
            });
        });
    };
    return CustomFeedAPI;
}());
export { CustomFeedAPI };
// HACK
// we want feeds to give language-specific results immediately when a
// logged-out user changes their language. this comes with two problems:
// 1. not all languages have content, and
// 2. our public caching layer isnt correctly busting against the accept-language header
// for now we handle both of these with a manual workaround
// -prf
function loggedOutFetch(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var contentLangs, labelersHeader, res, data, _c, _d, _e, _f;
        var _g, _h;
        var feed = _b.feed, limit = _b.limit, cursor = _b.cursor;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    contentLangs = getAppLanguageAsContentLanguage();
                    labelersHeader = {
                        'atproto-accept-labelers': BskyAgent.appLabelers
                            .map(function (l) { return "".concat(l, ";redact"); })
                            .join(', '),
                    };
                    return [4 /*yield*/, fetch("https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=".concat(feed).concat(cursor ? "&cursor=".concat(cursor) : '', "&limit=").concat(limit, "&lang=").concat(contentLangs), {
                            method: 'GET',
                            headers: __assign({ 'Accept-Language': contentLangs }, labelersHeader),
                        })];
                case 1:
                    res = _j.sent();
                    if (!res.ok) return [3 /*break*/, 3];
                    _d = jsonStringToLex;
                    return [4 /*yield*/, res.text()];
                case 2:
                    _c = _d.apply(void 0, [_j.sent()]);
                    return [3 /*break*/, 4];
                case 3:
                    _c = null;
                    _j.label = 4;
                case 4:
                    data = _c;
                    if ((_g = data === null || data === void 0 ? void 0 : data.feed) === null || _g === void 0 ? void 0 : _g.length) {
                        return [2 /*return*/, {
                                success: true,
                                data: data,
                            }];
                    }
                    return [4 /*yield*/, fetch("https://api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=".concat(feed).concat(cursor ? "&cursor=".concat(cursor) : '', "&limit=").concat(limit), { method: 'GET', headers: __assign({ 'Accept-Language': '' }, labelersHeader) })];
                case 5:
                    // no data, try again with language headers removed
                    res = _j.sent();
                    if (!res.ok) return [3 /*break*/, 7];
                    _f = jsonStringToLex;
                    return [4 /*yield*/, res.text()];
                case 6:
                    _e = _f.apply(void 0, [_j.sent()]);
                    return [3 /*break*/, 8];
                case 7:
                    _e = null;
                    _j.label = 8;
                case 8:
                    data = _e;
                    if ((_h = data === null || data === void 0 ? void 0 : data.feed) === null || _h === void 0 ? void 0 : _h.length) {
                        return [2 /*return*/, {
                                success: true,
                                data: data,
                            }];
                    }
                    return [2 /*return*/, {
                            success: false,
                            data: { feed: [] },
                        }];
            }
        });
    });
}
