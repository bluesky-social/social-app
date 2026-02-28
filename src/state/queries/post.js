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
import { useCallback } from 'react';
import { AtUri } from '@atproto/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToggleMutationQueue } from '#/lib/hooks/useToggleMutationQueue';
import { updatePostShadow } from '#/state/cache/post-shadow';
import { useAgent, useSession } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';
import { useAnalytics } from '#/analytics';
import { toClout } from '#/analytics/metrics';
import { useIsThreadMuted, useSetThreadMute } from '../cache/thread-mutes';
import { findProfileQueryData } from './profile';
var RQKEY_ROOT = 'post';
export var RQKEY = function (postUri) { return [RQKEY_ROOT, postUri]; };
export function usePostQuery(uri) {
    var _this = this;
    var agent = useAgent();
    return useQuery({
        queryKey: RQKEY(uri || ''),
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var urip, res_1, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!uri)
                            throw new Error('[unreachable] No URI provided');
                        urip = new AtUri(uri);
                        if (!!urip.host.startsWith('did:')) return [3 /*break*/, 2];
                        return [4 /*yield*/, agent.resolveHandle({
                                handle: urip.host,
                            })
                            // @ts-expect-error TODO new-sdk-migration
                        ];
                    case 1:
                        res_1 = _a.sent();
                        // @ts-expect-error TODO new-sdk-migration
                        urip.host = res_1.data.did;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, agent.getPosts({ uris: [urip.toString()] })];
                    case 3:
                        res = _a.sent();
                        if (res.success && res.data.posts[0]) {
                            return [2 /*return*/, res.data.posts[0]];
                        }
                        throw new Error('No data');
                }
            });
        }); },
        enabled: !!uri,
    });
}
export function useGetPost() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useCallback(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var uri = _b.uri;
        return __generator(this, function (_c) {
            return [2 /*return*/, queryClient.fetchQuery({
                    queryKey: RQKEY(uri || ''),
                    queryFn: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var urip, res_2, res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        urip = new AtUri(uri);
                                        if (!!urip.host.startsWith('did:')) return [3 /*break*/, 2];
                                        return [4 /*yield*/, agent.resolveHandle({
                                                handle: urip.host,
                                            })
                                            // @ts-expect-error TODO new-sdk-migration
                                        ];
                                    case 1:
                                        res_2 = _a.sent();
                                        // @ts-expect-error TODO new-sdk-migration
                                        urip.host = res_2.data.did;
                                        _a.label = 2;
                                    case 2: return [4 /*yield*/, agent.getPosts({
                                            uris: [urip.toString()],
                                        })];
                                    case 3:
                                        res = _a.sent();
                                        if (res.success && res.data.posts[0]) {
                                            return [2 /*return*/, res.data.posts[0]];
                                        }
                                        throw new Error('useGetPost: post not found');
                                }
                            });
                        });
                    },
                })];
        });
    }); }, [queryClient, agent]);
}
export function useGetPosts() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useCallback(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var uris = _b.uris;
        return __generator(this, function (_c) {
            return [2 /*return*/, queryClient.fetchQuery({
                    queryKey: RQKEY(uris.join(',') || ''),
                    queryFn: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, agent.getPosts({
                                            uris: uris,
                                        })];
                                    case 1:
                                        res = _a.sent();
                                        if (res.success) {
                                            return [2 /*return*/, res.data.posts];
                                        }
                                        else {
                                            throw new Error('useGetPosts failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                })];
        });
    }); }, [queryClient, agent]);
}
export function usePostLikeMutationQueue(post, viaRepost, feedDescriptor, logContext) {
    var _this = this;
    var _a;
    var queryClient = useQueryClient();
    var postUri = post.uri;
    var postCid = post.cid;
    var initialLikeUri = (_a = post.viewer) === null || _a === void 0 ? void 0 : _a.like;
    var likeMutation = usePostLikeMutation(feedDescriptor, logContext, post);
    var unlikeMutation = usePostUnlikeMutation(feedDescriptor, logContext, post);
    var queueToggle = useToggleMutationQueue({
        initialState: initialLikeUri,
        runMutation: function (prevLikeUri, shouldLike) { return __awaiter(_this, void 0, void 0, function () {
            var likeUri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldLike) return [3 /*break*/, 2];
                        return [4 /*yield*/, likeMutation.mutateAsync({
                                uri: postUri,
                                cid: postCid,
                                via: viaRepost,
                            })];
                    case 1:
                        likeUri = (_a.sent()).uri;
                        userActionHistory.like([postUri]);
                        return [2 /*return*/, likeUri];
                    case 2:
                        if (!prevLikeUri) return [3 /*break*/, 4];
                        return [4 /*yield*/, unlikeMutation.mutateAsync({
                                postUri: postUri,
                                likeUri: prevLikeUri,
                            })];
                    case 3:
                        _a.sent();
                        userActionHistory.unlike([postUri]);
                        _a.label = 4;
                    case 4: return [2 /*return*/, undefined];
                }
            });
        }); },
        onSuccess: function (finalLikeUri) {
            // finalize
            updatePostShadow(queryClient, postUri, {
                likeUri: finalLikeUri,
            });
        },
    });
    var queueLike = useCallback(function () {
        // optimistically update
        updatePostShadow(queryClient, postUri, {
            likeUri: 'pending',
        });
        return queueToggle(true);
    }, [queryClient, postUri, queueToggle]);
    var queueUnlike = useCallback(function () {
        // optimistically update
        updatePostShadow(queryClient, postUri, {
            likeUri: undefined,
        });
        return queueToggle(false);
    }, [queryClient, postUri, queueToggle]);
    return [queueLike, queueUnlike];
}
function usePostLikeMutation(feedDescriptor, logContext, post) {
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    var postAuthor = post.author;
    var agent = useAgent();
    var ax = useAnalytics();
    return useMutation({
        mutationFn: function (_a) {
            var uri = _a.uri, cid = _a.cid, via = _a.via;
            var ownProfile;
            if (currentAccount) {
                ownProfile = findProfileQueryData(queryClient, currentAccount.did);
            }
            ax.metric('post:like', {
                uri: uri,
                authorDid: postAuthor.did,
                logContext: logContext,
                doesPosterFollowLiker: postAuthor.viewer
                    ? Boolean(postAuthor.viewer.followedBy)
                    : undefined,
                doesLikerFollowPoster: postAuthor.viewer
                    ? Boolean(postAuthor.viewer.following)
                    : undefined,
                likerClout: toClout(ownProfile === null || ownProfile === void 0 ? void 0 : ownProfile.followersCount),
                postClout: post.likeCount != null &&
                    post.repostCount != null &&
                    post.replyCount != null
                    ? toClout(post.likeCount + post.repostCount + post.replyCount)
                    : undefined,
                feedDescriptor: feedDescriptor,
            });
            return agent.like(uri, cid, via);
        },
    });
}
function usePostUnlikeMutation(feedDescriptor, logContext, post) {
    var agent = useAgent();
    var ax = useAnalytics();
    return useMutation({
        mutationFn: function (_a) {
            var postUri = _a.postUri, likeUri = _a.likeUri;
            ax.metric('post:unlike', {
                uri: postUri,
                authorDid: post.author.did,
                logContext: logContext,
                feedDescriptor: feedDescriptor,
            });
            return agent.deleteLike(likeUri);
        },
    });
}
export function usePostRepostMutationQueue(post, viaRepost, feedDescriptor, logContext) {
    var _this = this;
    var _a;
    var queryClient = useQueryClient();
    var postUri = post.uri;
    var postCid = post.cid;
    var initialRepostUri = (_a = post.viewer) === null || _a === void 0 ? void 0 : _a.repost;
    var repostMutation = usePostRepostMutation(feedDescriptor, logContext, post);
    var unrepostMutation = usePostUnrepostMutation(feedDescriptor, logContext, post);
    var queueToggle = useToggleMutationQueue({
        initialState: initialRepostUri,
        runMutation: function (prevRepostUri, shouldRepost) { return __awaiter(_this, void 0, void 0, function () {
            var repostUri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldRepost) return [3 /*break*/, 2];
                        return [4 /*yield*/, repostMutation.mutateAsync({
                                uri: postUri,
                                cid: postCid,
                                via: viaRepost,
                            })];
                    case 1:
                        repostUri = (_a.sent()).uri;
                        return [2 /*return*/, repostUri];
                    case 2:
                        if (!prevRepostUri) return [3 /*break*/, 4];
                        return [4 /*yield*/, unrepostMutation.mutateAsync({
                                postUri: postUri,
                                repostUri: prevRepostUri,
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, undefined];
                }
            });
        }); },
        onSuccess: function (finalRepostUri) {
            // finalize
            updatePostShadow(queryClient, postUri, {
                repostUri: finalRepostUri,
            });
        },
    });
    var queueRepost = useCallback(function () {
        // optimistically update
        updatePostShadow(queryClient, postUri, {
            repostUri: 'pending',
        });
        return queueToggle(true);
    }, [queryClient, postUri, queueToggle]);
    var queueUnrepost = useCallback(function () {
        // optimistically update
        updatePostShadow(queryClient, postUri, {
            repostUri: undefined,
        });
        return queueToggle(false);
    }, [queryClient, postUri, queueToggle]);
    return [queueRepost, queueUnrepost];
}
function usePostRepostMutation(feedDescriptor, logContext, post) {
    var agent = useAgent();
    var ax = useAnalytics();
    return useMutation({
        mutationFn: function (_a) {
            var uri = _a.uri, cid = _a.cid, via = _a.via;
            ax.metric('post:repost', {
                uri: uri,
                authorDid: post.author.did,
                logContext: logContext,
                feedDescriptor: feedDescriptor,
            });
            return agent.repost(uri, cid, via);
        },
    });
}
function usePostUnrepostMutation(feedDescriptor, logContext, post) {
    var agent = useAgent();
    var ax = useAnalytics();
    return useMutation({
        mutationFn: function (_a) {
            var postUri = _a.postUri, repostUri = _a.repostUri;
            ax.metric('post:unrepost', {
                uri: postUri,
                authorDid: post.author.did,
                logContext: logContext,
                feedDescriptor: feedDescriptor,
            });
            return agent.deleteRepost(repostUri);
        },
    });
}
export function usePostDeleteMutation() {
    var _this = this;
    var queryClient = useQueryClient();
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var uri = _b.uri;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, agent.deletePost(uri)];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_, variables) {
            updatePostShadow(queryClient, variables.uri, { isDeleted: true });
        },
    });
}
export function useThreadMuteMutationQueue(post, rootUri) {
    var _this = this;
    var _a;
    var threadMuteMutation = useThreadMuteMutation();
    var threadUnmuteMutation = useThreadUnmuteMutation();
    var isThreadMuted = useIsThreadMuted(rootUri, (_a = post.viewer) === null || _a === void 0 ? void 0 : _a.threadMuted);
    var setThreadMute = useSetThreadMute();
    var queueToggle = useToggleMutationQueue({
        initialState: isThreadMuted,
        runMutation: function (_prev, shouldMute) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldMute) return [3 /*break*/, 2];
                        return [4 /*yield*/, threadMuteMutation.mutateAsync({
                                uri: rootUri,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2: return [4 /*yield*/, threadUnmuteMutation.mutateAsync({
                            uri: rootUri,
                        })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, false];
                }
            });
        }); },
        onSuccess: function (finalIsMuted) {
            // finalize
            setThreadMute(rootUri, finalIsMuted);
        },
    });
    var queueMuteThread = useCallback(function () {
        // optimistically update
        setThreadMute(rootUri, true);
        return queueToggle(true);
    }, [setThreadMute, rootUri, queueToggle]);
    var queueUnmuteThread = useCallback(function () {
        // optimistically update
        setThreadMute(rootUri, false);
        return queueToggle(false);
    }, [rootUri, setThreadMute, queueToggle]);
    return [isThreadMuted, queueMuteThread, queueUnmuteThread];
}
function useThreadMuteMutation() {
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) {
            var uri = _a.uri;
            return agent.api.app.bsky.graph.muteThread({ root: uri });
        },
    });
}
function useThreadUnmuteMutation() {
    var agent = useAgent();
    return useMutation({
        mutationFn: function (_a) {
            var uri = _a.uri;
            return agent.api.app.bsky.graph.unmuteThread({ root: uri });
        },
    });
}
