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
import { AppBskyDraftCreateDraft } from '@atproto/api';
import { useInfiniteQuery, useMutation, useQueryClient, } from '@tanstack/react-query';
import { isNetworkError } from '#/lib/strings/errors';
import { useAgent } from '#/state/session';
import { useAnalytics } from '#/analytics';
import { getDeviceId } from '#/analytics/identifiers';
import { composerStateToDraft, draftViewToSummary } from './api';
import { logger } from './logger';
import * as storage from './storage';
var DRAFTS_QUERY_KEY = ['drafts'];
/**
 * Hook to list all drafts for the current account
 */
export function useDraftsQuery() {
    var _this = this;
    var agent = useAgent();
    var ax = useAnalytics();
    return useInfiniteQuery({
        queryKey: DRAFTS_QUERY_KEY,
        queryFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var res;
            var pageParam = _b.pageParam;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: 
                    // Ensure media cache is populated before checking which media exists
                    return [4 /*yield*/, storage.ensureMediaCachePopulated()];
                    case 1:
                        // Ensure media cache is populated before checking which media exists
                        _c.sent();
                        return [4 /*yield*/, agent.app.bsky.draft.getDrafts({ cursor: pageParam })];
                    case 2:
                        res = _c.sent();
                        return [2 /*return*/, {
                                cursor: res.data.cursor,
                                drafts: res.data.drafts.map(function (view) {
                                    return draftViewToSummary({
                                        view: view,
                                        analytics: ax,
                                    });
                                }),
                            }];
                }
            });
        }); },
        initialPageParam: undefined,
        getNextPageParam: function (page) { return page.cursor || undefined; },
    });
}
/**
 * Load a draft's local media for editing.
 * Takes the full Draft object (from DraftSummary) to avoid re-fetching.
 */
export function loadDraftMedia(draft) {
    return __awaiter(this, void 0, void 0, function () {
        var loadedMedia, _i, _a, post, _b, _c, img, url, e_1, _d, _e, vid, url, e_2;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    loadedMedia = new Map();
                    // can't load media from another device
                    if (draft.deviceId && draft.deviceId !== getDeviceId()) {
                        return [2 /*return*/, { loadedMedia: loadedMedia }];
                    }
                    _i = 0, _a = draft.posts;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 14];
                    post = _a[_i];
                    if (!post.embedImages) return [3 /*break*/, 7];
                    _b = 0, _c = post.embedImages;
                    _f.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 7];
                    img = _c[_b];
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, storage.loadMediaFromLocal(img.localRef.path)];
                case 4:
                    url = _f.sent();
                    loadedMedia.set(img.localRef.path, url);
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _f.sent();
                    logger.error('Failed to load draft image', {
                        path: img.localRef.path,
                        safeMessage: e_1.message,
                    });
                    return [3 /*break*/, 6];
                case 6:
                    _b++;
                    return [3 /*break*/, 2];
                case 7:
                    if (!post.embedVideos) return [3 /*break*/, 13];
                    _d = 0, _e = post.embedVideos;
                    _f.label = 8;
                case 8:
                    if (!(_d < _e.length)) return [3 /*break*/, 13];
                    vid = _e[_d];
                    _f.label = 9;
                case 9:
                    _f.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, storage.loadMediaFromLocal(vid.localRef.path)];
                case 10:
                    url = _f.sent();
                    loadedMedia.set(vid.localRef.path, url);
                    return [3 /*break*/, 12];
                case 11:
                    e_2 = _f.sent();
                    logger.error('Failed to load draft video', {
                        path: vid.localRef.path,
                        safeMessage: e_2.message,
                    });
                    return [3 /*break*/, 12];
                case 12:
                    _d++;
                    return [3 /*break*/, 8];
                case 13:
                    _i++;
                    return [3 /*break*/, 1];
                case 14: return [2 /*return*/, { loadedMedia: loadedMedia }];
            }
        });
    });
}
/**
 * Hook to save a draft.
 *
 * IMPORTANT: Network operations happen first in mutationFn.
 * Local storage operations (save new media, delete orphaned media) happen in onSuccess.
 * This ensures we don't lose data if the network request fails.
 */
