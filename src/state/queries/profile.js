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
import { useCallback } from 'react';
import { AtUri, } from '@atproto/api';
import { keepPreviousData, useMutation, useQuery, useQueryClient, } from '@tanstack/react-query';
import { uploadBlob } from '#/lib/api';
import { until } from '#/lib/async/until';
import { useToggleMutationQueue } from '#/lib/hooks/useToggleMutationQueue';
import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { STALE } from '#/state/queries';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { RQKEY as PROFILE_FOLLOWS_RQKEY } from '#/state/queries/profile-follows';
import { unstableCacheProfileView, useUnstableProfileViewCache, } from '#/state/queries/unstable-profile-cache';
import { useUpdateProfileVerificationCache } from '#/state/queries/verification/useUpdateProfileVerificationCache';
import { useAgent, useSession } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';
import { useAnalytics } from '#/analytics';
import { toClout } from '#/analytics/metrics';
import { ProgressGuideAction, useProgressGuideControls, } from '../shell/progress-guide';
import { RQKEY_ROOT as RQKEY_LIST_CONVOS } from './messages/list-conversations';
import { RQKEY as RQKEY_MY_BLOCKED } from './my-blocked-accounts';
import { RQKEY as RQKEY_MY_MUTED } from './my-muted-accounts';
export * from '#/state/queries/unstable-profile-cache';
/**
 * @deprecated use {@link unstableCacheProfileView} instead
 */
