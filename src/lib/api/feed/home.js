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
import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { CustomFeedAPI } from './custom';
import { FollowingFeedAPI } from './following';
// HACK
// the feed API does not include any facilities for passing down
// non-post elements. adding that is a bit of a heavy lift, and we
// have just one temporary usecase for it: flagging when the home feed
// falls back to discover.
// we use this fallback marker post to drive this instead. see Feed.tsx
// for the usage.
// -prf
export var FALLBACK_MARKER_POST = {
    post: {
        uri: 'fallback-marker-post',
        cid: 'fake',
        record: {},
        author: {
            did: 'did:fake',
            handle: 'fake.com',
        },
        indexedAt: new Date().toISOString(),
    },
};
var HomeFeedAPI = /** @class */ (function () {
    function HomeFeedAPI(_a) {
        var userInterests = _a.userInterests, agent = _a.agent;
        this.usingDiscover = false;
        this.itemCursor = 0;
        this.agent = agent;
        this.following = new FollowingFeedAPI({ agent: agent });
        this.discover = new CustomFeedAPI({
            agent: agent,
            feedParams: { feed: PROD_DEFAULT_FEED('whats-hot') },
        });
        this.userInterests = userInterests;
    }
    HomeFeedAPI.prototype.reset = function () {
        this.following = new FollowingFeedAPI({ agent: this.agent });
        this.discover = new CustomFeedAPI({
            agent: this.agent,
            feedParams: { feed: PROD_DEFAULT_FEED('whats-hot') },
            userInterests: this.userInterests,
        });
        this.usingDiscover = false;
        this.itemCursor = 0;
    };
    HomeFeedAPI.prototype.peekLatest = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.usingDiscover) {
                    return [2 /*return*/, this.discover.peekLatest()];
                }
                return [2 /*return*/, this.following.peekLatest()];
            });
        });
    };
    HomeFeedAPI.prototype.fetch = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var returnCursor, posts, res, res;
            var cursor = _b.cursor, limit = _b.limit;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!cursor) {
                            this.reset();
                        }
                        posts = [];
                        if (!!this.usingDiscover) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.following.fetch({ cursor: cursor, limit: limit })];
                    case 1:
                        res = _c.sent();
                        returnCursor = res.cursor;
                        posts = posts.concat(res.feed);
                        if (!returnCursor) {
                            cursor = '';
                            posts.push(FALLBACK_MARKER_POST);
                            this.usingDiscover = true;
                        }
                        _c.label = 2;
                    case 2:
                        if (!(this.usingDiscover && !__DEV__)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.discover.fetch({ cursor: cursor, limit: limit })];
                    case 3:
                        res = _c.sent();
                        returnCursor = res.cursor;
                        posts = posts.concat(res.feed);
                        _c.label = 4;
                    case 4: return [2 /*return*/, {
                            cursor: returnCursor,
                            feed: posts,
                        }];
                }
            });
        });
    };
    return HomeFeedAPI;
}());
export { HomeFeedAPI };
