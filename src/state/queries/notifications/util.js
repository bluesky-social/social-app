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
import { AppBskyFeedLike, AppBskyFeedPost, AppBskyFeedRepost, AppBskyGraphStarterpack, hasMutedWord, moderateNotification, } from '@atproto/api';
import chunk from 'lodash.chunk';
import { labelIsHideableOffense } from '#/lib/moderation';
import * as bsky from '#/types/bsky';
import { precacheProfile } from '../profile';
var GROUPABLE_REASONS = [
    'like',
    'repost',
    'follow',
    'like-via-repost',
    'repost-via-repost',
    'subscribed-post',
];
var MS_1HR = 1e3 * 60 * 60;
var MS_2DAY = MS_1HR * 48;
// exported api
// =
export function fetchPage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var res, indexedAt, notifs, notifsGrouped, subjects, _i, notifsGrouped_1, notif, seenAt;
        var _c, _d;
        var agent = _b.agent, cursor = _b.cursor, limit = _b.limit, queryClient = _b.queryClient, moderationOpts = _b.moderationOpts, fetchAdditionalData = _b.fetchAdditionalData, reasons = _b.reasons;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, agent.listNotifications({
                        limit: limit,
                        cursor: cursor,
                        reasons: reasons,
                    })];
                case 1:
                    res = _e.sent();
                    indexedAt = (_c = res.data.notifications[0]) === null || _c === void 0 ? void 0 : _c.indexedAt;
                    notifs = res.data.notifications.filter(function (notif) { return !shouldFilterNotif(notif, moderationOpts); });
                    notifsGrouped = groupNotifications(notifs);
                    if (!fetchAdditionalData) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetchSubjects(agent, notifsGrouped)];
                case 2:
                    subjects = _e.sent();
                    for (_i = 0, notifsGrouped_1 = notifsGrouped; _i < notifsGrouped_1.length; _i++) {
                        notif = notifsGrouped_1[_i];
                        if (notif.subjectUri) {
                            if (notif.type === 'starterpack-joined' &&
                                notif.notification.reasonSubject) {
                                notif.subject = subjects.starterPacks.get(notif.notification.reasonSubject);
                            }
                            else {
                                notif.subject = subjects.posts.get(notif.subjectUri);
                                if (notif.subject) {
                                    precacheProfile(queryClient, notif.subject.author);
                                }
                            }
                        }
                    }
                    _e.label = 3;
                case 3:
                    seenAt = res.data.seenAt ? new Date(res.data.seenAt) : new Date();
                    if (Number.isNaN(seenAt.getTime())) {
                        seenAt = new Date();
                    }
                    return [2 /*return*/, {
                            page: {
                                cursor: res.data.cursor,
                                seenAt: seenAt,
                                items: notifsGrouped,
                                priority: (_d = res.data.priority) !== null && _d !== void 0 ? _d : false,
                            },
                            indexedAt: indexedAt,
                        }];
            }
        });
    });
}
// internal methods
// =
export function shouldFilterNotif(notif, moderationOpts) {
    var _a, _b;
    var containsImperative = !!((_a = notif.author.labels) === null || _a === void 0 ? void 0 : _a.some(labelIsHideableOffense));
    if (containsImperative) {
        return true;
    }
    if (!moderationOpts) {
        return false;
    }
    if (notif.reason === 'subscribed-post' &&
        bsky.dangerousIsType(notif.record, AppBskyFeedPost.isRecord) &&
        hasMutedWord({
            mutedWords: moderationOpts.prefs.mutedWords,
            text: notif.record.text,
            facets: notif.record.facets,
            outlineTags: notif.record.tags,
            languages: notif.record.langs,
            actor: notif.author,
        })) {
        return true;
    }
    if ((_b = notif.author.viewer) === null || _b === void 0 ? void 0 : _b.following) {
        return false;
    }
    return moderateNotification(notif, moderationOpts).ui('contentList').filter;
}
export function groupNotifications(notifs) {
    var _a, _b;
    var groupedNotifs = [];
    for (var _i = 0, notifs_1 = notifs; _i < notifs_1.length; _i++) {
        var notif = notifs_1[_i];
        var ts = +new Date(notif.indexedAt);
        var grouped = false;
        if (GROUPABLE_REASONS.includes(notif.reason)) {
            for (var _c = 0, groupedNotifs_1 = groupedNotifs; _c < groupedNotifs_1.length; _c++) {
                var groupedNotif = groupedNotifs_1[_c];
                var ts2 = +new Date(groupedNotif.notification.indexedAt);
                if (Math.abs(ts2 - ts) < MS_2DAY &&
                    notif.reason === groupedNotif.notification.reason &&
                    notif.reasonSubject === groupedNotif.notification.reasonSubject &&
                    (notif.author.did !== groupedNotif.notification.author.did ||
                        notif.reason === 'subscribed-post')) {
                    var nextIsFollowBack = notif.reason === 'follow' && ((_a = notif.author.viewer) === null || _a === void 0 ? void 0 : _a.following);
                    var prevIsFollowBack = groupedNotif.notification.reason === 'follow' &&
                        ((_b = groupedNotif.notification.author.viewer) === null || _b === void 0 ? void 0 : _b.following);
                    var shouldUngroup = nextIsFollowBack || prevIsFollowBack;
                    if (!shouldUngroup) {
                        groupedNotif.additional = groupedNotif.additional || [];
                        groupedNotif.additional.push(notif);
                        grouped = true;
                        break;
                    }
                }
            }
        }
        if (!grouped) {
            var type = toKnownType(notif);
            if (type !== 'starterpack-joined') {
                groupedNotifs.push({
                    _reactKey: "notif-".concat(notif.uri, "-").concat(notif.reason),
                    type: type,
                    notification: notif,
                    subjectUri: getSubjectUri(type, notif),
                });
            }
            else {
                groupedNotifs.push({
                    _reactKey: "notif-".concat(notif.uri, "-").concat(notif.reason),
                    type: 'starterpack-joined',
                    notification: notif,
                    subjectUri: notif.uri,
                });
            }
        }
    }
    return groupedNotifs;
}
function fetchSubjects(agent, groupedNotifs) {
    return __awaiter(this, void 0, void 0, function () {
        var postUris, packUris, _i, groupedNotifs_2, notif, postUriChunks, packUriChunks, postsChunks, packsChunks, postsMap, packsMap, _a, _b, post, _c, _d, pack;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    postUris = new Set();
                    packUris = new Set();
                    for (_i = 0, groupedNotifs_2 = groupedNotifs; _i < groupedNotifs_2.length; _i++) {
                        notif = groupedNotifs_2[_i];
                        if ((_e = notif.subjectUri) === null || _e === void 0 ? void 0 : _e.includes('app.bsky.feed.post')) {
                            postUris.add(notif.subjectUri);
                        }
                        else if ((_f = notif.notification.reasonSubject) === null || _f === void 0 ? void 0 : _f.includes('app.bsky.graph.starterpack')) {
                            packUris.add(notif.notification.reasonSubject);
                        }
                    }
                    postUriChunks = chunk(Array.from(postUris), 25);
                    packUriChunks = chunk(Array.from(packUris), 25);
                    return [4 /*yield*/, Promise.all(postUriChunks.map(function (uris) {
                            return agent.app.bsky.feed.getPosts({ uris: uris }).then(function (res) { return res.data.posts; });
                        }))];
                case 1:
                    postsChunks = _g.sent();
                    return [4 /*yield*/, Promise.all(packUriChunks.map(function (uris) {
                            return agent.app.bsky.graph
                                .getStarterPacks({ uris: uris })
                                .then(function (res) { return res.data.starterPacks; });
                        }))];
                case 2:
                    packsChunks = _g.sent();
                    postsMap = new Map();
                    packsMap = new Map();
                    for (_a = 0, _b = postsChunks.flat(); _a < _b.length; _a++) {
                        post = _b[_a];
                        if (AppBskyFeedPost.isRecord(post.record)) {
                            postsMap.set(post.uri, post);
                        }
                    }
                    for (_c = 0, _d = packsChunks.flat(); _c < _d.length; _c++) {
                        pack = _d[_c];
                        if (AppBskyGraphStarterpack.isRecord(pack.record)) {
                            packsMap.set(pack.uri, pack);
                        }
                    }
                    return [2 /*return*/, {
                            posts: postsMap,
                            starterPacks: packsMap,
                        }];
            }
        });
    });
}
function toKnownType(notif) {
    var _a;
    if (notif.reason === 'like') {
        if ((_a = notif.reasonSubject) === null || _a === void 0 ? void 0 : _a.includes('feed.generator')) {
            return 'feedgen-like';
        }
        return 'post-like';
    }
    if (notif.reason === 'repost' ||
        notif.reason === 'mention' ||
        notif.reason === 'reply' ||
        notif.reason === 'quote' ||
        notif.reason === 'follow' ||
        notif.reason === 'starterpack-joined' ||
        notif.reason === 'verified' ||
        notif.reason === 'unverified' ||
        notif.reason === 'like-via-repost' ||
        notif.reason === 'repost-via-repost' ||
        notif.reason === 'subscribed-post' ||
        notif.reason === 'contact-match') {
        return notif.reason;
    }
    return 'unknown';
}
function getSubjectUri(type, notif) {
    var _a, _b;
    if (type === 'reply' ||
        type === 'quote' ||
        type === 'mention' ||
        type === 'subscribed-post') {
        return notif.uri;
    }
    else if (type === 'post-like' ||
        type === 'repost' ||
        type === 'like-via-repost' ||
        type === 'repost-via-repost') {
        if (bsky.dangerousIsType(notif.record, AppBskyFeedRepost.isRecord) ||
            bsky.dangerousIsType(notif.record, AppBskyFeedLike.isRecord)) {
            return typeof ((_a = notif.record.subject) === null || _a === void 0 ? void 0 : _a.uri) === 'string'
                ? (_b = notif.record.subject) === null || _b === void 0 ? void 0 : _b.uri
                : undefined;
        }
    }
    else if (type === 'feedgen-like') {
        return notif.reasonSubject;
    }
}
