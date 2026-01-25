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
import { AppBskyFeedDefs, } from '@atproto/api';
var AuthorFeedAPI = /** @class */ (function () {
    function AuthorFeedAPI(_a) {
        var agent = _a.agent, feedParams = _a.feedParams;
        this.agent = agent;
        this._params = feedParams;
    }
    Object.defineProperty(AuthorFeedAPI.prototype, "params", {
        get: function () {
            var params = __assign({}, this._params);
            params.includePins = params.filter === 'posts_and_author_threads';
            return params;
        },
        enumerable: false,
        configurable: true
    });
    AuthorFeedAPI.prototype.peekLatest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.agent.getAuthorFeed(__assign(__assign({}, this.params), { limit: 1 }))];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.feed[0]];
                }
            });
        });
    };
    AuthorFeedAPI.prototype.fetch = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var res;
            var cursor = _b.cursor, limit = _b.limit;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.agent.getAuthorFeed(__assign(__assign({}, this.params), { cursor: cursor, limit: limit }))];
                    case 1:
                        res = _c.sent();
                        if (res.success) {
                            return [2 /*return*/, {
                                    cursor: res.data.cursor,
                                    feed: this._filter(res.data.feed),
                                }];
                        }
                        return [2 /*return*/, {
                                feed: [],
                            }];
                }
            });
        });
    };
    AuthorFeedAPI.prototype._filter = function (feed) {
        var _this = this;
        if (this.params.filter === 'posts_and_author_threads') {
            return feed.filter(function (post) {
                var isReply = post.reply;
                var isRepost = AppBskyFeedDefs.isReasonRepost(post.reason);
                var isPin = AppBskyFeedDefs.isReasonPin(post.reason);
                if (!isReply)
                    return true;
                if (isRepost || isPin)
                    return true;
                return isReply && isAuthorReplyChain(_this.params.actor, post, feed);
            });
        }
        return feed;
    };
    return AuthorFeedAPI;
}());
export { AuthorFeedAPI };
function isAuthorReplyChain(actor, post, posts) {
    var _a;
    // current post is by a different user (shouldn't happen)
    if (post.post.author.did !== actor)
        return false;
    var replyParent = (_a = post.reply) === null || _a === void 0 ? void 0 : _a.parent;
    if (AppBskyFeedDefs.isPostView(replyParent)) {
        // reply parent is by a different user
        if (replyParent.author.did !== actor)
            return false;
        // A top-level post that matches the parent of the current post.
        var parentPost = posts.find(function (p) { return p.post.uri === replyParent.uri; });
        /*
         * Either we haven't fetched the parent at the top level, or the only
         * record we have is on feedItem.reply.parent, which we've already checked
         * above.
         */
        if (!parentPost)
            return true;
        // Walk up to parent
        return isAuthorReplyChain(actor, parentPost, posts);
    }
    // Just default to showing it
    return true;
}