export function useSaveDraftMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _c, draft, localRefPaths, draftId, res;
            var _d, _e;
            var composerState = _b.composerState, existingDraftId = _b.existingDraftId;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, composerStateToDraft(composerState)];
                    case 1:
                        _c = _f.sent(), draft = _c.draft, localRefPaths = _c.localRefPaths;
                        logger.debug('saving draft', {
                            existingDraftId: existingDraftId,
                            localRefPathCount: localRefPaths.size,
                            originalLocalRefCount: (_e = (_d = composerState.originalLocalRefs) === null || _d === void 0 ? void 0 : _d.size) !== null && _e !== void 0 ? _e : 0,
                        });
                        if (!existingDraftId) return [3 /*break*/, 3];
                        // Update existing draft
                        logger.debug('updating existing draft on server', {
                            draftId: existingDraftId,
                        });
                        return [4 /*yield*/, agent.app.bsky.draft.updateDraft({
                                draft: {
                                    id: existingDraftId,
                                    draft: draft,
                                },
                            })];
                    case 2:
                        _f.sent();
                        draftId = existingDraftId;
                        return [3 /*break*/, 5];
                    case 3:
                        // Create new draft
                        logger.debug('creating new draft on server');
                        return [4 /*yield*/, agent.app.bsky.draft.createDraft({ draft: draft })];
                    case 4:
                        res = _f.sent();
                        draftId = res.data.id;
                        logger.debug('created new draft', { draftId: draftId });
                        _f.label = 5;
                    case 5: 
                    // Return data needed for onSuccess
                    return [2 /*return*/, {
                            draftId: draftId,
                            localRefPaths: localRefPaths,
                            originalLocalRefs: composerState.originalLocalRefs,
                        }];
                }
            });
        }); },
        onSuccess: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _i, localRefPaths_1, _c, localRefPath, sourcePath, newLocalRefs, _d, originalLocalRefs_1, oldRef;
            var draftId = _b.draftId, localRefPaths = _b.localRefPaths, originalLocalRefs = _b.originalLocalRefs;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // 2. LOCAL STORAGE ONLY AFTER NETWORK SUCCEEDS
                        logger.debug('network save succeeded, processing local storage', {
                            draftId: draftId,
                        });
                        _i = 0, localRefPaths_1 = localRefPaths;
                        _e.label = 1;
                    case 1:
                        if (!(_i < localRefPaths_1.length)) return [3 /*break*/, 5];
                        _c = localRefPaths_1[_i], localRefPath = _c[0], sourcePath = _c[1];
                        if (!!storage.mediaExists(localRefPath)) return [3 /*break*/, 3];
                        logger.debug('saving new media file', { localRefPath: localRefPath });
                        return [4 /*yield*/, storage.saveMediaToLocal(localRefPath, sourcePath)];
                    case 2:
                        _e.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        logger.debug('skipping existing media file', { localRefPath: localRefPath });
                        _e.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        if (!originalLocalRefs) return [3 /*break*/, 9];
                        newLocalRefs = new Set(localRefPaths.keys());
                        _d = 0, originalLocalRefs_1 = originalLocalRefs;
                        _e.label = 6;
                    case 6:
                        if (!(_d < originalLocalRefs_1.length)) return [3 /*break*/, 9];
                        oldRef = originalLocalRefs_1[_d];
                        if (!!newLocalRefs.has(oldRef)) return [3 /*break*/, 8];
                        logger.debug('deleting orphaned media file', {
                            localRefPath: oldRef,
                        });
                        return [4 /*yield*/, storage.deleteMediaFromLocal(oldRef)];
                    case 7:
                        _e.sent();
                        _e.label = 8;
                    case 8:
                        _d++;
                        return [3 /*break*/, 6];
                    case 9: return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY })];
                    case 10:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            // Check for draft limit error
            if (error instanceof AppBskyDraftCreateDraft.DraftLimitReachedError) {
                logger.error('Draft limit reached', { safeMessage: error.message });
                // Error will be handled by caller
            }
            else if (!isNetworkError(error)) {
                logger.error('Could not create draft (reason unknown)', {
                    safeMessage: error.message,
                });
            }
        },
    });
}
/**
 * Hook to delete a draft.
 * Takes the full draft data to avoid re-fetching for media cleanup.
 */
