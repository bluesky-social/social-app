import { AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AppBskyFeedDefs, AppBskyFeedPost, } from '@atproto/api';
import * as bsky from '#/types/bsky';
import { isPostInLanguage } from '../../locale/helpers';
import { FALLBACK_MARKER_POST } from './feed/home';
var FeedViewPostsSlice = /** @class */ (function () {
    function FeedViewPostsSlice(feedPost) {
        var _a, _b, _c, _d;
        var post = feedPost.post, reply = feedPost.reply, reason = feedPost.reason;
        this.items = [];
        this.isIncompleteThread = false;
        this.isFallbackMarker = false;
        this.isOrphan = false;
        this.isThreadMuted = (_b = (_a = post.viewer) === null || _a === void 0 ? void 0 : _a.threadMuted) !== null && _b !== void 0 ? _b : false;
        this.feedPostUri = post.uri;
        if (AppBskyFeedDefs.isPostView(reply === null || reply === void 0 ? void 0 : reply.root)) {
            this.rootUri = reply.root.uri;
        }
        else {
            this.rootUri = post.uri;
        }
        this._feedPost = feedPost;
        this._reactKey = "slice-".concat(post.uri, "-").concat(feedPost.reason && 'indexedAt' in feedPost.reason
            ? feedPost.reason.indexedAt
            : post.indexedAt);
        if (feedPost.post.uri === FALLBACK_MARKER_POST.post.uri) {
            this.isFallbackMarker = true;
            return;
        }
        if (!AppBskyFeedPost.isRecord(post.record) ||
            !bsky.validate(post.record, AppBskyFeedPost.validateRecord)) {
            return;
        }
        var parent = reply === null || reply === void 0 ? void 0 : reply.parent;
        var isParentBlocked = AppBskyFeedDefs.isBlockedPost(parent);
        var isParentNotFound = AppBskyFeedDefs.isNotFoundPost(parent);
        var parentAuthor;
        if (AppBskyFeedDefs.isPostView(parent)) {
            parentAuthor = parent.author;
        }
        this.items.push({
            post: post,
            record: post.record,
            parentAuthor: parentAuthor,
            isParentBlocked: isParentBlocked,
            isParentNotFound: isParentNotFound,
        });
        if (!reply) {
            if (post.record.reply) {
                // This reply wasn't properly hydrated by the AppView.
                this.isOrphan = true;
                this.items[0].isParentNotFound = true;
            }
            return;
        }
        if (reason) {
            return;
        }
        if (!AppBskyFeedDefs.isPostView(parent) ||
            !AppBskyFeedPost.isRecord(parent.record) ||
            !bsky.validate(parent.record, AppBskyFeedPost.validateRecord)) {
            this.isOrphan = true;
            return;
        }
        var root = reply.root;
        var rootIsView = AppBskyFeedDefs.isPostView(root) ||
            AppBskyFeedDefs.isBlockedPost(root) ||
            AppBskyFeedDefs.isNotFoundPost(root);
        /*
         * If the parent is also the root, we just so happen to have the data we
         * need to compute if the parent's parent (grandparent) is blocked. This
         * doesn't always happen, of course, but we can take advantage of it when
         * it does.
         */
        var grandparent = rootIsView && ((_c = parent.record.reply) === null || _c === void 0 ? void 0 : _c.parent.uri) === root.uri
            ? root
            : undefined;
        var grandparentAuthor = reply.grandparentAuthor;
        var isGrandparentBlocked = Boolean(grandparent && AppBskyFeedDefs.isBlockedPost(grandparent));
        var isGrandparentNotFound = Boolean(grandparent && AppBskyFeedDefs.isNotFoundPost(grandparent));
        this.items.unshift({
            post: parent,
            record: parent.record,
            parentAuthor: grandparentAuthor,
            isParentBlocked: isGrandparentBlocked,
            isParentNotFound: isGrandparentNotFound,
        });
        if (isGrandparentBlocked) {
            this.isOrphan = true;
            // Keep going, it might still have a root, and we need this for thread
            // de-deduping
        }
        if (!AppBskyFeedDefs.isPostView(root) ||
            !AppBskyFeedPost.isRecord(root.record) ||
            !bsky.validate(root.record, AppBskyFeedPost.validateRecord)) {
            this.isOrphan = true;
            return;
        }
        if (root.uri === parent.uri) {
            return;
        }
        this.items.unshift({
            post: root,
            record: root.record,
            isParentBlocked: false,
            isParentNotFound: false,
            parentAuthor: undefined,
        });
        if (((_d = parent.record.reply) === null || _d === void 0 ? void 0 : _d.parent.uri) !== root.uri) {
            this.isIncompleteThread = true;
        }
    }
    Object.defineProperty(FeedViewPostsSlice.prototype, "isQuotePost", {
        get: function () {
            var embed = this._feedPost.post.embed;
            return (AppBskyEmbedRecord.isView(embed) ||
                AppBskyEmbedRecordWithMedia.isView(embed));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FeedViewPostsSlice.prototype, "isReply", {
        get: function () {
            return (AppBskyFeedPost.isRecord(this._feedPost.post.record) &&
                !!this._feedPost.post.record.reply);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FeedViewPostsSlice.prototype, "reason", {
        get: function () {
            return '__source' in this._feedPost
                ? this._feedPost.__source
                : this._feedPost.reason;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FeedViewPostsSlice.prototype, "feedContext", {
        get: function () {
            return this._feedPost.feedContext;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FeedViewPostsSlice.prototype, "reqId", {
        get: function () {
            return this._feedPost.reqId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FeedViewPostsSlice.prototype, "isRepost", {
        get: function () {
            var reason = this._feedPost.reason;
            return AppBskyFeedDefs.isReasonRepost(reason);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FeedViewPostsSlice.prototype, "likeCount", {
        get: function () {
            var _a;
            return (_a = this._feedPost.post.likeCount) !== null && _a !== void 0 ? _a : 0;
        },
        enumerable: false,
        configurable: true
    });
    FeedViewPostsSlice.prototype.containsUri = function (uri) {
        return !!this.items.find(function (item) { return item.post.uri === uri; });
    };
    FeedViewPostsSlice.prototype.getAuthors = function () {
        var feedPost = this._feedPost;
        var author = feedPost.post.author;
        var parentAuthor;
        var grandparentAuthor;
        var rootAuthor;
        if (feedPost.reply) {
            if (AppBskyFeedDefs.isPostView(feedPost.reply.parent)) {
                parentAuthor = feedPost.reply.parent.author;
            }
            if (feedPost.reply.grandparentAuthor) {
                grandparentAuthor = feedPost.reply.grandparentAuthor;
            }
            if (AppBskyFeedDefs.isPostView(feedPost.reply.root)) {
                rootAuthor = feedPost.reply.root.author;
            }
        }
        return {
            author: author,
            parentAuthor: parentAuthor,
            grandparentAuthor: grandparentAuthor,
            rootAuthor: rootAuthor,
        };
    };
    return FeedViewPostsSlice;
}());
export { FeedViewPostsSlice };
var FeedTuner = /** @class */ (function () {
    function FeedTuner(tunerFns) {
        this.tunerFns = tunerFns;
        this.seenKeys = new Set();
        this.seenUris = new Set();
        this.seenRootUris = new Set();
    }
    FeedTuner.prototype.tune = function (feed, _a) {
        var _this = this;
        var _b = _a === void 0 ? {
            dryRun: false,
        } : _a, dryRun = _b.dryRun;
        var slices = feed
            .map(function (item) { return new FeedViewPostsSlice(item); })
            .filter(function (s) { return s.items.length > 0 || s.isFallbackMarker; });
        // run the custom tuners
        for (var _i = 0, _c = this.tunerFns; _i < _c.length; _i++) {
            var tunerFn = _c[_i];
            slices = tunerFn(this, slices.slice(), dryRun);
        }
        slices = slices.filter(function (slice) {
            if (_this.seenKeys.has(slice._reactKey)) {
                return false;
            }
            // Some feeds, like Following, dedupe by thread, so you only see the most recent reply.
            // However, we don't want per-thread dedupe for author feeds (where we need to show every post)
            // or for feedgens (where we want to let the feed serve multiple replies if it chooses to).
            // To avoid showing the same context (root and/or parent) more than once, we do last resort
            // per-post deduplication. It hides already seen posts as long as this doesn't break the thread.
            for (var i = 0; i < slice.items.length; i++) {
                var item = slice.items[i];
                if (_this.seenUris.has(item.post.uri)) {
                    if (i === 0) {
                        // Omit contiguous seen leading items.
                        // For example, [A -> B -> C], [A -> D -> E], [A -> D -> F]
                        // would turn into [A -> B -> C], [D -> E], [F].
                        slice.items.splice(0, 1);
                        i--;
                    }
                    if (i === slice.items.length - 1) {
                        // If the last item in the slice was already seen, omit the whole slice.
                        // This means we'd miss its parents, but the user can "show more" to see them.
                        // For example, [A ... E -> F], [A ... D -> E], [A ... C -> D], [A -> B -> C]
                        // would get collapsed into [A ... E -> F], with B/C/D considered seen.
                        return false;
                    }
                }
                else {
                    if (!dryRun) {
                        // Reposting a reply elevates it to top-level, so its parent/root won't be displayed.
                        // Disable in-thread dedupe for this case since we don't want to miss them later.
                        var disableDedupe = slice.isReply && slice.isRepost;
                        if (!disableDedupe) {
                            _this.seenUris.add(item.post.uri);
                        }
                    }
                }
            }
            if (!dryRun) {
                _this.seenKeys.add(slice._reactKey);
            }
            return true;
        });
        return slices;
    };
    FeedTuner.removeReplies = function (tuner, slices, _dryRun) {
        for (var i = 0; i < slices.length; i++) {
            var slice = slices[i];
            if (slice.isReply &&
                !slice.isRepost &&
                // This is not perfect but it's close as we can get to
                // detecting threads without having to peek ahead.
                !areSameAuthor(slice.getAuthors())) {
                slices.splice(i, 1);
                i--;
            }
        }
        return slices;
    };
    FeedTuner.removeReposts = function (tuner, slices, _dryRun) {
        for (var i = 0; i < slices.length; i++) {
            if (slices[i].isRepost) {
                slices.splice(i, 1);
                i--;
            }
        }
        return slices;
    };
    FeedTuner.removeQuotePosts = function (tuner, slices, _dryRun) {
        for (var i = 0; i < slices.length; i++) {
            if (slices[i].isQuotePost) {
                slices.splice(i, 1);
                i--;
            }
        }
        return slices;
    };
    FeedTuner.removeOrphans = function (tuner, slices, _dryRun) {
        for (var i = 0; i < slices.length; i++) {
            if (slices[i].isOrphan) {
                slices.splice(i, 1);
                i--;
            }
        }
        return slices;
    };
    FeedTuner.removeMutedThreads = function (tuner, slices, _dryRun) {
        for (var i = 0; i < slices.length; i++) {
            if (slices[i].isThreadMuted) {
                slices.splice(i, 1);
                i--;
            }
        }
        return slices;
    };
    FeedTuner.dedupThreads = function (tuner, slices, dryRun) {
        for (var i = 0; i < slices.length; i++) {
            var rootUri = slices[i].rootUri;
            if (!slices[i].isRepost && tuner.seenRootUris.has(rootUri)) {
                slices.splice(i, 1);
                i--;
            }
            else {
                if (!dryRun) {
                    tuner.seenRootUris.add(rootUri);
                }
            }
        }
        return slices;
    };
    FeedTuner.followedRepliesOnly = function (_a) {
        var userDid = _a.userDid;
        return function (tuner, slices, _dryRun) {
            for (var i = 0; i < slices.length; i++) {
                var slice = slices[i];
                if (slice.isReply &&
                    !slice.isRepost &&
                    !shouldDisplayReplyInFollowing(slice.getAuthors(), userDid)) {
                    slices.splice(i, 1);
                    i--;
                }
            }
            return slices;
        };
    };
    /**
     * This function filters a list of FeedViewPostsSlice items based on whether they contain text in a
     * preferred language.
     * @param {string[]} preferredLangsCode2 - An array of preferred language codes in ISO 639-1 or ISO 639-2 format.
     * @returns A function that takes in a `FeedTuner` and an array of `FeedViewPostsSlice` objects and
     * returns an array of `FeedViewPostsSlice` objects.
     */
    FeedTuner.preferredLangOnly = function (preferredLangsCode2) {
        return function (tuner, slices, _dryRun) {
            // early return if no languages have been specified
            if (!preferredLangsCode2.length || preferredLangsCode2.length === 0) {
                return slices;
            }
            var candidateSlices = slices.filter(function (slice) {
                for (var _i = 0, _a = slice.items; _i < _a.length; _i++) {
                    var item = _a[_i];
                    if (isPostInLanguage(item.post, preferredLangsCode2)) {
                        return true;
                    }
                }
                // if item does not fit preferred language, remove it
                return false;
            });
            // if the language filter cleared out the entire page, return the original set
            // so that something always shows
            if (candidateSlices.length === 0) {
                return slices;
            }
            return candidateSlices;
        };
    };
    return FeedTuner;
}());
export { FeedTuner };
function areSameAuthor(authors) {
    var author = authors.author, parentAuthor = authors.parentAuthor, grandparentAuthor = authors.grandparentAuthor, rootAuthor = authors.rootAuthor;
    var authorDid = author.did;
    if (parentAuthor && parentAuthor.did !== authorDid) {
        return false;
    }
    if (grandparentAuthor && grandparentAuthor.did !== authorDid) {
        return false;
    }
    if (rootAuthor && rootAuthor.did !== authorDid) {
        return false;
    }
    return true;
}
function shouldDisplayReplyInFollowing(authors, userDid) {
    var author = authors.author, parentAuthor = authors.parentAuthor, grandparentAuthor = authors.grandparentAuthor, rootAuthor = authors.rootAuthor;
    if (!isSelfOrFollowing(author, userDid)) {
        // Only show replies from self or people you follow.
        return false;
    }
    if ((!parentAuthor || parentAuthor.did === author.did) &&
        (!rootAuthor || rootAuthor.did === author.did) &&
        (!grandparentAuthor || grandparentAuthor.did === author.did)) {
        // Always show self-threads.
        return true;
    }
    // From this point on we need at least one more reason to show it.
    if (parentAuthor &&
        parentAuthor.did !== author.did &&
        isSelfOrFollowing(parentAuthor, userDid)) {
        return true;
    }
    if (grandparentAuthor &&
        grandparentAuthor.did !== author.did &&
        isSelfOrFollowing(grandparentAuthor, userDid)) {
        return true;
    }
    if (rootAuthor &&
        rootAuthor.did !== author.did &&
        isSelfOrFollowing(rootAuthor, userDid)) {
        return true;
    }
    return false;
}
function isSelfOrFollowing(profile, userDid) {
    var _a;
    return Boolean(profile.did === userDid || ((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following));
}
