var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useMemo } from 'react';
import { Platform, } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppBskyFeedPost, AtUri, } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { DISCOVER_DEBUG_DIDS } from '#/lib/constants';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { useTranslate } from '#/lib/hooks/useTranslate';
import { getCurrentRoute } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import { richTextToString } from '#/lib/strings/rich-text-helpers';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { logger } from '#/logger';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useHiddenPosts, useHiddenPostsApi, useLanguagePrefs, } from '#/state/preferences';
import { usePinnedPostMutation } from '#/state/queries/pinned-post';
import { usePostDeleteMutation, useThreadMuteMutationQueue, } from '#/state/queries/post';
import { useToggleQuoteDetachmentMutation } from '#/state/queries/postgate';
import { getMaybeDetachedQuoteEmbed } from '#/state/queries/postgate/util';
import { useProfileBlockMutationQueue, useProfileMuteMutationQueue, } from '#/state/queries/profile';
import { InvalidInteractionSettingsError, MAX_HIDDEN_REPLIES, MaxHiddenRepliesError, useToggleReplyVisibilityMutation, } from '#/state/queries/threadgate';
import { useRequireAuth, useSession } from '#/state/session';
import { useMergedThreadgateHiddenReplies } from '#/state/threadgate-hidden-replies';
import * as Toast from '#/view/com/util/Toast';
import { useDialogControl } from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { PostInteractionSettingsDialog, usePrefetchPostInteractionSettings, } from '#/components/dialogs/PostInteractionSettingsDialog';
import { Atom_Stroke2_Corner0_Rounded as AtomIcon } from '#/components/icons/Atom';
import { BubbleQuestion_Stroke2_Corner0_Rounded as Translate } from '#/components/icons/Bubble';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { EmojiSad_Stroke2_Corner0_Rounded as EmojiSad, EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile, } from '#/components/icons/Emoji';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Filter_Stroke2_Corner0_Rounded as Filter } from '#/components/icons/Filter';
import { Mute_Stroke2_Corner0_Rounded as Mute, Mute_Stroke2_Corner0_Rounded as MuteIcon, } from '#/components/icons/Mute';
import { PersonX_Stroke2_Corner0_Rounded as PersonX } from '#/components/icons/Person';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { SettingsGear2_Stroke2_Corner0_Rounded as Gear } from '#/components/icons/SettingsGear2';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute, SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon, } from '#/components/icons/Speaker';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import { ReportDialog, useReportDialogControl, } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { useAnalytics } from '#/analytics';
import { IS_INTERNAL } from '#/env';
import * as bsky from '#/types/bsky';
var PostMenuItems = function (_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var post = _a.post, postFeedContext = _a.postFeedContext, postReqId = _a.postReqId, record = _a.record, richText = _a.richText, threadgateRecord = _a.threadgateRecord, onShowLess = _a.onShowLess, logContext = _a.logContext;
    var _k = useSession(), hasSession = _k.hasSession, currentAccount = _k.currentAccount;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var langPrefs = useLanguagePrefs();
    var deletePostMutate = usePostDeleteMutation().mutateAsync;
    var _l = usePinnedPostMutation(), pinPostMutate = _l.mutateAsync, isPinPending = _l.isPending;
    var requireSignIn = useRequireAuth();
    var hiddenPosts = useHiddenPosts();
    var hidePost = useHiddenPostsApi().hidePost;
    var feedFeedback = useFeedFeedbackContext();
    var openLink = useOpenLink();
    var translate = useTranslate();
    var navigation = useNavigation();
    var mutedWordsDialogControl = useGlobalDialogsControlContext().mutedWordsDialogControl;
    var blockPromptControl = useDialogControl();
    var reportDialogControl = useReportDialogControl();
    var deletePromptControl = useDialogControl();
    var hidePromptControl = useDialogControl();
    var postInteractionSettingsDialogControl = useDialogControl();
    var quotePostDetachConfirmControl = useDialogControl();
    var hideReplyConfirmControl = useDialogControl();
    var toggleReplyVisibility = useToggleReplyVisibilityMutation().mutateAsync;
    var postUri = post.uri;
    var postCid = post.cid;
    var postAuthor = useProfileShadow(post.author);
    var quoteEmbed = useMemo(function () {
        if (!currentAccount || !post.embed)
            return;
        return getMaybeDetachedQuoteEmbed({
            viewerDid: currentAccount.did,
            post: post,
        });
    }, [post, currentAccount]);
    var rootUri = ((_c = (_b = record.reply) === null || _b === void 0 ? void 0 : _b.root) === null || _c === void 0 ? void 0 : _c.uri) || postUri;
    var isReply = Boolean(record.reply);
    var _m = useThreadMuteMutationQueue(post, rootUri), isThreadMuted = _m[0], muteThread = _m[1], unmuteThread = _m[2];
    var isPostHidden = hiddenPosts && hiddenPosts.includes(postUri);
    var isAuthor = postAuthor.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var isRootPostAuthor = new AtUri(rootUri).host === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
        threadgateRecord: threadgateRecord,
    });
    var isReplyHiddenByThreadgate = threadgateHiddenReplies.has(postUri);
    var isPinned = (_d = post.viewer) === null || _d === void 0 ? void 0 : _d.pinned;
    var _o = useToggleQuoteDetachmentMutation(), toggleQuoteDetachment = _o.mutateAsync, isDetachPending = _o.isPending;
    var queueBlock = useProfileBlockMutationQueue(postAuthor)[0];
    var _p = useProfileMuteMutationQueue(postAuthor), queueMute = _p[0], queueUnmute = _p[1];
    var prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
        postUri: post.uri,
        rootPostUri: rootUri,
    });
    var href = useMemo(function () {
        var urip = new AtUri(postUri);
        return makeProfileLink(postAuthor, 'post', urip.rkey);
    }, [postUri, postAuthor]);
    var onDeletePost = function () {
        deletePostMutate({ uri: postUri }).then(function () {
            Toast.show(_(msg({ message: 'Post deleted', context: 'toast' })));
            var route = getCurrentRoute(navigation.getState());
            if (route.name === 'PostThread') {
                var params = route.params;
                if (currentAccount &&
                    isAuthor &&
                    (params.name === currentAccount.handle ||
                        params.name === currentAccount.did)) {
                    var currentHref = makeProfileLink(postAuthor, 'post', params.rkey);
                    if (currentHref === href && navigation.canGoBack()) {
                        navigation.goBack();
                    }
                }
            }
        }, function (e) {
            logger.error('Failed to delete post', { message: e });
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to delete post, please try again"], ["Failed to delete post, please try again"])))), 'xmark');
        });
    };
    var onToggleThreadMute = function () {
        try {
            if (isThreadMuted) {
                unmuteThread();
                ax.metric('post:unmute', {
                    uri: postUri,
                    authorDid: postAuthor.did,
                    logContext: logContext,
                    feedDescriptor: feedFeedback.feedDescriptor,
                });
                Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You will now receive notifications for this thread"], ["You will now receive notifications for this thread"])))));
            }
            else {
                muteThread();
                ax.metric('post:mute', {
                    uri: postUri,
                    authorDid: postAuthor.did,
                    logContext: logContext,
                    feedDescriptor: feedFeedback.feedDescriptor,
                });
                Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You will no longer receive notifications for this thread"], ["You will no longer receive notifications for this thread"])))));
            }
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.name) !== 'AbortError') {
                logger.error('Failed to toggle thread mute', { message: e });
                Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to toggle thread mute, please try again"], ["Failed to toggle thread mute, please try again"])))), 'xmark');
            }
        }
    };
    var onCopyPostText = function () {
        var str = richTextToString(richText, true);
        Clipboard.setStringAsync(str);
        Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Copied to clipboard"], ["Copied to clipboard"])))), 'clipboard-check');
    };
    var onPressTranslate = function () {
        var _a;
        translate(record.text, langPrefs.primaryLanguage);
        if (bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)) {
            ax.metric('translate', {
                sourceLanguages: (_a = post.record.langs) !== null && _a !== void 0 ? _a : [],
                targetLanguage: langPrefs.primaryLanguage,
                textLength: post.record.text.length,
            });
        }
    };
    var onHidePost = function () {
        hidePost({ uri: postUri });
        ax.metric('thread:click:hideReplyForMe', {});
    };
    var hideInPWI = !!((_e = postAuthor.labels) === null || _e === void 0 ? void 0 : _e.find(function (label) { return label.val === '!no-unauthenticated'; }));
    var onPressShowMore = function () {
        feedFeedback.sendInteraction({
            event: 'app.bsky.feed.defs#requestMore',
            item: postUri,
            feedContext: postFeedContext,
            reqId: postReqId,
        });
        ax.metric('post:showMore', {
            uri: postUri,
            authorDid: postAuthor.did,
            logContext: logContext,
            feedDescriptor: feedFeedback.feedDescriptor,
        });
        Toast.show(_(msg({ message: 'Feedback sent to feed operator', context: 'toast' })));
    };
    var onPressShowLess = function () {
        feedFeedback.sendInteraction({
            event: 'app.bsky.feed.defs#requestLess',
            item: postUri,
            feedContext: postFeedContext,
            reqId: postReqId,
        });
        ax.metric('post:showLess', {
            uri: postUri,
            authorDid: postAuthor.did,
            logContext: logContext,
            feedDescriptor: feedFeedback.feedDescriptor,
        });
        if (onShowLess) {
            onShowLess({
                item: postUri,
                feedContext: postFeedContext,
            });
        }
        else {
            Toast.show(_(msg({ message: 'Feedback sent to feed operator', context: 'toast' })));
        }
    };
    var onToggleQuotePostAttachment = function () { return __awaiter(void 0, void 0, void 0, function () {
        var action, isDetach, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!quoteEmbed)
                        return [2 /*return*/];
                    action = quoteEmbed.isDetached ? 'reattach' : 'detach';
                    isDetach = action === 'detach';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, toggleQuoteDetachment({
                            post: post,
                            quoteUri: quoteEmbed.uri,
                            action: quoteEmbed.isDetached ? 'reattach' : 'detach',
                        })];
                case 2:
                    _a.sent();
                    Toast.show(isDetach
                        ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Quote post was successfully detached"], ["Quote post was successfully detached"]))))
                        : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Quote post was re-attached"], ["Quote post was re-attached"])))));
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    Toast.show(_(msg({ message: 'Updating quote attachment failed', context: 'toast' })));
                    logger.error("Failed to ".concat(action, " quote"), { safeMessage: e_1.message });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var canHidePostForMe = !isAuthor && !isPostHidden;
    var canHideReplyForEveryone = !isAuthor && isRootPostAuthor && !isPostHidden && isReply;
    var canDetachQuote = quoteEmbed && quoteEmbed.isOwnedByViewer;
    var onToggleReplyVisibility = function () { return __awaiter(void 0, void 0, void 0, function () {
        var action, isHide, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // TODO no threadgate?
                    if (!canHideReplyForEveryone)
                        return [2 /*return*/];
                    action = isReplyHiddenByThreadgate ? 'show' : 'hide';
                    isHide = action === 'hide';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, toggleReplyVisibility({
                            postUri: rootUri,
                            replyUri: postUri,
                            action: action,
                        })
                        // Log metric only when hiding (not when showing)
                    ];
                case 2:
                    _a.sent();
                    // Log metric only when hiding (not when showing)
                    if (isHide) {
                        ax.metric('thread:click:hideReplyForEveryone', {});
                    }
                    Toast.show(isHide
                        ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Reply was successfully hidden"], ["Reply was successfully hidden"]))))
                        : _(msg({ message: 'Reply visibility updated', context: 'toast' })));
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    if (e_2 instanceof MaxHiddenRepliesError) {
                        Toast.show(_(msg({
                            message: "You can hide a maximum of ".concat(MAX_HIDDEN_REPLIES, " replies."),
                            context: 'toast',
                        })));
                    }
                    else if (e_2 instanceof InvalidInteractionSettingsError) {
                        Toast.show(_(msg({ message: 'Invalid interaction settings.', context: 'toast' })));
                    }
                    else {
                        Toast.show(_(msg({
                            message: 'Updating reply visibility failed',
                            context: 'toast',
                        })));
                        logger.error("Failed to ".concat(action, " reply"), { safeMessage: e_2.message });
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var onPressPin = function () {
        ax.metric(isPinned ? 'post:unpin' : 'post:pin', {});
        pinPostMutate({
            postUri: postUri,
            postCid: postCid,
            action: isPinned ? 'unpin' : 'pin',
        });
    };
    var onBlockAuthor = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, queueBlock()];
                case 1:
                    _a.sent();
                    Toast.show(_(msg({ message: 'Account blocked', context: 'toast' })));
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    if ((e_3 === null || e_3 === void 0 ? void 0 : e_3.name) !== 'AbortError') {
                        logger.error('Failed to block account', { message: e_3 });
                        Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_3.toString())), 'xmark');
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var onMuteAuthor = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_4, e_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = postAuthor.viewer) === null || _a === void 0 ? void 0 : _a.muted)) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueUnmute()];
                case 2:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Account unmuted', context: 'toast' })));
                    return [3 /*break*/, 4];
                case 3:
                    e_4 = _b.sent();
                    if ((e_4 === null || e_4 === void 0 ? void 0 : e_4.name) !== 'AbortError') {
                        logger.error('Failed to unmute account', { message: e_4 });
                        Toast.show(_(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_4.toString())), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 8];
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, queueMute()];
                case 6:
                    _b.sent();
                    Toast.show(_(msg({ message: 'Account muted', context: 'toast' })));
                    return [3 /*break*/, 8];
                case 7:
                    e_5 = _b.sent();
                    if ((e_5 === null || e_5 === void 0 ? void 0 : e_5.name) !== 'AbortError') {
                        logger.error('Failed to mute account', { message: e_5 });
                        Toast.show(_(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_5.toString())), 'xmark');
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var onReportMisclassification = function () {
        var url = "https://docs.google.com/forms/d/e/1FAIpQLSd0QPqhNFksDQf1YyOos7r1ofCLvmrKAH1lU042TaS3GAZaWQ/viewform?entry.1756031717=".concat(toShareUrl(href));
        openLink(url);
    };
    var onSignIn = function () { return requireSignIn(function () { }); };
    var isDiscoverDebugUser = IS_INTERNAL ||
        DISCOVER_DEBUG_DIDS[(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || ''] ||
        ax.features.enabled(ax.features.DebugFeedContext);
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Outer, { children: [isAuthor && (_jsxs(_Fragment, { children: [_jsx(Menu.Group, { children: _jsxs(Menu.Item, { testID: "pinPostBtn", label: isPinned
                                        ? _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Unpin from profile"], ["Unpin from profile"]))))
                                        : _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Pin to your profile"], ["Pin to your profile"])))), disabled: isPinPending, onPress: onPressPin, children: [_jsx(Menu.ItemText, { children: isPinned
                                                ? _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Unpin from profile"], ["Unpin from profile"]))))
                                                : _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Pin to your profile"], ["Pin to your profile"])))) }), _jsx(Menu.ItemIcon, { icon: isPinPending ? Loader : PinIcon, position: "right" })] }) }), _jsx(Menu.Divider, {})] })), _jsx(Menu.Group, { children: !hideInPWI || hasSession ? (_jsxs(_Fragment, { children: [_jsxs(Menu.Item, { testID: "postDropdownTranslateBtn", label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Translate"], ["Translate"])))), onPress: onPressTranslate, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Translate"], ["Translate"])))) }), _jsx(Menu.ItemIcon, { icon: Translate, position: "right" })] }), _jsxs(Menu.Item, { testID: "postDropdownCopyTextBtn", label: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Copy post text"], ["Copy post text"])))), onPress: onCopyPostText, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Copy post text"], ["Copy post text"])))) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon, position: "right" })] })] })) : (_jsxs(Menu.Item, { testID: "postDropdownSignInBtn", label: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Sign in to view post"], ["Sign in to view post"])))), onPress: onSignIn, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Sign in to view post"], ["Sign in to view post"])))) }), _jsx(Menu.ItemIcon, { icon: Eye, position: "right" })] })) }), hasSession && feedFeedback.enabled && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { testID: "postDropdownShowMoreBtn", label: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Show more like this"], ["Show more like this"])))), onPress: onPressShowMore, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Show more like this"], ["Show more like this"])))) }), _jsx(Menu.ItemIcon, { icon: EmojiSmile, position: "right" })] }), _jsxs(Menu.Item, { testID: "postDropdownShowLessBtn", label: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Show less like this"], ["Show less like this"])))), onPress: onPressShowLess, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Show less like this"], ["Show less like this"])))) }), _jsx(Menu.ItemIcon, { icon: EmojiSad, position: "right" })] })] })] })), isDiscoverDebugUser && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Item, { testID: "postDropdownReportMisclassificationBtn", label: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Assign topic for algo"], ["Assign topic for algo"])))), onPress: onReportMisclassification, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Assign topic for algo"], ["Assign topic for algo"])))) }), _jsx(Menu.ItemIcon, { icon: AtomIcon, position: "right" })] })] })), hasSession && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { testID: "postDropdownMuteThreadBtn", label: isThreadMuted ? _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Unmute thread"], ["Unmute thread"])))) : _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Mute thread"], ["Mute thread"])))), onPress: onToggleThreadMute, children: [_jsx(Menu.ItemText, { children: isThreadMuted ? _(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Unmute thread"], ["Unmute thread"])))) : _(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Mute thread"], ["Mute thread"])))) }), _jsx(Menu.ItemIcon, { icon: isThreadMuted ? Unmute : Mute, position: "right" })] }), _jsxs(Menu.Item, { testID: "postDropdownMuteWordsBtn", label: _(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Mute words & tags"], ["Mute words & tags"])))), onPress: function () { return mutedWordsDialogControl.open(); }, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Mute words & tags"], ["Mute words & tags"])))) }), _jsx(Menu.ItemIcon, { icon: Filter, position: "right" })] })] })] })), hasSession &&
                        (canHideReplyForEveryone || canDetachQuote || canHidePostForMe) && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [canHidePostForMe && (_jsxs(Menu.Item, { testID: "postDropdownHideBtn", label: isReply
                                            ? _(msg(templateObject_34 || (templateObject_34 = __makeTemplateObject(["Hide reply for me"], ["Hide reply for me"]))))
                                            : _(msg(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Hide post for me"], ["Hide post for me"])))), onPress: function () { return hidePromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: isReply
                                                    ? _(msg(templateObject_36 || (templateObject_36 = __makeTemplateObject(["Hide reply for me"], ["Hide reply for me"]))))
                                                    : _(msg(templateObject_37 || (templateObject_37 = __makeTemplateObject(["Hide post for me"], ["Hide post for me"])))) }), _jsx(Menu.ItemIcon, { icon: EyeSlash, position: "right" })] })), canHideReplyForEveryone && (_jsxs(Menu.Item, { testID: "postDropdownHideBtn", label: isReplyHiddenByThreadgate
                                            ? _(msg(templateObject_38 || (templateObject_38 = __makeTemplateObject(["Show reply for everyone"], ["Show reply for everyone"]))))
                                            : _(msg(templateObject_39 || (templateObject_39 = __makeTemplateObject(["Hide reply for everyone"], ["Hide reply for everyone"])))), onPress: isReplyHiddenByThreadgate
                                            ? onToggleReplyVisibility
                                            : function () { return hideReplyConfirmControl.open(); }, children: [_jsx(Menu.ItemText, { children: isReplyHiddenByThreadgate
                                                    ? _(msg(templateObject_40 || (templateObject_40 = __makeTemplateObject(["Show reply for everyone"], ["Show reply for everyone"]))))
                                                    : _(msg(templateObject_41 || (templateObject_41 = __makeTemplateObject(["Hide reply for everyone"], ["Hide reply for everyone"])))) }), _jsx(Menu.ItemIcon, { icon: isReplyHiddenByThreadgate ? Eye : EyeSlash, position: "right" })] })), canDetachQuote && (_jsxs(Menu.Item, { disabled: isDetachPending, testID: "postDropdownHideBtn", label: quoteEmbed.isDetached
                                            ? _(msg(templateObject_42 || (templateObject_42 = __makeTemplateObject(["Re-attach quote"], ["Re-attach quote"]))))
                                            : _(msg(templateObject_43 || (templateObject_43 = __makeTemplateObject(["Detach quote"], ["Detach quote"])))), onPress: quoteEmbed.isDetached
                                            ? onToggleQuotePostAttachment
                                            : function () { return quotePostDetachConfirmControl.open(); }, children: [_jsx(Menu.ItemText, { children: quoteEmbed.isDetached
                                                    ? _(msg(templateObject_44 || (templateObject_44 = __makeTemplateObject(["Re-attach quote"], ["Re-attach quote"]))))
                                                    : _(msg(templateObject_45 || (templateObject_45 = __makeTemplateObject(["Detach quote"], ["Detach quote"])))) }), _jsx(Menu.ItemIcon, { icon: isDetachPending
                                                    ? Loader
                                                    : quoteEmbed.isDetached
                                                        ? Eye
                                                        : EyeSlash, position: "right" })] }))] })] })), hasSession && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [!isAuthor && (_jsxs(_Fragment, { children: [_jsxs(Menu.Item, { testID: "postDropdownMuteBtn", label: ((_f = postAuthor.viewer) === null || _f === void 0 ? void 0 : _f.muted)
                                                    ? _(msg(templateObject_46 || (templateObject_46 = __makeTemplateObject(["Unmute account"], ["Unmute account"]))))
                                                    : _(msg(templateObject_47 || (templateObject_47 = __makeTemplateObject(["Mute account"], ["Mute account"])))), onPress: onMuteAuthor, children: [_jsx(Menu.ItemText, { children: ((_g = postAuthor.viewer) === null || _g === void 0 ? void 0 : _g.muted)
                                                            ? _(msg(templateObject_48 || (templateObject_48 = __makeTemplateObject(["Unmute account"], ["Unmute account"]))))
                                                            : _(msg(templateObject_49 || (templateObject_49 = __makeTemplateObject(["Mute account"], ["Mute account"])))) }), _jsx(Menu.ItemIcon, { icon: ((_h = postAuthor.viewer) === null || _h === void 0 ? void 0 : _h.muted) ? UnmuteIcon : MuteIcon, position: "right" })] }), !((_j = postAuthor.viewer) === null || _j === void 0 ? void 0 : _j.blocking) && (_jsxs(Menu.Item, { testID: "postDropdownBlockBtn", label: _(msg(templateObject_50 || (templateObject_50 = __makeTemplateObject(["Block account"], ["Block account"])))), onPress: function () { return blockPromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_51 || (templateObject_51 = __makeTemplateObject(["Block account"], ["Block account"])))) }), _jsx(Menu.ItemIcon, { icon: PersonX, position: "right" })] })), _jsxs(Menu.Item, { testID: "postDropdownReportBtn", label: _(msg(templateObject_52 || (templateObject_52 = __makeTemplateObject(["Report post"], ["Report post"])))), onPress: function () { return reportDialogControl.open(); }, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_53 || (templateObject_53 = __makeTemplateObject(["Report post"], ["Report post"])))) }), _jsx(Menu.ItemIcon, { icon: Warning, position: "right" })] })] })), isAuthor && (_jsxs(_Fragment, { children: [_jsxs(Menu.Item, __assign({ testID: "postDropdownEditPostInteractions", label: _(msg(templateObject_54 || (templateObject_54 = __makeTemplateObject(["Edit interaction settings"], ["Edit interaction settings"])))), onPress: function () { return postInteractionSettingsDialogControl.open(); } }, (isAuthor
                                                ? Platform.select({
                                                    web: {
                                                        onHoverIn: prefetchPostInteractionSettings,
                                                    },
                                                    native: {
                                                        onPressIn: prefetchPostInteractionSettings,
                                                    },
                                                })
                                                : {}), { children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_55 || (templateObject_55 = __makeTemplateObject(["Edit interaction settings"], ["Edit interaction settings"])))) }), _jsx(Menu.ItemIcon, { icon: Gear, position: "right" })] })), _jsxs(Menu.Item, { testID: "postDropdownDeleteBtn", label: _(msg(templateObject_56 || (templateObject_56 = __makeTemplateObject(["Delete post"], ["Delete post"])))), onPress: function () { return deletePromptControl.open(); }, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_57 || (templateObject_57 = __makeTemplateObject(["Delete post"], ["Delete post"])))) }), _jsx(Menu.ItemIcon, { icon: Trash, position: "right" })] })] }))] })] }))] }), _jsx(Prompt.Basic, { control: deletePromptControl, title: _(msg(templateObject_58 || (templateObject_58 = __makeTemplateObject(["Delete this post?"], ["Delete this post?"])))), description: _(msg(templateObject_59 || (templateObject_59 = __makeTemplateObject(["If you remove this post, you won't be able to recover it."], ["If you remove this post, you won't be able to recover it."])))), onConfirm: onDeletePost, confirmButtonCta: _(msg(templateObject_60 || (templateObject_60 = __makeTemplateObject(["Delete"], ["Delete"])))), confirmButtonColor: "negative" }), _jsx(Prompt.Basic, { control: hidePromptControl, title: isReply ? _(msg(templateObject_61 || (templateObject_61 = __makeTemplateObject(["Hide this reply?"], ["Hide this reply?"])))) : _(msg(templateObject_62 || (templateObject_62 = __makeTemplateObject(["Hide this post?"], ["Hide this post?"])))), description: _(msg(templateObject_63 || (templateObject_63 = __makeTemplateObject(["This post will be hidden from feeds and threads. This cannot be undone."], ["This post will be hidden from feeds and threads. This cannot be undone."])))), onConfirm: onHidePost, confirmButtonCta: _(msg(templateObject_64 || (templateObject_64 = __makeTemplateObject(["Hide"], ["Hide"])))) }), _jsx(ReportDialog, { control: reportDialogControl, subject: __assign(__assign({}, post), { $type: 'app.bsky.feed.defs#postView' }) }), _jsx(PostInteractionSettingsDialog, { control: postInteractionSettingsDialogControl, postUri: post.uri, rootPostUri: rootUri, initialThreadgateView: post.threadgate }), _jsx(Prompt.Basic, { control: quotePostDetachConfirmControl, title: _(msg(templateObject_65 || (templateObject_65 = __makeTemplateObject(["Detach quote post?"], ["Detach quote post?"])))), description: _(msg(templateObject_66 || (templateObject_66 = __makeTemplateObject(["This will remove your post from this quote post for all users, and replace it with a placeholder."], ["This will remove your post from this quote post for all users, and replace it with a placeholder."])))), onConfirm: onToggleQuotePostAttachment, confirmButtonCta: _(msg(templateObject_67 || (templateObject_67 = __makeTemplateObject(["Yes, detach"], ["Yes, detach"])))) }), _jsx(Prompt.Basic, { control: hideReplyConfirmControl, title: _(msg(templateObject_68 || (templateObject_68 = __makeTemplateObject(["Hide this reply?"], ["Hide this reply?"])))), description: _(msg(templateObject_69 || (templateObject_69 = __makeTemplateObject(["This reply will be sorted into a hidden section at the bottom of your thread and will mute notifications for subsequent replies - both for yourself and others."], ["This reply will be sorted into a hidden section at the bottom of your thread and will mute notifications for subsequent replies - both for yourself and others."])))), onConfirm: onToggleReplyVisibility, confirmButtonCta: _(msg(templateObject_70 || (templateObject_70 = __makeTemplateObject(["Yes, hide"], ["Yes, hide"])))) }), _jsx(Prompt.Basic, { control: blockPromptControl, title: _(msg(templateObject_71 || (templateObject_71 = __makeTemplateObject(["Block Account?"], ["Block Account?"])))), description: _(msg(templateObject_72 || (templateObject_72 = __makeTemplateObject(["Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you."], ["Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you."])))), onConfirm: onBlockAuthor, confirmButtonCta: _(msg(templateObject_73 || (templateObject_73 = __makeTemplateObject(["Block"], ["Block"])))), confirmButtonColor: "negative" })] }));
};
PostMenuItems = memo(PostMenuItems);
export { PostMenuItems };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41, templateObject_42, templateObject_43, templateObject_44, templateObject_45, templateObject_46, templateObject_47, templateObject_48, templateObject_49, templateObject_50, templateObject_51, templateObject_52, templateObject_53, templateObject_54, templateObject_55, templateObject_56, templateObject_57, templateObject_58, templateObject_59, templateObject_60, templateObject_61, templateObject_62, templateObject_63, templateObject_64, templateObject_65, templateObject_66, templateObject_67, templateObject_68, templateObject_69, templateObject_70, templateObject_71, templateObject_72, templateObject_73;
