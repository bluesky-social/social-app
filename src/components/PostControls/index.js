var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useMemo, useState } from 'react';
import { View } from 'react-native';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { CountWheel } from '#/lib/custom-animations/CountWheel';
import { AnimatedLikeIcon } from '#/lib/custom-animations/LikeIcon';
import { useHaptics } from '#/lib/haptics';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { usePostLikeMutationQueue, usePostRepostMutationQueue, } from '#/state/queries/post';
import { useRequireAuth } from '#/state/session';
import { ProgressGuideAction, useProgressGuideControls, } from '#/state/shell/progress-guide';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints } from '#/alf';
import { Reply as Bubble } from '#/components/icons/Reply';
import { useFormatPostStatCount } from '#/components/PostControls/util';
import * as Skele from '#/components/Skeleton';
import { useAnalytics } from '#/analytics';
import { BookmarkButton } from './BookmarkButton';
import { PostControlButton, PostControlButtonIcon, PostControlButtonText, } from './PostControlButton';
import { PostMenuButton } from './PostMenu';
import { RepostButton } from './RepostButton';
import { ShareMenuButton } from './ShareMenu';
var PostControls = function (_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var big = _a.big, post = _a.post, record = _a.record, richText = _a.richText, feedContext = _a.feedContext, reqId = _a.reqId, style = _a.style, onPressReply = _a.onPressReply, onPostReply = _a.onPostReply, logContext = _a.logContext, threadgateRecord = _a.threadgateRecord, onShowLess = _a.onShowLess, viaRepost = _a.viaRepost, variant = _a.variant;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var openComposer = useOpenComposer().openComposer;
    var feedDescriptor = useFeedFeedbackContext().feedDescriptor;
    var _p = usePostLikeMutationQueue(post, viaRepost, feedDescriptor, logContext), queueLike = _p[0], queueUnlike = _p[1];
    var _q = usePostRepostMutationQueue(post, viaRepost, feedDescriptor, logContext), queueRepost = _q[0], queueUnrepost = _q[1];
    var requireAuth = useRequireAuth();
    var sendInteraction = useFeedFeedbackContext().sendInteraction;
    var captureAction = useProgressGuideControls().captureAction;
    var playHaptic = useHaptics();
    var isBlocked = Boolean(((_b = post.author.viewer) === null || _b === void 0 ? void 0 : _b.blocking) ||
        ((_c = post.author.viewer) === null || _c === void 0 ? void 0 : _c.blockedBy) ||
        ((_d = post.author.viewer) === null || _d === void 0 ? void 0 : _d.blockingByList));
    var replyDisabled = (_e = post.viewer) === null || _e === void 0 ? void 0 : _e.replyDisabled;
    var gtPhone = useBreakpoints().gtPhone;
    var formatPostStatCount = useFormatPostStatCount();
    var _r = useState(false), hasLikeIconBeenToggled = _r[0], setHasLikeIconBeenToggled = _r[1];
    var onPressToggleLike = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isBlocked) {
                        Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cannot interact with a blocked user"], ["Cannot interact with a blocked user"])))), 'exclamation-circle');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    setHasLikeIconBeenToggled(true);
                    if (!!((_a = post.viewer) === null || _a === void 0 ? void 0 : _a.like)) return [3 /*break*/, 3];
                    playHaptic('Light');
                    sendInteraction({
                        item: post.uri,
                        event: 'app.bsky.feed.defs#interactionLike',
                        feedContext: feedContext,
                        reqId: reqId,
                    });
                    captureAction(ProgressGuideAction.Like);
                    return [4 /*yield*/, queueLike()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, queueUnlike()];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_1 = _b.sent();
                    if ((e_1 === null || e_1 === void 0 ? void 0 : e_1.name) !== 'AbortError') {
                        throw e_1;
                    }
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var onRepost = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isBlocked) {
                        Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Cannot interact with a blocked user"], ["Cannot interact with a blocked user"])))), 'exclamation-circle');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    if (!!((_a = post.viewer) === null || _a === void 0 ? void 0 : _a.repost)) return [3 /*break*/, 3];
                    sendInteraction({
                        item: post.uri,
                        event: 'app.bsky.feed.defs#interactionRepost',
                        feedContext: feedContext,
                        reqId: reqId,
                    });
                    return [4 /*yield*/, queueRepost()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, queueUnrepost()];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_2 = _b.sent();
                    if ((e_2 === null || e_2 === void 0 ? void 0 : e_2.name) !== 'AbortError') {
                        throw e_2;
                    }
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var onQuote = function () {
        if (isBlocked) {
            Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Cannot interact with a blocked user"], ["Cannot interact with a blocked user"])))), 'exclamation-circle');
            return;
        }
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#interactionQuote',
            feedContext: feedContext,
            reqId: reqId,
        });
        ax.metric('post:clickQuotePost', {
            uri: post.uri,
            authorDid: post.author.did,
            logContext: logContext,
            feedDescriptor: feedDescriptor,
        });
        openComposer({
            quote: post,
            onPost: onPostReply,
            logContext: 'QuotePost',
        });
    };
    var onShare = function () {
        sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#interactionShare',
            feedContext: feedContext,
            reqId: reqId,
        });
    };
    var secondaryControlSpacingStyles = useSecondaryControlSpacingStyles({
        variant: variant,
        big: big,
        gtPhone: gtPhone,
    });
    return (_jsxs(View, { style: [
            a.flex_row,
            a.justify_between,
            a.align_center,
            !big && a.pt_2xs,
            a.gap_md,
            style,
        ], children: [_jsxs(View, { style: [a.flex_row, a.flex_1, { maxWidth: 320 }], children: [_jsx(View, { style: [
                            a.flex_1,
                            a.align_start,
                            { marginLeft: big ? -2 : -6 },
                            replyDisabled ? { opacity: 0.6 } : undefined,
                        ], children: _jsxs(PostControlButton, { testID: "replyBtn", onPress: !replyDisabled
                                ? function () {
                                    return requireAuth(function () {
                                        ax.metric('post:clickReply', {
                                            uri: post.uri,
                                            authorDid: post.author.did,
                                            logContext: logContext,
                                            feedDescriptor: feedDescriptor,
                                        });
                                        onPressReply();
                                    });
                                }
                                : undefined, label: _(msg({
                                message: "Reply (".concat(plural(post.replyCount || 0, {
                                    one: '# reply',
                                    other: '# replies',
                                }), ")"),
                                comment: 'Accessibility label for the reply button, verb form followed by number of replies and noun form',
                            })), big: big, children: [_jsx(PostControlButtonIcon, { icon: Bubble }), typeof post.replyCount !== 'undefined' && post.replyCount > 0 && (_jsx(PostControlButtonText, { children: formatPostStatCount(post.replyCount) }))] }) }), _jsx(View, { style: [a.flex_1, a.align_start], children: _jsx(RepostButton, { isReposted: !!((_f = post.viewer) === null || _f === void 0 ? void 0 : _f.repost), repostCount: ((_g = post.repostCount) !== null && _g !== void 0 ? _g : 0) + ((_h = post.quoteCount) !== null && _h !== void 0 ? _h : 0), onRepost: onRepost, onQuote: onQuote, big: big, embeddingDisabled: Boolean((_j = post.viewer) === null || _j === void 0 ? void 0 : _j.embeddingDisabled) }) }), _jsx(View, { style: [a.flex_1, a.align_start], children: _jsxs(PostControlButton, { testID: "likeBtn", big: big, onPress: function () { return requireAuth(function () { return onPressToggleLike(); }); }, label: ((_k = post.viewer) === null || _k === void 0 ? void 0 : _k.like)
                                ? _(msg({
                                    message: "Unlike (".concat(plural(post.likeCount || 0, {
                                        one: '# like',
                                        other: '# likes',
                                    }), ")"),
                                    comment: 'Accessibility label for the like button when the post has been liked, verb followed by number of likes and noun',
                                }))
                                : _(msg({
                                    message: "Like (".concat(plural(post.likeCount || 0, {
                                        one: '# like',
                                        other: '# likes',
                                    }), ")"),
                                    comment: 'Accessibility label for the like button when the post has not been liked, verb form followed by number of likes and noun form',
                                })), children: [_jsx(AnimatedLikeIcon, { isLiked: Boolean((_l = post.viewer) === null || _l === void 0 ? void 0 : _l.like), big: big, hasBeenToggled: hasLikeIconBeenToggled }), _jsx(CountWheel, { likeCount: (_m = post.likeCount) !== null && _m !== void 0 ? _m : 0, big: big, isLiked: Boolean((_o = post.viewer) === null || _o === void 0 ? void 0 : _o.like), hasBeenToggled: hasLikeIconBeenToggled })] }) }), _jsx(View, {})] }), _jsxs(View, { style: [a.flex_row, a.justify_end, secondaryControlSpacingStyles], children: [_jsx(BookmarkButton, { post: post, big: big, logContext: logContext, hitSlop: {
                            right: secondaryControlSpacingStyles.gap / 2,
                        } }), _jsx(ShareMenuButton, { testID: "postShareBtn", post: post, big: big, record: record, richText: richText, timestamp: post.indexedAt, threadgateRecord: threadgateRecord, onShare: onShare, hitSlop: {
                            left: secondaryControlSpacingStyles.gap / 2,
                            right: secondaryControlSpacingStyles.gap / 2,
                        }, logContext: logContext }), _jsx(PostMenuButton, { testID: "postDropdownBtn", post: post, postFeedContext: feedContext, postReqId: reqId, big: big, record: record, richText: richText, timestamp: post.indexedAt, threadgateRecord: threadgateRecord, onShowLess: onShowLess, hitSlop: {
                            left: secondaryControlSpacingStyles.gap / 2,
                        }, logContext: logContext })] })] }));
};
PostControls = memo(PostControls);
export { PostControls };
export function PostControlsSkeleton(_a) {
    var big = _a.big, style = _a.style, variant = _a.variant;
    var gtPhone = useBreakpoints().gtPhone;
    var rowHeight = big ? 32 : 28;
    var padding = 4;
    var size = rowHeight - padding * 2;
    var secondaryControlSpacingStyles = useSecondaryControlSpacingStyles({
        variant: variant,
        big: big,
        gtPhone: gtPhone,
    });
    var itemStyles = {
        padding: padding,
    };
    return (_jsxs(Skele.Row, { style: [a.flex_row, a.justify_between, a.align_center, a.gap_md, style], children: [_jsxs(View, { style: [a.flex_row, a.flex_1, { maxWidth: 320 }], children: [_jsx(View, { style: [itemStyles, a.flex_1, a.align_start, { marginLeft: -padding }], children: _jsx(Skele.Pill, { blend: true, size: size }) }), _jsx(View, { style: [itemStyles, a.flex_1, a.align_start], children: _jsx(Skele.Pill, { blend: true, size: size }) }), _jsx(View, { style: [itemStyles, a.flex_1, a.align_start], children: _jsx(Skele.Pill, { blend: true, size: size }) })] }), _jsxs(View, { style: [a.flex_row, a.justify_end, secondaryControlSpacingStyles], children: [_jsx(View, { style: itemStyles, children: _jsx(Skele.Circle, { blend: true, size: size }) }), _jsx(View, { style: itemStyles, children: _jsx(Skele.Circle, { blend: true, size: size }) }), _jsx(View, { style: itemStyles, children: _jsx(Skele.Circle, { blend: true, size: size }) })] })] }));
}
function useSecondaryControlSpacingStyles(_a) {
    var variant = _a.variant, big = _a.big, gtPhone = _a.gtPhone;
    return useMemo(function () {
        var gap = 0; // default, we want `gap` to be defined on the resulting object
        if (variant !== 'compact')
            gap = a.gap_xs.gap;
        if (big || gtPhone)
            gap = a.gap_sm.gap;
        return { gap: gap };
    }, [variant, big, gtPhone]);
}
var templateObject_1, templateObject_2, templateObject_3;
