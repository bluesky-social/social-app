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
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useThreadPreferences } from '#/state/queries/preferences/useThreadPreferences';
import { LINEAR_VIEW_BELOW, LINEAR_VIEW_BF, TREE_VIEW_BELOW, TREE_VIEW_BELOW_DESKTOP, TREE_VIEW_BF, } from '#/state/queries/usePostThread/const';
import { createCacheMutator, getThreadPlaceholder, } from '#/state/queries/usePostThread/queryCache';
import { buildThread, sortAndAnnotateThreadItems, } from '#/state/queries/usePostThread/traversal';
import { createPostThreadOtherQueryKey, createPostThreadQueryKey, } from '#/state/queries/usePostThread/types';
import { getThreadgateRecord } from '#/state/queries/usePostThread/utils';
import * as views from '#/state/queries/usePostThread/views';
import { useAgent, useSession } from '#/state/session';
import { useMergeThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import { useBreakpoints } from '#/alf';
import { IS_WEB } from '#/env';
export * from '#/state/queries/usePostThread/context';
export { useUpdatePostThreadThreadgateQueryCache } from '#/state/queries/usePostThread/queryCache';
export * from '#/state/queries/usePostThread/types';
export function usePostThread(_a) {
    var _b, _c, _d;
    var anchor = _a.anchor;
    var qc = useQueryClient();
    var agent = useAgent();
    var hasSession = useSession().hasSession;
    var gtPhone = useBreakpoints().gtPhone;
    var moderationOpts = useModerationOpts();
    var mergeThreadgateHiddenReplies = useMergeThreadgateHiddenReplies();
    var _e = useThreadPreferences(), isThreadPreferencesLoaded = _e.isLoaded, sort = _e.sort, baseSetSort = _e.setSort, view = _e.view, baseSetView = _e.setView;
    var below = useMemo(function () {
        return view === 'linear'
            ? LINEAR_VIEW_BELOW
            : IS_WEB && gtPhone
                ? TREE_VIEW_BELOW_DESKTOP
                : TREE_VIEW_BELOW;
    }, [view, gtPhone]);
    var postThreadQueryKey = createPostThreadQueryKey({
        anchor: anchor,
        sort: sort,
        view: view,
    });
    var postThreadOtherQueryKey = createPostThreadOtherQueryKey({
        anchor: anchor,
    });
    var query = useQuery({
        enabled: isThreadPreferencesLoaded && !!anchor && !!moderationOpts,
        queryKey: postThreadQueryKey,
        queryFn: function (ctx) {
            return __awaiter(this, void 0, void 0, function () {
                var data, result, record;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, agent.app.bsky.unspecced.getPostThreadV2({
                                anchor: anchor,
                                branchingFactor: view === 'linear' ? LINEAR_VIEW_BF : TREE_VIEW_BF,
                                below: below,
                                sort: sort,
                            })
                            /*
                             * Initialize `ctx.meta` to track if we know we have additional replies
                             * we could fetch once we hit the end.
                             */
                        ];
                        case 1:
                            data = (_a.sent()).data;
                            /*
                             * Initialize `ctx.meta` to track if we know we have additional replies
                             * we could fetch once we hit the end.
                             */
                            ctx.meta = ctx.meta || {
                                hasOtherReplies: false,
                            };
                            /*
                             * If we know we have additional replies, we'll set this to true.
                             */
                            if (data.hasOtherReplies) {
                                ctx.meta.hasOtherReplies = true;
                            }
                            result = {
                                thread: data.thread || [],
                                threadgate: data.threadgate,
                                hasOtherReplies: !!ctx.meta.hasOtherReplies,
                            };
                            record = getThreadgateRecord(result.threadgate);
                            if (result.threadgate && record) {
                                result.threadgate.record = record;
                            }
                            return [2 /*return*/, result];
                    }
                });
            });
        },
        placeholderData: function () {
            if (!anchor)
                return;
            var placeholder = getThreadPlaceholder(qc, anchor);
            /*
             * Always return something here, even empty data, so that
             * `isPlaceholderData` is always true, which we'll use to insert
             * skeletons.
             */
            var thread = placeholder ? [placeholder] : [];
            return { thread: thread, threadgate: undefined, hasOtherReplies: false };
        },
        select: function (data) {
            var record = getThreadgateRecord(data.threadgate);
            if (data.threadgate && record) {
                data.threadgate.record = record;
            }
            return data;
        },
    });
    var thread = useMemo(function () { var _a; return ((_a = query.data) === null || _a === void 0 ? void 0 : _a.thread) || []; }, [(_b = query.data) === null || _b === void 0 ? void 0 : _b.thread]);
    var threadgate = useMemo(function () { var _a; return (_a = query.data) === null || _a === void 0 ? void 0 : _a.threadgate; }, [(_c = query.data) === null || _c === void 0 ? void 0 : _c.threadgate]);
    var hasOtherThreadItems = useMemo(function () { var _a; return !!((_a = query.data) === null || _a === void 0 ? void 0 : _a.hasOtherReplies); }, [(_d = query.data) === null || _d === void 0 ? void 0 : _d.hasOtherReplies]);
    var _f = useState(false), otherItemsVisible = _f[0], setOtherItemsVisible = _f[1];
    /**
     * Creates a mutator for the post thread cache. This is used to insert
     * replies into the thread cache after posting.
     */
    var mutator = useMemo(function () {
        return createCacheMutator({
            params: { view: view, below: below },
            postThreadQueryKey: postThreadQueryKey,
            postThreadOtherQueryKey: postThreadOtherQueryKey,
            queryClient: qc,
        });
    }, [qc, view, below, postThreadQueryKey, postThreadOtherQueryKey]);
    /**
     * If we have additional items available from the server and the user has
     * chosen to view them, start loading data
     */
    var additionalQueryEnabled = hasOtherThreadItems && otherItemsVisible;
    var additionalItemsQuery = useQuery({
        enabled: additionalQueryEnabled,
        queryKey: postThreadOtherQueryKey,
        queryFn: function () {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, agent.app.bsky.unspecced.getPostThreadOtherV2({
                                anchor: anchor,
                            })];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        },
    });
    var serverOtherThreadItems = useMemo(function () {
        var _a;
        if (!additionalQueryEnabled)
            return [];
        if (additionalItemsQuery.isLoading) {
            return Array.from({ length: 2 }).map(function (_, i) {
                return views.skeleton({
                    key: "other-reply-".concat(i),
                    item: 'reply',
                });
            });
        }
        else if (additionalItemsQuery.isError) {
            /*
             * We could insert an special error component in here, but since these
             * are optional additional replies, it's not critical that they're shown
             * atm.
             */
            return [];
        }
        else if ((_a = additionalItemsQuery.data) === null || _a === void 0 ? void 0 : _a.thread) {
            var threadItems_1 = sortAndAnnotateThreadItems(additionalItemsQuery.data.thread, {
                view: view,
                skipModerationHandling: true,
                threadgateHiddenReplies: mergeThreadgateHiddenReplies(threadgate === null || threadgate === void 0 ? void 0 : threadgate.record),
                moderationOpts: moderationOpts,
            }).threadItems;
            return threadItems_1;
        }
        else {
            return [];
        }
    }, [
        view,
        additionalQueryEnabled,
        additionalItemsQuery,
        mergeThreadgateHiddenReplies,
        moderationOpts,
        threadgate === null || threadgate === void 0 ? void 0 : threadgate.record,
    ]);
    /**
     * Sets the sort order for the thread and resets the additional thread items
     */
    var setSort = useCallback(function (nextSort) {
        setOtherItemsVisible(false);
        baseSetSort(nextSort);
    }, [baseSetSort, setOtherItemsVisible]);
    /**
     * Sets the view variant for the thread and resets the additional thread items
     */
    var setView = useCallback(function (nextView) {
        setOtherItemsVisible(false);
        baseSetView(nextView);
    }, [baseSetView, setOtherItemsVisible]);
    /*
     * This is the main thread response, sorted into separate buckets based on
     * moderation, and annotated with all UI state needed for rendering.
     */
    var _g = useMemo(function () {
        return sortAndAnnotateThreadItems(thread, {
            view: view,
            threadgateHiddenReplies: mergeThreadgateHiddenReplies(threadgate === null || threadgate === void 0 ? void 0 : threadgate.record),
            moderationOpts: moderationOpts,
        });
    }, [
        thread,
        threadgate === null || threadgate === void 0 ? void 0 : threadgate.record,
        mergeThreadgateHiddenReplies,
        moderationOpts,
        view,
    ]), threadItems = _g.threadItems, otherThreadItems = _g.otherThreadItems;
    /*
     * Take all three sets of thread items and combine them into a single thread,
     * along with any other thread items required for rendering e.g. "Show more
     * replies" or the reply composer.
     */
    var items = useMemo(function () {
        return buildThread({
            threadItems: threadItems,
            otherThreadItems: otherThreadItems,
            serverOtherThreadItems: serverOtherThreadItems,
            isLoading: query.isPlaceholderData,
            hasSession: hasSession,
            hasOtherThreadItems: hasOtherThreadItems,
            otherItemsVisible: otherItemsVisible,
            showOtherItems: function () { return setOtherItemsVisible(true); },
        });
    }, [
        threadItems,
        otherThreadItems,
        serverOtherThreadItems,
        query.isPlaceholderData,
        hasSession,
        hasOtherThreadItems,
        otherItemsVisible,
        setOtherItemsVisible,
    ]);
    return useMemo(function () {
        var context = {
            postThreadQueryKey: postThreadQueryKey,
            postThreadOtherQueryKey: postThreadOtherQueryKey,
        };
        return {
            context: context,
            state: {
                /*
                 * Copy in any query state that is useful
                 */
                isFetching: query.isFetching,
                isPlaceholderData: query.isPlaceholderData,
                error: query.error,
                /*
                 * Other state
                 */
                sort: sort,
                view: view,
                otherItemsVisible: otherItemsVisible,
            },
            data: {
                items: items,
                threadgate: threadgate,
            },
            actions: {
                /*
                 * Copy in any query actions that are useful
                 */
                insertReplies: mutator.insertReplies,
                refetch: query.refetch,
                /*
                 * Other actions
                 */
                setSort: setSort,
                setView: setView,
            },
        };
    }, [
        query,
        mutator.insertReplies,
        otherItemsVisible,
        sort,
        view,
        setSort,
        setView,
        threadgate,
        items,
        postThreadQueryKey,
        postThreadOtherQueryKey,
    ]);
}