export function useDeleteDraftMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var draftId = _b.draftId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: 
                    // Delete from server first - if this fails, we keep local media for retry
                    return [4 /*yield*/, agent.app.bsky.draft.deleteDraft({ id: draftId })];
                    case 1:
                        // Delete from server first - if this fails, we keep local media for retry
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
            var _i, _c, post, _d, _e, img, _f, _g, vid;
            var draft = _b.draft;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        _i = 0, _c = draft.posts;
                        _h.label = 1;
                    case 1:
                        if (!(_i < _c.length)) return [3 /*break*/, 10];
                        post = _c[_i];
                        if (!post.embedImages) return [3 /*break*/, 5];
                        _d = 0, _e = post.embedImages;
                        _h.label = 2;
                    case 2:
                        if (!(_d < _e.length)) return [3 /*break*/, 5];
                        img = _e[_d];
                        return [4 /*yield*/, storage.deleteMediaFromLocal(img.localRef.path)];
                    case 3:
                        _h.sent();
                        _h.label = 4;
                    case 4:
                        _d++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!post.embedVideos) return [3 /*break*/, 9];
                        _f = 0, _g = post.embedVideos;
                        _h.label = 6;
                    case 6:
                        if (!(_f < _g.length)) return [3 /*break*/, 9];
                        vid = _g[_f];
                        return [4 /*yield*/, storage.deleteMediaFromLocal(vid.localRef.path)];
                    case 7:
                        _h.sent();
                        _h.label = 8;
                    case 8:
                        _f++;
                        return [3 /*break*/, 6];
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10:
                        queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
                        return [2 /*return*/];
                }
            });
        }); },
    });
}
/**
 * Hook to clean up a draft after it has been published.
 * Deletes the draft from server and all associated local media.
 * Takes draftId and originalLocalRefs from composer state.
 */
export function useCleanupPublishedDraftMutation() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    return useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var draftId = _b.draftId, originalLocalRefs = _b.originalLocalRefs;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger.debug('cleaning up published draft', {
                            draftId: draftId,
                            mediaFileCount: originalLocalRefs.size,
                        });
                        // Delete from server first
                        return [4 /*yield*/, agent.app.bsky.draft.deleteDraft({ id: draftId })];
                    case 1:
                        // Delete from server first
                        _c.sent();
                        logger.debug('deleted draft from server', { draftId: draftId });
                        return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (_1, _a) { return __awaiter(_this, [_1, _a], void 0, function (_, _b) {
            var _i, originalLocalRefs_2, localRef;
            var originalLocalRefs = _b.originalLocalRefs;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, originalLocalRefs_2 = originalLocalRefs;
                        _c.label = 1;
                    case 1:
                        if (!(_i < originalLocalRefs_2.length)) return [3 /*break*/, 4];
                        localRef = originalLocalRefs_2[_i];
                        logger.debug('deleting media file after publish', {
                            localRefPath: localRef,
                        });
                        return [4 /*yield*/, storage.deleteMediaFromLocal(localRef)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
                        logger.debug('cleanup after publish complete');
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            // Log but don't throw - the post was already published successfully
            logger.warn('Failed to clean up published draft', {
                safeMessage: error instanceof Error ? error.message : String(error),
            });
        },
    });
}
