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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { useEffect, useMemo, useState } from 'react';
import EventEmitter from 'eventemitter3';
import { batchedUpdates } from '#/lib/batchedUpdates';
import { findAllProfilesInQueryData as findAllProfilesInActivitySubscriptionsQueryData } from '#/state/queries/activity-subscriptions';
import { findAllProfilesInQueryData as findAllProfilesInActorSearchQueryData } from '#/state/queries/actor-search';
import { findAllProfilesInQueryData as findAllProfilesInExploreFeedPreviewsQueryData } from '#/state/queries/explore-feed-previews';
import { findAllProfilesInQueryData as findAllProfilesInContactMatchesQueryData } from '#/state/queries/find-contacts';
import { findAllProfilesInQueryData as findAllProfilesInKnownFollowersQueryData } from '#/state/queries/known-followers';
import { findAllProfilesInQueryData as findAllProfilesInListMembersQueryData } from '#/state/queries/list-members';
import { findAllProfilesInQueryData as findAllProfilesInListConvosQueryData } from '#/state/queries/messages/list-conversations';
import { findAllProfilesInQueryData as findAllProfilesInMyBlockedAccountsQueryData } from '#/state/queries/my-blocked-accounts';
import { findAllProfilesInQueryData as findAllProfilesInMyMutedAccountsQueryData } from '#/state/queries/my-muted-accounts';
import { findAllProfilesInQueryData as findAllProfilesInNotifsQueryData } from '#/state/queries/notifications/feed';
import { findAllProfilesInQueryData as findAllProfilesInFeedsQueryData, } from '#/state/queries/post-feed';
import { findAllProfilesInQueryData as findAllProfilesInPostLikedByQueryData } from '#/state/queries/post-liked-by';
import { findAllProfilesInQueryData as findAllProfilesInPostQuotesQueryData } from '#/state/queries/post-quotes';
import { findAllProfilesInQueryData as findAllProfilesInPostRepostedByQueryData } from '#/state/queries/post-reposted-by';
import { findAllProfilesInQueryData as findAllProfilesInProfileQueryData } from '#/state/queries/profile';
import { findAllProfilesInQueryData as findAllProfilesInProfileFollowersQueryData } from '#/state/queries/profile-followers';
import { findAllProfilesInQueryData as findAllProfilesInProfileFollowsQueryData } from '#/state/queries/profile-follows';
import { findAllProfilesInQueryData as findAllProfilesInSuggestedFollowsQueryData } from '#/state/queries/suggested-follows';
import { findAllProfilesInQueryData as findAllProfilesInSuggestedUsersQueryData } from '#/state/queries/trending/useGetSuggestedUsersQuery';
import { findAllProfilesInQueryData as findAllProfilesInPostThreadV2QueryData } from '#/state/queries/usePostThread/queryCache';
import { castAsShadow } from './types';
var shadows = new WeakMap();
var emitter = new EventEmitter();
export function useProfileShadow(profile) {
    var _a = useState(function () { return shadows.get(profile); }), shadow = _a[0], setShadow = _a[1];
    var _b = useState(profile), prevPost = _b[0], setPrevPost = _b[1];
    if (profile !== prevPost) {
        setPrevPost(profile);
        setShadow(shadows.get(profile));
    }
    useEffect(function () {
        function onUpdate() {
            setShadow(shadows.get(profile));
        }
        emitter.addListener(profile.did, onUpdate);
        return function () {
            emitter.removeListener(profile.did, onUpdate);
        };
    }, [profile]);
    return useMemo(function () {
        if (shadow) {
            return mergeShadow(profile, shadow);
        }
        else {
            return castAsShadow(profile);
        }
    }, [profile, shadow]);
}
/**
 * Same as useProfileShadow, but allows for the profile to be undefined.
 * This is useful for when the profile is not guaranteed to be loaded yet.
 */
export function useMaybeProfileShadow(profile) {
    var _a = useState(function () {
        return profile ? shadows.get(profile) : undefined;
    }), shadow = _a[0], setShadow = _a[1];
    var _b = useState(profile), prevPost = _b[0], setPrevPost = _b[1];
    if (profile !== prevPost) {
        setPrevPost(profile);
        setShadow(profile ? shadows.get(profile) : undefined);
    }
    useEffect(function () {
        if (!profile)
            return;
        function onUpdate() {
            if (!profile)
                return;
            setShadow(shadows.get(profile));
        }
        emitter.addListener(profile.did, onUpdate);
        return function () {
            emitter.removeListener(profile.did, onUpdate);
        };
    }, [profile]);
    return useMemo(function () {
        if (!profile)
            return undefined;
        if (shadow) {
            return mergeShadow(profile, shadow);
        }
        else {
            return castAsShadow(profile);
        }
    }, [profile, shadow]);
}
/**
 * Takes a list of posts, and returns a list of DIDs that should be filtered out
 *
 * Note: it doesn't retroactively scan the cache, but only listens to new updates.
 * The use case here is intended for removing a post from a feed after you mute the author
 */