export var precacheProfile = unstableCacheProfileView;
var RQKEY_ROOT = 'profile';
export var RQKEY = function (did) { return [RQKEY_ROOT, did]; };
export var profilesQueryKeyRoot = 'profiles';
export var profilesQueryKey = function (handles) { return [
    profilesQueryKeyRoot,
    handles,
]; };
export function useProfileQuery(_a) {
    var _this = this;
    var did = _a.did, _b = _a.staleTime, staleTime = _b === void 0 ? STALE.SECONDS.FIFTEEN : _b;
    var agent = useAgent();
    var getUnstableProfile = useUnstableProfileViewCache().getUnstableProfile;
    return useQuery({
        // WARNING
        // this staleTime is load-bearing
        // if you remove it, the UI infinite-loops
        // -prf
        staleTime: staleTime,
        refetchOnWindowFocus: true,
        queryKey: RQKEY(did !== null && did !== void 0 ? did : ''),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.getProfile({ actor: did !== null && did !== void 0 ? did : '' })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data];
                }
            });
        }); },
        placeholderData: function () {
            if (!did)
                return;
            return getUnstableProfile(did);
        },
        enabled: !!did,
    });
}
export function useProfilesQuery(_a) {
    var _this = this;
    var handles = _a.handles, maintainData = _a.maintainData;
    var agent = useAgent();
    return useQuery({
        staleTime: STALE.MINUTES.FIVE,
        queryKey: profilesQueryKey(handles),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, agent.getProfiles({ actors: handles })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.data];
                }
            });
        }); },
        placeholderData: maintainData ? keepPreviousData : undefined,
    });
}
export function usePrefetchProfileQuery() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var prefetchProfileQuery = useCallback(function (did) { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, queryClient.prefetchQuery({
                        staleTime: STALE.SECONDS.THIRTY,
                        queryKey: RQKEY(did),
                        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, agent.getProfile({ actor: did || '' })];
                                    case 1:
                                        res = _a.sent();
                                        return [2 /*return*/, res.data];
                                }
                            });
                        }); },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [queryClient, agent]);
    return prefetchProfileQuery;
}
export function useProfileUpdateMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    var updateProfileVerificationCache = useUpdateProfileVerificationCache();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var newUserAvatarPromise, newUserBannerPromise;
            var _this = this;
            var profile = _b.profile, updates = _b.updates, newUserAvatar = _b.newUserAvatar, newUserBanner = _b.newUserBanner, checkCommitted = _b.checkCommitted;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (newUserAvatar) {
                            newUserAvatarPromise = uploadBlob(agent, newUserAvatar.path, newUserAvatar.mime);
                        }
                        if (newUserBanner) {
                            newUserBannerPromise = uploadBlob(agent, newUserBanner.path, newUserBanner.mime);
                        }
                        return [4 /*yield*/, agent.upsertProfile(function (existing) { return __awaiter(_this, void 0, void 0, function () {
                                var next, res, res;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            next = existing || {};
                                            if (typeof updates === 'function') {
                                                next = updates(next);
                                            }
                                            else {
                                                next.displayName = updates.displayName;
                                                next.description = updates.description;
                                                if ('pinnedPost' in updates) {
                                                    next.pinnedPost = updates.pinnedPost;
                                                }
                                            }
                                            if (!newUserAvatarPromise) return [3 /*break*/, 2];
                                            return [4 /*yield*/, newUserAvatarPromise];
                                        case 1:
                                            res = _a.sent();
                                            next.avatar = res.data.blob;
                                            return [3 /*break*/, 3];
                                        case 2:
                                            if (newUserAvatar === null) {
                                                next.avatar = undefined;
                                            }
                                            _a.label = 3;
                                        case 3:
                                            if (!newUserBannerPromise) return [3 /*break*/, 5];
                                            return [4 /*yield*/, newUserBannerPromise];
                                        case 4:
                                            res = _a.sent();
                                            next.banner = res.data.blob;
                                            return [3 /*break*/, 6];
                                        case 5:
                                            if (newUserBanner === null) {
                                                next.banner = undefined;
                                            }
                                            _a.label = 6;
                                        case 6: return [2 /*return*/, next];
                                    }
                                });
                            }); })];
                    case 1:
                        _c.sent();
                        return [4 /*yield*/, whenAppViewReady(agent, profile.did, checkCommitted ||
                                (function (res) {
                                    if (typeof newUserAvatar !== 'undefined') {
                                        if (newUserAvatar === null && res.data.avatar) {
                                            // url hasnt cleared yet
                                            return false;
                                        }
                                        else if (res.data.avatar === profile.avatar) {
                                            // url hasnt changed yet
                                            return false;
                                        }
                                    }
                                    if (typeof newUserBanner !== 'undefined') {
                                        if (newUserBanner === null && res.data.banner) {
                                            // url hasnt cleared yet
                                            return false;
                                        }
                                        else if (res.data.banner === profile.banner) {
                                            // url hasnt changed yet
                                            return false;
                                        }
                                    }
                                    if (typeof updates === 'function') {
                                        return true;
                                    }
                                    return (res.data.displayName === updates.displayName &&
                                        res.data.description === updates.description);
                                }))];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_, variables) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // invalidate cache
                            queryClient.invalidateQueries({
                                queryKey: RQKEY(variables.profile.did),
                            });
                            queryClient.invalidateQueries({
                                queryKey: [profilesQueryKeyRoot, [variables.profile.did]],
                            });
                            return [4 /*yield*/, updateProfileVerificationCache({ profile: variables.profile })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
    });
}
export function useProfileFollowMutationQueue(profile, logContext, position, contextProfileDid) {
    var _this = this;
    var _a;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var currentAccount = useSession().currentAccount;
    var did = profile.did;
    var initialFollowingUri = (_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following;
    var followMutation = useProfileFollowMutation(logContext, profile, position, contextProfileDid);
    var unfollowMutation = useProfileUnfollowMutation(logContext);
    var queueToggle = useToggleMutationQueue({
        initialState: initialFollowingUri,
        runMutation: function (prevFollowingUri, shouldFollow) { return __awaiter(_this, void 0, void 0, function () {
            var uri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldFollow) return [3 /*break*/, 2];
                        return [4 /*yield*/, followMutation.mutateAsync({
                                did: did,
                            })];
                    case 1:
                        uri = (_a.sent()).uri;
                        userActionHistory.follow([did]);
                        return [2 /*return*/, uri];
                    case 2:
                        if (!prevFollowingUri) return [3 /*break*/, 4];
                        return [4 /*yield*/, unfollowMutation.mutateAsync({
                                did: did,
                                followUri: prevFollowingUri,
                            })];
                    case 3:
                        _a.sent();
                        userActionHistory.unfollow([did]);
                        _a.label = 4;
                    case 4: return [2 /*return*/, undefined];
                }
            });
        }); },
        onSuccess: function (finalFollowingUri) {
            // finalize
            updateProfileShadow(queryClient, did, {
                followingUri: finalFollowingUri,
            });
            // Optimistically update profile follows cache for avatar displays
            if (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) {
                queryClient.setQueryData(PROFILE_FOLLOWS_RQKEY(currentAccount.did), function (old) {
                    var _a;
                    if (!((_a = old === null || old === void 0 ? void 0 : old.pages) === null || _a === void 0 ? void 0 : _a[0]))
                        return old;
                    if (finalFollowingUri) {
                        // Add the followed profile to the beginning
                        var alreadyExists = old.pages[0].follows.some(function (f) { return f.did === profile.did; });
                        if (alreadyExists)
                            return old;
                        return __assign(__assign({}, old), { pages: __spreadArray([
                                __assign(__assign({}, old.pages[0]), { follows: __spreadArray([
                                        profile
                                    ], old.pages[0].follows, true) })
                            ], old.pages.slice(1), true) });
                    }
                    else {
                        // Remove the unfollowed profile
                        return __assign(__assign({}, old), { pages: old.pages.map(function (page) { return (__assign(__assign({}, page), { follows: page.follows.filter(function (f) { return f.did !== profile.did; }) })); }) });
                    }
                });
            }
            if (finalFollowingUri) {
                agent.app.bsky.graph
                    .getSuggestedFollowsByActor({
                    actor: did,
                })
                    .then(function (res) {
                    var dids = res.data.suggestions
                        .filter(function (a) { var _a; return !((_a = a.viewer) === null || _a === void 0 ? void 0 : _a.following); })
                        .map(function (a) { return a.did; })
                        .slice(0, 8);
                    userActionHistory.followSuggestion(dids);
                });
            }
        },
    });
    var queueFollow = useCallback(function () {
        // optimistically update
        updateProfileShadow(queryClient, did, {
            followingUri: 'pending',
        });
        return queueToggle(true);
    }, [queryClient, did, queueToggle]);
    var queueUnfollow = useCallback(function () {
        // optimistically update
        updateProfileShadow(queryClient, did, {
            followingUri: undefined,
        });
        return queueToggle(false);
    }, [queryClient, did, queueToggle]);
    return [queueFollow, queueUnfollow];
}
function useProfileFollowMutation(logContext, profile, position, contextProfileDid) {
    var _this = this;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var captureAction = useProgressGuideControls().captureAction;
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var ownProfile;
            var did = _b.did;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (currentAccount) {
                            ownProfile = findProfileQueryData(queryClient, currentAccount.did);
                        }
                        captureAction(ProgressGuideAction.Follow);
                        ax.metric('profile:follow', {
                            logContext: logContext,
                            didBecomeMutual: profile.viewer
                                ? Boolean(profile.viewer.followedBy)
                                : undefined,
                            followeeClout: 'followersCount' in profile
                                ? toClout(profile.followersCount)
                                : undefined,
                            followeeDid: did,
                            followerClout: toClout(ownProfile === null || ownProfile === void 0 ? void 0 : ownProfile.followersCount),
                            position: position,
                            contextProfileDid: contextProfileDid,
                        });
                        return [4 /*yield*/, agent.follow(did)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
    });
}
function useProfileUnfollowMutation(logContext) {
    var _this = this;
    var ax = useAnalytics();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var followUri = _b.followUri;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ax.metric('profile:unfollow', { logContext: logContext });
                        return [4 /*yield*/, agent.deleteFollow(followUri)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
    });
}
export function useProfileMuteMutationQueue(profile) {
    var _this = this;
    var _a;
    var queryClient = useQueryClient();
    var did = profile.did;
    var initialMuted = (_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.muted;
    var muteMutation = useProfileMuteMutation();
    var unmuteMutation = useProfileUnmuteMutation();
    var queueToggle = useToggleMutationQueue({
        initialState: initialMuted,
        runMutation: function (_prevMuted, shouldMute) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldMute) return [3 /*break*/, 2];
                        return [4 /*yield*/, muteMutation.mutateAsync({
                                did: did,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2: return [4 /*yield*/, unmuteMutation.mutateAsync({
                            did: did,
                        })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, false];
                }
            });
        }); },
        onSuccess: function (finalMuted) {
            // finalize
            updateProfileShadow(queryClient, did, { muted: finalMuted });
        },
    });
    var queueMute = useCallback(function () {
        // optimistically update
        updateProfileShadow(queryClient, did, {
            muted: true,
        });
        return queueToggle(true);
    }, [queryClient, did, queueToggle]);
    var queueUnmute = useCallback(function () {
        // optimistically update
        updateProfileShadow(queryClient, did, {
            muted: false,
        });
        return queueToggle(false);
    }, [queryClient, did, queueToggle]);
    return [queueMute, queueUnmute];
}
function useProfileMuteMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var did = _b.did;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.mute(did)];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: RQKEY_MY_MUTED() });
        },
    });
}
function useProfileUnmuteMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var did = _b.did;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.unmute(did)];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: RQKEY_MY_MUTED() });
        },
    });
}
export function useProfileBlockMutationQueue(profile) {
    var _this = this;
    var _a;
    var queryClient = useQueryClient();
    var did = profile.did;
    var initialBlockingUri = (_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.blocking;
    var blockMutation = useProfileBlockMutation();
    var unblockMutation = useProfileUnblockMutation();
    var queueToggle = useToggleMutationQueue({
        initialState: initialBlockingUri,
        runMutation: function (prevBlockUri, shouldFollow) { return __awaiter(_this, void 0, void 0, function () {
            var uri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldFollow) return [3 /*break*/, 2];
                        return [4 /*yield*/, blockMutation.mutateAsync({
                                did: did,
                            })];
                    case 1:
                        uri = (_a.sent()).uri;
                        return [2 /*return*/, uri];
                    case 2:
                        if (!prevBlockUri) return [3 /*break*/, 4];
                        return [4 /*yield*/, unblockMutation.mutateAsync({
                                did: did,
                                blockUri: prevBlockUri,
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, undefined];
                }
            });
        }); },
        onSuccess: function (finalBlockingUri) {
            // finalize
            updateProfileShadow(queryClient, did, {
                blockingUri: finalBlockingUri,
            });
            queryClient.invalidateQueries({ queryKey: [RQKEY_LIST_CONVOS] });
        },
    });
    var queueBlock = useCallback(function () {
        // optimistically update
        updateProfileShadow(queryClient, did, {
            blockingUri: 'pending',
        });
        return queueToggle(true);
    }, [queryClient, did, queueToggle]);
    var queueUnblock = useCallback(function () {
        // optimistically update
        updateProfileShadow(queryClient, did, {
            blockingUri: undefined,
        });
        return queueToggle(false);
    }, [queryClient, did, queueToggle]);
    return [queueBlock, queueUnblock];
}
function useProfileBlockMutation() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var did = _b.did;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!currentAccount) {
                            throw new Error('Not signed in');
                        }
                        return [4 /*yield*/, agent.app.bsky.graph.block.create({ repo: currentAccount.did }, { subject: did, createdAt: new Date().toISOString() })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
        onSuccess: function (_, _a) {
            var did = _a.did;
            queryClient.invalidateQueries({ queryKey: RQKEY_MY_BLOCKED() });
            resetProfilePostsQueries(queryClient, did, 1000);
        },
    });
}
function useProfileUnblockMutation() {
    var _this = this;
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var rkey;
            var blockUri = _b.blockUri;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!currentAccount) {
                            throw new Error('Not signed in');
                        }
                        rkey = new AtUri(blockUri).rkey;
                        return [4 /*yield*/, agent.app.bsky.graph.block.delete({
                                repo: currentAccount.did,
                                rkey: rkey,
                            })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_, _a) {
            var did = _a.did;
            resetProfilePostsQueries(queryClient, did, 1000);
        },
    });
}
function whenAppViewReady(agent, actor, fn) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, until(5, // 5 tries
                    1e3, // 1s delay between tries
                    fn, function () { return agent.app.bsky.actor.getProfile({ actor: actor }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function findAllProfilesInQueryData(queryClient, did) {
    var profileQueryDatas, _i, profileQueryDatas_1, _a, _queryKey, queryData, profilesQueryDatas, _b, profilesQueryDatas_1, _c, _queryKey, queryData, _d, _e, profile;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                profileQueryDatas = queryClient.getQueriesData({
                    queryKey: [RQKEY_ROOT],
                });
                _i = 0, profileQueryDatas_1 = profileQueryDatas;
                _f.label = 1;
            case 1:
                if (!(_i < profileQueryDatas_1.length)) return [3 /*break*/, 4];
                _a = profileQueryDatas_1[_i], _queryKey = _a[0], queryData = _a[1];
                if (!queryData) {
                    return [3 /*break*/, 3];
                }
                if (!(queryData.did === did)) return [3 /*break*/, 3];
                return [4 /*yield*/, queryData];
            case 2:
                _f.sent();
                _f.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                profilesQueryDatas = queryClient.getQueriesData({
                    queryKey: [profilesQueryKeyRoot],
                });
                _b = 0, profilesQueryDatas_1 = profilesQueryDatas;
                _f.label = 5;
            case 5:
                if (!(_b < profilesQueryDatas_1.length)) return [3 /*break*/, 10];
                _c = profilesQueryDatas_1[_b], _queryKey = _c[0], queryData = _c[1];
                if (!queryData) {
                    return [3 /*break*/, 9];
                }
                _d = 0, _e = queryData.profiles;
                _f.label = 6;
            case 6:
                if (!(_d < _e.length)) return [3 /*break*/, 9];
                profile = _e[_d];
                if (!(profile.did === did)) return [3 /*break*/, 8];
                return [4 /*yield*/, profile];
            case 7:
                _f.sent();
                _f.label = 8;
            case 8:
                _d++;
                return [3 /*break*/, 6];
            case 9:
                _b++;
                return [3 /*break*/, 5];
            case 10: return [2 /*return*/];
        }
    });
}
export function findProfileQueryData(queryClient, did) {
    return queryClient.getQueryData(RQKEY(did));
}
