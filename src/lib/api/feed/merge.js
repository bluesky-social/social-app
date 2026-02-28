var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import shuffle from 'lodash.shuffle';
import { bundleAsync } from '#/lib/async/bundle';
import { timeout } from '#/lib/async/timeout';
import { feedUriToHref } from '#/lib/strings/url-helpers';
import { getContentLanguages } from '#/state/preferences/languages';
import { FeedTuner } from '../feed-manip';
import { createBskyTopicsHeader, isBlueskyOwnedFeed } from './utils';
var REQUEST_WAIT_MS = 500; // 500ms
var POST_AGE_CUTOFF = 60e3 * 60 * 24; // 24hours
var MergeFeedAPI = /** @class */ (function () {
    function MergeFeedAPI(_a) {
        var agent = _a.agent, feedParams = _a.feedParams, feedTuners = _a.feedTuners, userInterests = _a.userInterests;
        this.customFeeds = [];
        this.feedCursor = 0;
        this.itemCursor = 0;
        this.sampleCursor = 0;
        this.agent = agent;
        this.params = feedParams;
        this.feedTuners = feedTuners;
        this.userInterests = userInterests;
        this.following = new MergeFeedSource_Following({
            agent: this.agent,
            feedTuners: this.feedTuners,
        });
    }
    MergeFeedAPI.prototype.reset = function () {
        var _this = this;
        this.following = new MergeFeedSource_Following({
            agent: this.agent,
            feedTuners: this.feedTuners,
        });
        this.customFeeds = [];
        this.feedCursor = 0;
        this.itemCursor = 0;
        this.sampleCursor = 0;
        if (this.params.mergeFeedSources) {
            this.customFeeds = shuffle(this.params.mergeFeedSources.map(function (feedUri) {
                return new MergeFeedSource_Custom({
                    agent: _this.agent,
                    feedUri: feedUri,
                    feedTuners: _this.feedTuners,
                    userInterests: _this.userInterests,
                });
            }));
        }
        else {
            this.customFeeds = [];
        }
    };
    MergeFeedAPI.prototype.peekLatest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.agent.getTimeline({
                            limit: 1,
                        })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data.feed[0]];
                }
            });
        });
    };
    MergeFeedAPI.prototype.fetch = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var promises, feeds, outOfFollows, _i, feeds_1, feed, posts, slice;
            var cursor = _b.cursor, limit = _b.limit;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!cursor) {
                            this.reset();
                        }
                        promises = [];
                        if (!(this.following.numReady < limit)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.following.fetchNext(60)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        feeds = this.customFeeds.slice(this.feedCursor, this.feedCursor + 3);
                        this.feedCursor += 3;
                        if (this.feedCursor > this.customFeeds.length) {
                            this.feedCursor = 0;
                        }
                        outOfFollows = !this.following.hasMore && this.following.numReady < limit;
                        if (this.params.mergeFeedEnabled || outOfFollows) {
                            for (_i = 0, feeds_1 = feeds; _i < feeds_1.length; _i++) {
                                feed = feeds_1[_i];
                                if (feed.numReady < 5) {
                                    promises.push(feed.fetchNext(10));
                                }
                            }
                        }
                        // wait for requests (all capped at a fixed timeout)
                        return [4 /*yield*/, Promise.all(promises)
                            // assemble a response by sampling from feeds with content
                        ];
                    case 3:
                        // wait for requests (all capped at a fixed timeout)
                        _c.sent();
                        posts = [];
                        while (posts.length < limit) {
                            slice = this.sampleItem();
                            if (slice[0]) {
                                posts.push(slice[0]);
                            }
                            else {
                                break;
                            }
                        }
                        return [2 /*return*/, {
                                cursor: String(this.itemCursor),
                                feed: posts,
                            }];
                }
            });
        });
    };
    MergeFeedAPI.prototype.sampleItem = function () {
        var i = this.itemCursor++;
        var candidateFeeds = this.customFeeds.filter(function (f) { return f.numReady > 0; });
        var canSample = candidateFeeds.length > 0;
        var hasFollows = this.following.hasMore;
        var hasFollowsReady = this.following.numReady > 0;
        // this condition establishes the frequency that custom feeds are woven into follows
        var shouldSample = this.params.mergeFeedEnabled &&
            i >= 15 &&
            candidateFeeds.length >= 2 &&
            (i % 4 === 0 || i % 5 === 0);
        if (!canSample && !hasFollows) {
            // no data available
            return [];
        }
        if (shouldSample || !hasFollows) {
            // time to sample, or the user isnt following anybody
            return candidateFeeds[this.sampleCursor++ % candidateFeeds.length].take(1);
        }
        if (!hasFollowsReady) {
            // stop here so more follows can be fetched
            return [];
        }
        // provide follow
        return this.following.take(1);
    };
    return MergeFeedAPI;
}());
export { MergeFeedAPI };
var MergeFeedSource = /** @class */ (function () {
    function MergeFeedSource(_a) {
        var agent = _a.agent, feedTuners = _a.feedTuners;
        var _this = this;
        this.cursor = undefined;
        this.queue = [];
        this.hasMore = true;
        this._fetchNextInner = bundleAsync(function (n) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._getFeed(this.cursor, n)];
                    case 1:
                        res = _a.sent();
                        if (res.success) {
                            this.cursor = res.data.cursor;
                            if (res.data.feed.length) {
                                this.queue = this.queue.concat(res.data.feed);
                            }
                            else {
                                this.hasMore = false;
                            }
                        }
                        else {
                            this.hasMore = false;
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        this.agent = agent;
        this.feedTuners = feedTuners;
    }
    Object.defineProperty(MergeFeedSource.prototype, "numReady", {
        get: function () {
            return this.queue.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MergeFeedSource.prototype, "needsFetch", {
        get: function () {
            return this.hasMore && this.queue.length === 0;
        },
        enumerable: false,
        configurable: true
    });
    MergeFeedSource.prototype.take = function (n) {
        return this.queue.splice(0, n);
    };
    MergeFeedSource.prototype.fetchNext = function (n) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.race([this._fetchNextInner(n), timeout(REQUEST_WAIT_MS)])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MergeFeedSource.prototype._getFeed = function (_cursor, _limit) {
        throw new Error('Must be overridden');
    };
    return MergeFeedSource;
}());
var MergeFeedSource_Following = /** @class */ (function (_super) {
    __extends(MergeFeedSource_Following, _super);
    function MergeFeedSource_Following() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.tuner = new FeedTuner(_this.feedTuners);
        return _this;
    }
    MergeFeedSource_Following.prototype.fetchNext = function (n) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._fetchNextInner(n)];
            });
        });
    };
    MergeFeedSource_Following.prototype._getFeed = function (cursor, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var res, slices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.agent.getTimeline({ cursor: cursor, limit: limit })
                        // run the tuner pre-emptively to ensure better mixing
                    ];
                    case 1:
                        res = _a.sent();
                        slices = this.tuner.tune(res.data.feed, {
                            dryRun: false,
                        });
                        res.data.feed = slices.map(function (slice) { return slice._feedPost; });
                        return [2 /*return*/, res];
                }
            });
        });
    };
    return MergeFeedSource_Following;
}(MergeFeedSource));
var MergeFeedSource_Custom = /** @class */ (function (_super) {
    __extends(MergeFeedSource_Custom, _super);
    function MergeFeedSource_Custom(_a) {
        var agent = _a.agent, feedUri = _a.feedUri, feedTuners = _a.feedTuners, userInterests = _a.userInterests;
        var _this = _super.call(this, {
            agent: agent,
            feedTuners: feedTuners,
        }) || this;
        _this.agent = agent;
        _this.feedUri = feedUri;
        _this.userInterests = userInterests;
        _this.sourceInfo = {
            $type: 'reasonFeedSource',
            uri: feedUri,
            href: feedUriToHref(feedUri),
        };
        _this.minDate = new Date(Date.now() - POST_AGE_CUTOFF);
        return _this;
    }
    MergeFeedSource_Custom.prototype._getFeed = function (cursor, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var contentLangs, isBlueskyOwned, res, _i, _a, post, _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        contentLangs = getContentLanguages().join(',');
                        isBlueskyOwned = isBlueskyOwnedFeed(this.feedUri);
                        return [4 /*yield*/, this.agent.app.bsky.feed.getFeed({
                                cursor: cursor,
                                limit: limit,
                                feed: this.feedUri,
                            }, {
                                headers: __assign(__assign({}, (isBlueskyOwned
                                    ? createBskyTopicsHeader(this.userInterests)
                                    : {})), { 'Accept-Language': contentLangs }),
                            })
                            // NOTE
                            // some custom feeds fail to enforce the pagination limit
                            // so we manually truncate here
                            // -prf
                        ];
                    case 1:
                        res = _c.sent();
                        // NOTE
                        // some custom feeds fail to enforce the pagination limit
                        // so we manually truncate here
                        // -prf
                        if (limit && res.data.feed.length > limit) {
                            res.data.feed = res.data.feed.slice(0, limit);
                        }
                        // filter out older posts
                        res.data.feed = res.data.feed.filter(function (post) { return new Date(post.post.indexedAt) > _this.minDate; });
                        // attach source info
                        for (_i = 0, _a = res.data.feed; _i < _a.length; _i++) {
                            post = _a[_i];
                            // @ts-ignore
                            post.__source = this.sourceInfo;
                        }
                        return [2 /*return*/, res];
                    case 2:
                        _b = _c.sent();
                        // dont bubble custom-feed errors
                        return [2 /*return*/, { success: false, headers: {}, data: { feed: [] } }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MergeFeedSource_Custom;
}(MergeFeedSource));