export function usePostAuthorShadowFilter(data) {
    var _a;
    var _b = useState(function () {
        var _a;
        return (_a = data === null || data === void 0 ? void 0 : data.flatMap(function (page) {
            return page.slices.flatMap(function (slice) {
                return slice.items.map(function (item) { return item.post.author.did; });
            });
        })) !== null && _a !== void 0 ? _a : [];
    }), trackedDids = _b[0], setTrackedDids = _b[1];
    var _c = useState(new Map()), authors = _c[0], setAuthors = _c[1];
    var _d = useState(data), prevData = _d[0], setPrevData = _d[1];
    if (data !== prevData) {
        var newAuthors = new Set(trackedDids);
        var hasNew = false;
        for (var _i = 0, _e = (_a = data === null || data === void 0 ? void 0 : data.flatMap(function (page) { return page.slices; })) !== null && _a !== void 0 ? _a : []; _i < _e.length; _i++) {
            var slice = _e[_i];
            for (var _f = 0, _g = slice.items; _f < _g.length; _f++) {
                var item = _g[_f];
                var author = item.post.author;
                if (!newAuthors.has(author.did)) {
                    hasNew = true;
                    newAuthors.add(author.did);
                }
            }
        }
        if (hasNew)
            setTrackedDids(__spreadArray([], newAuthors, true));
        setPrevData(data);
    }
    useEffect(function () {
        var unsubs = [];
        var _loop_1 = function (did) {
            function onUpdate(value) {
                setAuthors(function (prev) {
                    var _a, _b, _c, _d;
                    var prevValue = prev.get(did);
                    var next = new Map(prev);
                    next.set(did, {
                        blocked: Boolean((_b = (_a = value.blockingUri) !== null && _a !== void 0 ? _a : prevValue === null || prevValue === void 0 ? void 0 : prevValue.blocked) !== null && _b !== void 0 ? _b : false),
                        muted: Boolean((_d = (_c = value.muted) !== null && _c !== void 0 ? _c : prevValue === null || prevValue === void 0 ? void 0 : prevValue.muted) !== null && _d !== void 0 ? _d : false),
                    });
                    return next;
                });
            }
            emitter.addListener(did, onUpdate);
            unsubs.push(function () {
                emitter.removeListener(did, onUpdate);
            });
        };
        for (var _i = 0, trackedDids_1 = trackedDids; _i < trackedDids_1.length; _i++) {
            var did = trackedDids_1[_i];
            _loop_1(did);
        }
        return function () {
            unsubs.map(function (fn) { return fn(); });
        };
    }, [trackedDids]);
    return useMemo(function () {
        var dids = [];
        for (var _i = 0, _a = authors.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], did = _b[0], value = _b[1];
            if (value.blocked || value.muted) {
                dids.push(did);
            }
        }
        return dids;
    }, [authors]);
}
export function updateProfileShadow(queryClient, did, value) {
    var cachedProfiles = findProfilesInCache(queryClient, did);
    for (var _i = 0, cachedProfiles_1 = cachedProfiles; _i < cachedProfiles_1.length; _i++) {
        var profile = cachedProfiles_1[_i];
        shadows.set(profile, __assign(__assign({}, shadows.get(profile)), value));
    }
    batchedUpdates(function () {
        emitter.emit(did, value);
    });
}
function mergeShadow(profile, shadow) {
    var _a, _b, _c, _d;
    return castAsShadow(__assign(__assign({}, profile), { viewer: __assign(__assign({}, (profile.viewer || {})), { following: 'followingUri' in shadow
                ? shadow.followingUri
                : (_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following, muted: 'muted' in shadow ? shadow.muted : (_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.muted, blocking: 'blockingUri' in shadow ? shadow.blockingUri : (_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.blocking, activitySubscription: 'activitySubscription' in shadow
                ? shadow.activitySubscription
                : (_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.activitySubscription }), verification: 'verification' in shadow ? shadow.verification : profile.verification, status: 'status' in shadow
            ? shadow.status
            : 'status' in profile
                ? profile.status
                : undefined }));
}
function findProfilesInCache(queryClient, did) {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [5 /*yield**/, __values(findAllProfilesInListMembersQueryData(queryClient, did))];
            case 1:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInMyBlockedAccountsQueryData(queryClient, did))];
            case 2:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInMyMutedAccountsQueryData(queryClient, did))];
            case 3:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInPostLikedByQueryData(queryClient, did))];
            case 4:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInPostRepostedByQueryData(queryClient, did))];
            case 5:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInPostQuotesQueryData(queryClient, did))];
            case 6:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInProfileQueryData(queryClient, did))];
            case 7:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInProfileFollowersQueryData(queryClient, did))];
            case 8:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInProfileFollowsQueryData(queryClient, did))];
            case 9:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInSuggestedUsersQueryData(queryClient, did))];
            case 10:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInSuggestedFollowsQueryData(queryClient, did))];
            case 11:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInActorSearchQueryData(queryClient, did))];
            case 12:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInListConvosQueryData(queryClient, did))];
            case 13:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInFeedsQueryData(queryClient, did))];
            case 14:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInPostThreadV2QueryData(queryClient, did))];
            case 15:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInKnownFollowersQueryData(queryClient, did))];
            case 16:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInExploreFeedPreviewsQueryData(queryClient, did))];
            case 17:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInActivitySubscriptionsQueryData(queryClient, did))];
            case 18:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInNotifsQueryData(queryClient, did))];
            case 19:
                _a.sent();
                return [5 /*yield**/, __values(findAllProfilesInContactMatchesQueryData(queryClient, did))];
            case 20:
                _a.sent();
                return [2 /*return*/];
        }
    });
}
