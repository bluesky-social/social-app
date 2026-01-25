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
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState, } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, View, } from 'react-native';
// @ts-expect-error no type definition
import ProgressCircle from 'react-native-progress/Circle';
import Animated, { Easing, FadeIn, FadeOut, interpolateColor, LayoutAnimationConfig, LinearTransition, runOnUI, scrollTo, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming, ZoomIn, ZoomOut, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBskyUnspeccedDefs, AtUri, } from '@atproto/api';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg, plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as apilib from '#/lib/api/index';
import { EmbeddingDisabledError } from '#/lib/api/resolve';
import { useAppState } from '#/lib/appState';
import { retry } from '#/lib/async/retry';
import { until } from '#/lib/async/until';
import { MAX_GRAPHEME_LENGTH, SUPPORTED_MIME_TYPES, } from '#/lib/constants';
import { useIsKeyboardVisible } from '#/lib/hooks/useIsKeyboardVisible';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { mimeToExt } from '#/lib/media/video/util';
import { cleanError } from '#/lib/strings/errors';
import { colors } from '#/lib/styles';
import { logger } from '#/logger';
import { useDialogStateControlContext } from '#/state/dialogs';
import { emitPostCreated } from '#/state/events';
import { createComposerImage, pasteImage, } from '#/state/gallery';
import { useModalControls } from '#/state/modals';
import { useRequireAltTextEnabled } from '#/state/preferences';
import { fromPostLanguages, toPostLanguages, useLanguagePrefs, useLanguagePrefsApi, } from '#/state/preferences/languages';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileQuery } from '#/state/queries/profile';
import { useAgent, useSession } from '#/state/session';
import { useComposerControls } from '#/state/shell/composer';
import { CharProgress } from '#/view/com/composer/char-progress/CharProgress';
import { ComposerReplyTo } from '#/view/com/composer/ComposerReplyTo';
import { ExternalEmbedGif, ExternalEmbedLink, } from '#/view/com/composer/ExternalEmbed';
import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';
import { GifAltTextDialog } from '#/view/com/composer/GifAltText';
import { LabelsBtn } from '#/view/com/composer/labels/LabelsBtn';
import { Gallery } from '#/view/com/composer/photos/Gallery';
import { OpenCameraBtn } from '#/view/com/composer/photos/OpenCameraBtn';
import { SelectGifBtn } from '#/view/com/composer/photos/SelectGifBtn';
import { SuggestedLanguage } from '#/view/com/composer/select-language/SuggestedLanguage';
// TODO: Prevent naming components that coincide with RN primitives
// due to linting false positives
import { TextInput } from '#/view/com/composer/text-input/TextInput';
import { ThreadgateBtn } from '#/view/com/composer/threadgate/ThreadgateBtn';
import { SubtitleDialogBtn } from '#/view/com/composer/videos/SubtitleDialog';
import { VideoPreview } from '#/view/com/composer/videos/VideoPreview';
import { VideoTranscodeProgress } from '#/view/com/composer/videos/VideoTranscodeProgress';
import { Text } from '#/view/com/util/text/Text';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, native, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { LazyQuoteEmbed } from '#/components/Post/Embed/LazyQuoteEmbed';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Text as NewText } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_ANDROID, IS_IOS, IS_NATIVE, IS_WEB } from '#/env';
import { BottomSheetPortalProvider } from '../../../../modules/bottom-sheet';
import { PostLanguageSelect } from './select-language/PostLanguageSelect';
import { SelectMediaButton, } from './SelectMediaButton';
import { composerReducer, createComposerState, MAX_IMAGES, } from './state/composer';
import { NO_VIDEO, processVideo, } from './state/video';
import { getVideoMetadata } from './videos/pickVideo';
import { clearThumbnailCache } from './videos/VideoTranscodeBackdrop';
export var ComposePost = function (_a) {
    var _b;
    var replyTo = _a.replyTo, onPost = _a.onPost, onPostSuccess = _a.onPostSuccess, initQuote = _a.quote, initMention = _a.mention, openEmojiPicker = _a.openEmojiPicker, initText = _a.text, initImageUris = _a.imageUris, initVideoUri = _a.videoUri, openGallery = _a.openGallery, cancelRef = _a.cancelRef;
    var currentAccount = useSession().currentAccount;
    var ax = useAnalytics();
    var agent = useAgent();
    var queryClient = useQueryClient();
    var currentDid = currentAccount.did;
    var closeComposer = useComposerControls().closeComposer;
    var _ = useLingui()._;
    var requireAltTextEnabled = useRequireAltTextEnabled();
    var langPrefs = useLanguagePrefs();
    var setLangPrefs = useLanguagePrefsApi();
    var textInput = useRef(null);
    var discardPromptControl = Prompt.usePromptControl();
    var closeAllDialogs = useDialogStateControlContext().closeAllDialogs;
    var closeAllModals = useModalControls().closeAllModals;
    var preferences = usePreferencesQuery().data;
    var navigation = useNavigation();
    var isKeyboardVisible = useIsKeyboardVisible({ iosUseWillEvents: true })[0];
    var _c = useState(false), isPublishing = _c[0], setIsPublishing = _c[1];
    var _d = useState(''), publishingStage = _d[0], setPublishingStage = _d[1];
    var _f = useState(''), error = _f[0], setError = _f[1];
    /**
     * A temporary local reference to a language suggestion that the user has
     * accepted. This overrides the global post language preference, but is not
     * stored permanently.
     */
    var _g = useState(null), acceptedLanguageSuggestion = _g[0], setAcceptedLanguageSuggestion = _g[1];
    /**
     * The language(s) of the post being replied to.
     */
    var _h = useState((replyTo === null || replyTo === void 0 ? void 0 : replyTo.langs) || []), replyToLanguages = _h[0], setReplyToLanguages = _h[1];
    /**
     * The currently selected languages of the post. Prefer local temporary
     * language suggestion over global lang prefs, if available.
     */
    var currentLanguages = useMemo(function () {
        return acceptedLanguageSuggestion
            ? [acceptedLanguageSuggestion]
            : toPostLanguages(langPrefs.postLanguage);
    }, [acceptedLanguageSuggestion, langPrefs.postLanguage]);
    /**
     * When the user selects a language from the composer language selector,
     * clear any temporary language suggestions they may have selected
     * previously, and any we might try to suggest to them.
     */
    var onSelectLanguage = function () {
        setAcceptedLanguageSuggestion(null);
        setReplyToLanguages([]);
    };
    var _j = useReducer(composerReducer, {
        initImageUris: initImageUris,
        initQuoteUri: initQuote === null || initQuote === void 0 ? void 0 : initQuote.uri,
        initText: initText,
        initMention: initMention,
        initInteractionSettings: preferences === null || preferences === void 0 ? void 0 : preferences.postInteractionSettings,
    }, createComposerState), composerState = _j[0], composerDispatch = _j[1];
    var thread = composerState.thread;
    var activePost = thread.posts[composerState.activePostIndex];
    var nextPost = thread.posts[composerState.activePostIndex + 1];
    var dispatch = useCallback(function (postAction) {
        composerDispatch({
            type: 'update_post',
            postId: activePost.id,
            postAction: postAction,
        });
    }, [activePost.id]);
    var selectVideo = React.useCallback(function (postId, asset) {
        var abortController = new AbortController();
        composerDispatch({
            type: 'update_post',
            postId: postId,
            postAction: {
                type: 'embed_add_video',
                asset: asset,
                abortController: abortController,
            },
        });
        processVideo(asset, function (videoAction) {
            composerDispatch({
                type: 'update_post',
                postId: postId,
                postAction: {
                    type: 'embed_update_video',
                    videoAction: videoAction,
                },
            });
        }, agent, currentDid, abortController.signal, _);
    }, [_, agent, currentDid, composerDispatch]);
    var onInitVideo = useNonReactiveCallback(function () {
        if (initVideoUri) {
            selectVideo(activePost.id, initVideoUri);
        }
    });
    useEffect(function () {
        onInitVideo();
    }, [onInitVideo]);
    var clearVideo = React.useCallback(function (postId) {
        composerDispatch({
            type: 'update_post',
            postId: postId,
            postAction: {
                type: 'embed_remove_video',
            },
        });
    }, [composerDispatch]);
    var _k = useState(false), publishOnUpload = _k[0], setPublishOnUpload = _k[1];
    var onClose = useCallback(function () {
        closeComposer();
        clearThumbnailCache(queryClient);
    }, [closeComposer, queryClient]);
    var insets = useSafeAreaInsets();
    var viewStyles = useMemo(function () { return ({
        paddingTop: IS_ANDROID ? insets.top : 0,
        paddingBottom: 
        // iOS - when keyboard is closed, keep the bottom bar in the safe area
        (IS_IOS && !isKeyboardVisible) ||
            // Android - Android >=35 KeyboardAvoidingView adds double padding when
            // keyboard is closed, so we subtract that in the offset and add it back
            // here when the keyboard is open
            (IS_ANDROID && isKeyboardVisible)
            ? insets.bottom
            : 0,
    }); }, [insets, isKeyboardVisible]);
    var onPressCancel = useCallback(function () {
        var _a;
        if ((_a = textInput.current) === null || _a === void 0 ? void 0 : _a.maybeClosePopup()) {
            return;
        }
        else if (thread.posts.some(function (post) {
            return post.shortenedGraphemeLength > 0 ||
                post.embed.media ||
                post.embed.link;
        })) {
            closeAllDialogs();
            Keyboard.dismiss();
            discardPromptControl.open();
        }
        else {
            onClose();
        }
    }, [thread, closeAllDialogs, discardPromptControl, onClose]);
    useImperativeHandle(cancelRef, function () { return ({ onPressCancel: onPressCancel }); });
    // On Android, pressing Back should ask confirmation.
    useEffect(function () {
        if (!IS_ANDROID) {
            return;
        }
        var backHandler = BackHandler.addEventListener('hardwareBackPress', function () {
            if (closeAllDialogs() || closeAllModals()) {
                return true;
            }
            onPressCancel();
            return true;
        });
        return function () {
            backHandler.remove();
        };
    }, [onPressCancel, closeAllDialogs, closeAllModals]);
    var missingAltError = useMemo(function () {
        if (!requireAltTextEnabled) {
            return;
        }
        for (var i = 0; i < thread.posts.length; i++) {
            var media = thread.posts[i].embed.media;
            if (media) {
                if (media.type === 'images' && media.images.some(function (img) { return !img.alt; })) {
                    return _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["One or more images is missing alt text."], ["One or more images is missing alt text."]))));
                }
                if (media.type === 'gif' && !media.alt) {
                    return _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["One or more GIFs is missing alt text."], ["One or more GIFs is missing alt text."]))));
                }
                if (media.type === 'video' &&
                    media.video.status !== 'error' &&
                    !media.video.altText) {
                    return _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["One or more videos is missing alt text."], ["One or more videos is missing alt text."]))));
                }
            }
        }
    }, [thread, requireAltTextEnabled, _]);
    var canPost = !missingAltError &&
        thread.posts.every(function (post) {
            var _a;
            return post.shortenedGraphemeLength <= MAX_GRAPHEME_LENGTH &&
                !isEmptyPost(post) &&
                !(((_a = post.embed.media) === null || _a === void 0 ? void 0 : _a.type) === 'video' &&
                    post.embed.media.video.status === 'error');
        });
    var onPressPublish = React.useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var postUri, postSuccessData, posts, waitErr_1, e_1, err, index, _i, _a, post;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (isPublishing) {
                        return [2 /*return*/];
                    }
                    if (!canPost) {
                        return [2 /*return*/];
                    }
                    if (thread.posts.some(function (post) {
                        var _a;
                        return ((_a = post.embed.media) === null || _a === void 0 ? void 0 : _a.type) === 'video' &&
                            post.embed.media.video.asset &&
                            post.embed.media.video.status !== 'done';
                    })) {
                        setPublishOnUpload(true);
                        return [2 /*return*/];
                    }
                    setError('');
                    setIsPublishing(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 8, 9, 10]);
                    logger.info("composer: posting...");
                    return [4 /*yield*/, apilib.post(agent, queryClient, {
                            thread: thread,
                            replyTo: replyTo === null || replyTo === void 0 ? void 0 : replyTo.uri,
                            onStateChange: setPublishingStage,
                            langs: currentLanguages,
                        })];
                case 2:
                    postUri = (_c.sent()).uris[0];
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 6, , 7]);
                    if (!postUri) return [3 /*break*/, 5];
                    logger.info("composer: waiting for app view");
                    return [4 /*yield*/, retry(5, function (_e) { return true; }, function () { return __awaiter(void 0, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, agent.app.bsky.unspecced.getPostThreadV2({
                                            anchor: postUri,
                                            above: false,
                                            below: thread.posts.length - 1,
                                            branchingFactor: 1,
                                        })];
                                    case 1:
                                        res = _a.sent();
                                        if (res.data.thread.length !== thread.posts.length) {
                                            throw new Error("composer: app view is not ready");
                                        }
                                        if (!res.data.thread.every(function (p) {
                                            return AppBskyUnspeccedDefs.isThreadItemPost(p.value);
                                        })) {
                                            throw new Error("composer: app view returned non-post items");
                                        }
                                        return [2 /*return*/, res.data.thread];
                                }
                            });
                        }); }, 1e3)];
                case 4:
                    posts = _c.sent();
                    postSuccessData = {
                        replyToUri: replyTo === null || replyTo === void 0 ? void 0 : replyTo.uri,
                        posts: posts,
                    };
                    _c.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    waitErr_1 = _c.sent();
                    logger.info("composer: waiting for app view failed", {
                        safeMessage: waitErr_1,
                    });
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 10];
                case 8:
                    e_1 = _c.sent();
                    logger.error(e_1, {
                        message: "Composer: create post failed",
                        hasImages: thread.posts.some(function (p) { var _a; return ((_a = p.embed.media) === null || _a === void 0 ? void 0 : _a.type) === 'images'; }),
                    });
                    err = cleanError(e_1.message);
                    if (err.includes('not locate record')) {
                        err = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["We're sorry! The post you are replying to has been deleted."], ["We're sorry! The post you are replying to has been deleted."]))));
                    }
                    else if (e_1 instanceof EmbeddingDisabledError) {
                        err = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["This post's author has disabled quote posts."], ["This post's author has disabled quote posts."]))));
                    }
                    setError(err);
                    setIsPublishing(false);
                    return [2 /*return*/];
                case 9:
                    if (postUri) {
                        index = 0;
                        for (_i = 0, _a = thread.posts; _i < _a.length; _i++) {
                            post = _a[_i];
                            ax.metric('post:create', {
                                imageCount: ((_b = post.embed.media) === null || _b === void 0 ? void 0 : _b.type) === 'images'
                                    ? post.embed.media.images.length
                                    : 0,
                                isReply: index > 0 || !!replyTo,
                                isPartOfThread: thread.posts.length > 1,
                                hasLink: !!post.embed.link,
                                hasQuote: !!post.embed.quote,
                                langs: fromPostLanguages(currentLanguages),
                                logContext: 'Composer',
                            });
                            index++;
                        }
                    }
                    if (thread.posts.length > 1) {
                        ax.metric('thread:create', {
                            postCount: thread.posts.length,
                            isReply: !!replyTo,
                        });
                    }
                    return [7 /*endfinally*/];
                case 10:
                    if (postUri && !replyTo) {
                        emitPostCreated();
                    }
                    setLangPrefs.savePostLanguageToHistory();
                    if (initQuote) {
                        // We want to wait for the quote count to update before we call `onPost`, which will refetch data
                        whenAppViewReady(agent, initQuote.uri, function (res) {
                            var anchor = res.data.thread.at(0);
                            if (AppBskyUnspeccedDefs.isThreadItemPost(anchor === null || anchor === void 0 ? void 0 : anchor.value) &&
                                anchor.value.post.quoteCount !== initQuote.quoteCount) {
                                onPost === null || onPost === void 0 ? void 0 : onPost(postUri);
                                onPostSuccess === null || onPostSuccess === void 0 ? void 0 : onPostSuccess(postSuccessData);
                                return true;
                            }
                            return false;
                        });
                    }
                    else {
                        onPost === null || onPost === void 0 ? void 0 : onPost(postUri);
                        onPostSuccess === null || onPostSuccess === void 0 ? void 0 : onPostSuccess(postSuccessData);
                    }
                    onClose();
                    setTimeout(function () {
                        Toast.show(_jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, {}), _jsx(Toast.Text, { children: thread.posts.length > 1
                                        ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Your posts were sent"], ["Your posts were sent"]))))
                                        : replyTo
                                            ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Your reply was sent"], ["Your reply was sent"]))))
                                            : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Your post was sent"], ["Your post was sent"])))) }), postUri && (_jsx(Toast.Action, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["View post"], ["View post"])))), onPress: function () {
                                        var _a = new AtUri(postUri), name = _a.host, rkey = _a.rkey;
                                        navigation.navigate('PostThread', { name: name, rkey: rkey });
                                    }, children: _jsx(Trans, { context: "Action to view the post the user just created", children: "View" }) }))] }), { type: 'success' });
                    }, 500);
                    return [2 /*return*/];
            }
        });
    }); }, [
        _,
        ax,
        agent,
        thread,
        canPost,
        isPublishing,
        currentLanguages,
        onClose,
        onPost,
        onPostSuccess,
        initQuote,
        replyTo,
        setLangPrefs,
        queryClient,
        navigation,
    ]);
    // Preserves the referential identity passed to each post item.
    // Avoids re-rendering all posts on each keystroke.
    var onComposerPostPublish = useNonReactiveCallback(function () {
        onPressPublish();
    });
    React.useEffect(function () {
        var _a;
        if (publishOnUpload) {
            var erroredVideos = 0;
            var uploadingVideos = 0;
            for (var _i = 0, _b = thread.posts; _i < _b.length; _i++) {
                var post = _b[_i];
                if (((_a = post.embed.media) === null || _a === void 0 ? void 0 : _a.type) === 'video') {
                    var video = post.embed.media.video;
                    if (video.status === 'error') {
                        erroredVideos++;
                    }
                    else if (video.status !== 'done') {
                        uploadingVideos++;
                    }
                }
            }
            if (erroredVideos > 0) {
                setPublishOnUpload(false);
            }
            else if (uploadingVideos === 0) {
                setPublishOnUpload(false);
                onPressPublish();
            }
        }
    }, [thread.posts, onPressPublish, publishOnUpload]);
    // TODO: It might make more sense to display this error per-post.
    // Right now we're just displaying the first one.
    var erroredVideoPostId;
    var erroredVideo = NO_VIDEO;
    for (var i = 0; i < thread.posts.length; i++) {
        var post = thread.posts[i];
        if (((_b = post.embed.media) === null || _b === void 0 ? void 0 : _b.type) === 'video' &&
            post.embed.media.video.status === 'error') {
            erroredVideoPostId = post.id;
            erroredVideo = post.embed.media.video;
            break;
        }
    }
    var onEmojiButtonPress = useCallback(function () {
        var _a;
        var rect = (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.getCursorPosition();
        if (rect) {
            openEmojiPicker === null || openEmojiPicker === void 0 ? void 0 : openEmojiPicker(__assign(__assign({}, rect), { nextFocusRef: textInput }));
        }
    }, [openEmojiPicker]);
    var scrollViewRef = useAnimatedRef();
    useEffect(function () {
        var _a;
        if (composerState.mutableNeedsFocusActive) {
            composerState.mutableNeedsFocusActive = false;
            // On Android, this risks getting the cursor stuck behind the keyboard.
            // Not worth it.
            if (!IS_ANDROID) {
                (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }
    }, [composerState]);
    var isLastThreadedPost = thread.posts.length > 1 && nextPost === undefined;
    var _l = useScrollTracker({
        scrollViewRef: scrollViewRef,
        stickyBottom: isLastThreadedPost,
    }), scrollHandler = _l.scrollHandler, onScrollViewContentSizeChange = _l.onScrollViewContentSizeChange, onScrollViewLayout = _l.onScrollViewLayout, topBarAnimatedStyle = _l.topBarAnimatedStyle, bottomBarAnimatedStyle = _l.bottomBarAnimatedStyle;
    var keyboardVerticalOffset = useKeyboardVerticalOffset();
    var footer = (_jsxs(_Fragment, { children: [_jsx(SuggestedLanguage, { text: activePost.richtext.text, replyToLanguages: replyToLanguages, currentLanguages: currentLanguages, onAcceptSuggestedLanguage: setAcceptedLanguageSuggestion }), _jsx(ComposerPills, { isReply: !!replyTo, post: activePost, thread: composerState.thread, dispatch: composerDispatch, bottomBarAnimatedStyle: bottomBarAnimatedStyle }), _jsx(ComposerFooter, { post: activePost, dispatch: dispatch, showAddButton: !isEmptyPost(activePost) && (!nextPost || !isEmptyPost(nextPost)), onError: setError, onEmojiButtonPress: onEmojiButtonPress, onSelectVideo: selectVideo, onAddPost: function () {
                    composerDispatch({
                        type: 'add_post',
                    });
                }, currentLanguages: currentLanguages, onSelectLanguage: onSelectLanguage, openGallery: openGallery })] }));
    var IS_WEBFooterSticky = !IS_NATIVE && thread.posts.length > 1;
    return (_jsx(BottomSheetPortalProvider, { children: _jsxs(KeyboardAvoidingView, { testID: "composePostView", behavior: IS_IOS ? 'padding' : 'height', keyboardVerticalOffset: keyboardVerticalOffset, style: a.flex_1, children: [_jsxs(View, { style: [a.flex_1, viewStyles], "aria-modal": true, accessibilityViewIsModal: true, children: [_jsxs(ComposerTopBar, { canPost: canPost, isReply: !!replyTo, isPublishQueued: publishOnUpload, isPublishing: isPublishing, isThread: thread.posts.length > 1, publishingStage: publishingStage, topBarAnimatedStyle: topBarAnimatedStyle, onCancel: onPressCancel, onPublish: onPressPublish, children: [missingAltError && _jsx(AltTextReminder, { error: missingAltError }), _jsx(ErrorBanner, { error: error, videoState: erroredVideo, clearError: function () { return setError(''); }, clearVideo: erroredVideoPostId
                                        ? function () { return clearVideo(erroredVideoPostId); }
                                        : function () { } })] }), _jsxs(Animated.ScrollView, { ref: scrollViewRef, layout: native(LinearTransition), onScroll: scrollHandler, contentContainerStyle: a.flex_grow, style: a.flex_1, keyboardShouldPersistTaps: "always", onContentSizeChange: onScrollViewContentSizeChange, onLayout: onScrollViewLayout, children: [replyTo ? _jsx(ComposerReplyTo, { replyTo: replyTo }) : undefined, thread.posts.map(function (post, index) { return (_jsxs(React.Fragment, { children: [_jsx(ComposerPost, { post: post, dispatch: composerDispatch, textInput: post.id === activePost.id ? textInput : null, isFirstPost: index === 0, isLastPost: index === thread.posts.length - 1, isPartOfThread: thread.posts.length > 1, isReply: index > 0 || !!replyTo, isActive: post.id === activePost.id, canRemovePost: thread.posts.length > 1, canRemoveQuote: index > 0 || !initQuote, onSelectVideo: selectVideo, onClearVideo: clearVideo, onPublish: onComposerPostPublish, onError: setError }), IS_WEBFooterSticky && post.id === activePost.id && (_jsx(View, { style: styles.stickyFooterWeb, children: footer }))] }, post.id)); })] }), !IS_WEBFooterSticky && footer] }), _jsx(Prompt.Basic, { control: discardPromptControl, title: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Discard draft?"], ["Discard draft?"])))), description: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Are you sure you'd like to discard this draft?"], ["Are you sure you'd like to discard this draft?"])))), onConfirm: onClose, confirmButtonCta: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Discard"], ["Discard"])))), confirmButtonColor: "negative" })] }) }));
};
var ComposerPost = React.memo(function ComposerPost(_a) {
    var _this = this;
    var _b;
    var post = _a.post, dispatch = _a.dispatch, textInput = _a.textInput, isActive = _a.isActive, isReply = _a.isReply, isFirstPost = _a.isFirstPost, isLastPost = _a.isLastPost, isPartOfThread = _a.isPartOfThread, canRemovePost = _a.canRemovePost, canRemoveQuote = _a.canRemoveQuote, onClearVideo = _a.onClearVideo, onSelectVideo = _a.onSelectVideo, onError = _a.onError, onPublish = _a.onPublish;
    var currentAccount = useSession().currentAccount;
    var currentDid = currentAccount.did;
    var _ = useLingui()._;
    var currentProfile = useProfileQuery({ did: currentDid }).data;
    var richtext = post.richtext;
    var isTextOnly = !post.embed.link && !post.embed.quote && !post.embed.media;
    var forceMinHeight = IS_WEB && isTextOnly && isActive;
    var selectTextInputPlaceholder = isReply
        ? isFirstPost
            ? _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Write your reply"], ["Write your reply"]))))
            : _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Add another post"], ["Add another post"]))))
        : _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["What's up?"], ["What's up?"]))));
    var discardPromptControl = Prompt.usePromptControl();
    var dispatchPost = useCallback(function (action) {
        dispatch({
            type: 'update_post',
            postId: post.id,
            postAction: action,
        });
    }, [dispatch, post.id]);
    var onImageAdd = useCallback(function (next) {
        dispatchPost({
            type: 'embed_add_images',
            images: next,
        });
    }, [dispatchPost]);
    var onNewLink = useCallback(function (uri) {
        dispatchPost({ type: 'embed_add_uri', uri: uri });
    }, [dispatchPost]);
    var onPhotoPasted = useCallback(function (uri) { return __awaiter(_this, void 0, void 0, function () {
        var mimeType_1, name_1, file, _a, _b, res;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(uri.startsWith('data:video/') ||
                        (IS_WEB && uri.startsWith('data:image/gif')))) return [3 /*break*/, 3];
                    if (IS_NATIVE)
                        return [2 /*return*/]; // web only
                    mimeType_1 = uri.slice('data:'.length).split(';')[0];
                    if (!SUPPORTED_MIME_TYPES.includes(mimeType_1)) {
                        Toast.show(_(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Unsupported video type: ", ""], ["Unsupported video type: ", ""])), mimeType_1)), {
                            type: 'error',
                        });
                        return [2 /*return*/];
                    }
                    name_1 = "pasted.".concat(mimeToExt(mimeType_1));
                    return [4 /*yield*/, fetch(uri)
                            .then(function (res) { return res.blob(); })
                            .then(function (blob) { return new File([blob], name_1, { type: mimeType_1 }); })];
                case 1:
                    file = _c.sent();
                    _a = onSelectVideo;
                    _b = [post.id];
                    return [4 /*yield*/, getVideoMetadata(file)];
                case 2:
                    _a.apply(void 0, _b.concat([_c.sent()]));
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, pasteImage(uri)];
                case 4:
                    res = _c.sent();
                    onImageAdd([res]);
                    _c.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); }, [post.id, onSelectVideo, onImageAdd, _]);
    useHideKeyboardOnBackground();
    return (_jsxs(View, { style: [
            a.mx_lg,
            a.mb_sm,
            !isActive && isLastPost && a.mb_lg,
            !isActive && styles.inactivePost,
            isTextOnly && IS_NATIVE && a.flex_grow,
        ], children: [_jsxs(View, { style: [a.flex_row, IS_NATIVE && a.flex_1], children: [_jsx(UserAvatar, { avatar: currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.avatar, size: 42, type: ((_b = currentProfile === null || currentProfile === void 0 ? void 0 : currentProfile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', style: [a.mt_xs] }), _jsx(TextInput, { ref: textInput, style: [a.pt_xs], richtext: richtext, placeholder: selectTextInputPlaceholder, autoFocus: true, webForceMinHeight: forceMinHeight, 
                        // To avoid overlap with the close button:
                        hasRightPadding: isPartOfThread, isActive: isActive, setRichText: function (rt) {
                            dispatchPost({ type: 'update_richtext', richtext: rt });
                        }, onFocus: function () {
                            dispatch({
                                type: 'focus_post',
                                postId: post.id,
                            });
                        }, onPhotoPasted: onPhotoPasted, onNewLink: onNewLink, onError: onError, onPressPublish: onPublish, accessible: true, accessibilityLabel: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Write post"], ["Write post"])))), accessibilityHint: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Compose posts up to ", " in length"], ["Compose posts up to ", " in length"])), plural(MAX_GRAPHEME_LENGTH || 0, {
                            other: '# characters',
                        }))) })] }), canRemovePost && isActive && (_jsxs(_Fragment, { children: [_jsx(Button, { label: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Delete post"], ["Delete post"])))), size: "small", color: "secondary", variant: "ghost", shape: "round", style: [a.absolute, { top: 0, right: 0 }], onPress: function () {
                            if (post.shortenedGraphemeLength > 0 ||
                                post.embed.media ||
                                post.embed.link ||
                                post.embed.quote) {
                                discardPromptControl.open();
                            }
                            else {
                                dispatch({
                                    type: 'remove_post',
                                    postId: post.id,
                                });
                            }
                        }, children: _jsx(ButtonIcon, { icon: XIcon }) }), _jsx(Prompt.Basic, { control: discardPromptControl, title: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Discard post?"], ["Discard post?"])))), description: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Are you sure you'd like to discard this post?"], ["Are you sure you'd like to discard this post?"])))), onConfirm: function () {
                            dispatch({
                                type: 'remove_post',
                                postId: post.id,
                            });
                        }, confirmButtonCta: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Discard"], ["Discard"])))), confirmButtonColor: "negative" })] })), _jsx(ComposerEmbeds, { canRemoveQuote: canRemoveQuote, embed: post.embed, dispatch: dispatchPost, clearVideo: function () { return onClearVideo(post.id); }, isActivePost: isActive })] }));
});
function ComposerTopBar(_a) {
    var canPost = _a.canPost, isReply = _a.isReply, isPublishQueued = _a.isPublishQueued, isPublishing = _a.isPublishing, isThread = _a.isThread, publishingStage = _a.publishingStage, onCancel = _a.onCancel, onPublish = _a.onPublish, topBarAnimatedStyle = _a.topBarAnimatedStyle, children = _a.children;
    var pal = usePalette('default');
    var _ = useLingui()._;
    return (_jsxs(Animated.View, { style: topBarAnimatedStyle, layout: native(LinearTransition), children: [_jsxs(View, { style: styles.topbarInner, children: [_jsx(Button, { label: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Cancel"], ["Cancel"])))), variant: "ghost", color: "primary", shape: "default", size: "small", style: [a.rounded_full, a.py_sm, { paddingLeft: 7, paddingRight: 7 }], onPress: onCancel, accessibilityHint: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Closes post composer and discards post draft"], ["Closes post composer and discards post draft"])))), children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Cancel" }) }) }), _jsx(View, { style: a.flex_1 }), isPublishing ? (_jsxs(_Fragment, { children: [_jsx(Text, { style: pal.textLight, children: publishingStage }), _jsx(View, { style: styles.postBtn, children: _jsx(ActivityIndicator, {}) })] })) : (_jsx(Button, { testID: "composerPublishBtn", label: isReply
                            ? isThread
                                ? _(msg({
                                    message: 'Publish replies',
                                    comment: 'Accessibility label for button to publish multiple replies in a thread',
                                }))
                                : _(msg({
                                    message: 'Publish reply',
                                    comment: 'Accessibility label for button to publish a single reply',
                                }))
                            : isThread
                                ? _(msg({
                                    message: 'Publish posts',
                                    comment: 'Accessibility label for button to publish multiple posts in a thread',
                                }))
                                : _(msg({
                                    message: 'Publish post',
                                    comment: 'Accessibility label for button to publish a single post',
                                })), variant: "solid", color: "primary", shape: "default", size: "small", style: [a.rounded_full, a.py_sm], onPress: onPublish, disabled: !canPost || isPublishQueued, children: _jsx(ButtonText, { style: [a.text_md], children: isReply ? (_jsx(Trans, { context: "action", children: "Reply" })) : isThread ? (_jsx(Trans, { context: "action", children: "Post All" })) : (_jsx(Trans, { context: "action", children: "Post" })) }) }))] }), children] }));
}
function AltTextReminder(_a) {
    var error = _a.error;
    var pal = usePalette('default');
    return (_jsxs(View, { style: [styles.reminderLine, pal.viewLight], children: [_jsx(View, { style: styles.errorIcon, children: _jsx(FontAwesomeIcon, { icon: "exclamation", style: { color: colors.red4 }, size: 10 }) }), _jsx(Text, { style: [pal.text, a.flex_1], children: error })] }));
}
function ComposerEmbeds(_a) {
    var _b, _c, _d, _f, _g;
    var embed = _a.embed, dispatch = _a.dispatch, clearVideo = _a.clearVideo, canRemoveQuote = _a.canRemoveQuote, isActivePost = _a.isActivePost;
    var video = ((_b = embed.media) === null || _b === void 0 ? void 0 : _b.type) === 'video' ? embed.media.video : null;
    return (_jsxs(_Fragment, { children: [((_c = embed.media) === null || _c === void 0 ? void 0 : _c.type) === 'images' && (_jsx(Gallery, { images: embed.media.images, dispatch: dispatch })), ((_d = embed.media) === null || _d === void 0 ? void 0 : _d.type) === 'gif' && (_jsxs(View, { style: [a.relative, a.mt_lg], children: [_jsx(ExternalEmbedGif, { gif: embed.media.gif, onRemove: function () { return dispatch({ type: 'embed_remove_gif' }); } }), _jsx(GifAltTextDialog, { gif: embed.media.gif, altText: (_f = embed.media.alt) !== null && _f !== void 0 ? _f : '', onSubmit: function (altText) {
                            dispatch({ type: 'embed_update_gif', alt: altText });
                        } })] }, embed.media.gif.url)), !embed.media && embed.link && (_jsx(View, { style: [a.relative, a.mt_lg], children: _jsx(ExternalEmbedLink, { uri: embed.link.uri, hasQuote: !!embed.quote, onRemove: function () { return dispatch({ type: 'embed_remove_link' }); } }) }, embed.link.uri)), _jsx(LayoutAnimationConfig, { skipExiting: true, children: video && (_jsxs(Animated.View, { style: [a.w_full, a.mt_lg], entering: native(ZoomIn), exiting: native(ZoomOut), children: [video.asset &&
                            (video.status === 'compressing' ? (_jsx(VideoTranscodeProgress, { asset: video.asset, progress: video.progress, clear: clearVideo })) : video.video ? (_jsx(VideoPreview, { asset: video.asset, video: video.video, isActivePost: isActivePost, clear: clearVideo })) : null), _jsx(SubtitleDialogBtn, { defaultAltText: video.altText, saveAltText: function (altText) {
                                return dispatch({
                                    type: 'embed_update_video',
                                    videoAction: {
                                        type: 'update_alt_text',
                                        altText: altText,
                                        signal: video.abortController.signal,
                                    },
                                });
                            }, captions: video.captions, setCaptions: function (updater) {
                                dispatch({
                                    type: 'embed_update_video',
                                    videoAction: {
                                        type: 'update_captions',
                                        updater: updater,
                                        signal: video.abortController.signal,
                                    },
                                });
                            } })] })) }), ((_g = embed.quote) === null || _g === void 0 ? void 0 : _g.uri) ? (_jsx(View, { style: [a.pb_sm, video ? [a.pt_md] : [a.pt_xl], IS_WEB && [a.pb_md]], children: _jsxs(View, { style: [a.relative], children: [_jsx(View, { style: { pointerEvents: 'none' }, children: _jsx(LazyQuoteEmbed, { uri: embed.quote.uri }) }), canRemoveQuote && (_jsx(ExternalEmbedRemoveBtn, { onRemove: function () { return dispatch({ type: 'embed_remove_quote' }); }, style: { top: 16 } }))] }) })) : null] }));
}
function ComposerPills(_a) {
    var isReply = _a.isReply, thread = _a.thread, post = _a.post, dispatch = _a.dispatch, bottomBarAnimatedStyle = _a.bottomBarAnimatedStyle;
    var t = useTheme();
    var media = post.embed.media;
    var hasMedia = (media === null || media === void 0 ? void 0 : media.type) === 'images' || (media === null || media === void 0 ? void 0 : media.type) === 'video';
    var hasLink = !!post.embed.link;
    // Don't render anything if no pills are going to be displayed
    if (isReply && !hasMedia && !hasLink) {
        return null;
    }
    return (_jsx(Animated.View, { style: [a.flex_row, a.p_sm, t.atoms.bg, bottomBarAnimatedStyle], children: _jsxs(ScrollView, { contentContainerStyle: [a.gap_sm], horizontal: true, bounces: false, keyboardShouldPersistTaps: "always", showsHorizontalScrollIndicator: false, children: [isReply ? null : (_jsx(ThreadgateBtn, { postgate: thread.postgate, onChangePostgate: function (nextPostgate) {
                        dispatch({ type: 'update_postgate', postgate: nextPostgate });
                    }, threadgateAllowUISettings: thread.threadgate, onChangeThreadgateAllowUISettings: function (nextThreadgate) {
                        dispatch({
                            type: 'update_threadgate',
                            threadgate: nextThreadgate,
                        });
                    }, style: bottomBarAnimatedStyle })), hasMedia || hasLink ? (_jsx(LabelsBtn, { labels: post.labels, onChange: function (nextLabels) {
                        dispatch({
                            type: 'update_post',
                            postId: post.id,
                            postAction: {
                                type: 'update_labels',
                                labels: nextLabels,
                            },
                        });
                    } })) : null] }) }));
}
function ComposerFooter(_a) {
    var _this = this;
    var post = _a.post, dispatch = _a.dispatch, showAddButton = _a.showAddButton, onEmojiButtonPress = _a.onEmojiButtonPress, onSelectVideo = _a.onSelectVideo, onAddPost = _a.onAddPost, currentLanguages = _a.currentLanguages, onSelectLanguage = _a.onSelectLanguage, openGallery = _a.openGallery;
    var t = useTheme();
    var _ = useLingui()._;
    var isMobile = useWebMediaQueries().isMobile;
    /*
     * Once we've allowed a certain type of asset to be selected, we don't allow
     * other types of media to be selected.
     */
    var _b = useState(undefined), selectedAssetsType = _b[0], setSelectedAssetsType = _b[1];
    var media = post.embed.media;
    var images = (media === null || media === void 0 ? void 0 : media.type) === 'images' ? media.images : [];
    var video = (media === null || media === void 0 ? void 0 : media.type) === 'video' ? media.video : null;
    var isMaxImages = images.length >= MAX_IMAGES;
    var isMaxVideos = !!video;
    var selectedAssetsCount = 0;
    var isMediaSelectionDisabled = false;
    if ((media === null || media === void 0 ? void 0 : media.type) === 'images') {
        isMediaSelectionDisabled = isMaxImages;
        selectedAssetsCount = images.length;
    }
    else if ((media === null || media === void 0 ? void 0 : media.type) === 'video') {
        isMediaSelectionDisabled = isMaxVideos;
        selectedAssetsCount = 1;
    }
    else {
        isMediaSelectionDisabled = !!media;
    }
    var onImageAdd = useCallback(function (next) {
        dispatch({
            type: 'embed_add_images',
            images: next,
        });
    }, [dispatch]);
    var onSelectGif = useCallback(function (gif) {
        dispatch({ type: 'embed_add_gif', gif: gif });
    }, [dispatch]);
    /*
     * Reset if the user clears any selected media
     */
    if (selectedAssetsType !== undefined && !media) {
        setSelectedAssetsType(undefined);
    }
    var onSelectAssets = useCallback(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var images_1;
        var _this = this;
        var type = _b.type, assets = _b.assets, errors = _b.errors;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setSelectedAssetsType(type);
                    if (!assets.length) return [3 /*break*/, 3];
                    if (!(type === 'image')) return [3 /*break*/, 2];
                    images_1 = [];
                    return [4 /*yield*/, Promise.all(assets.map(function (image) { return __awaiter(_this, void 0, void 0, function () {
                            var composerImage;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, createComposerImage({
                                            path: image.uri,
                                            width: image.width,
                                            height: image.height,
                                            mime: image.mimeType,
                                        })];
                                    case 1:
                                        composerImage = _a.sent();
                                        images_1.push(composerImage);
                                        return [2 /*return*/];
                                }
                            });
                        }); })).catch(function (e) {
                            logger.error("createComposerImage failed", {
                                safeMessage: e.message,
                            });
                        })];
                case 1:
                    _c.sent();
                    onImageAdd(images_1);
                    return [3 /*break*/, 3];
                case 2:
                    if (type === 'video') {
                        onSelectVideo(post.id, assets[0]);
                    }
                    else if (type === 'gif') {
                        onSelectVideo(post.id, assets[0]);
                    }
                    _c.label = 3;
                case 3:
                    errors.map(function (error) {
                        Toast.show(error, {
                            type: 'warning',
                        });
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [post.id, onSelectVideo, onImageAdd]);
    return (_jsxs(View, { style: [
            a.flex_row,
            a.py_xs,
            { paddingLeft: 7, paddingRight: 16 },
            a.align_center,
            a.border_t,
            t.atoms.bg,
            t.atoms.border_contrast_medium,
            a.justify_between,
        ], children: [_jsx(View, { style: [a.flex_row, a.align_center], children: _jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: video && video.status !== 'done' ? (_jsx(VideoUploadToolbar, { state: video })) : (_jsxs(ToolbarWrapper, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(SelectMediaButton, { disabled: isMediaSelectionDisabled, allowedAssetTypes: selectedAssetsType, selectedAssetsCount: selectedAssetsCount, onSelectAssets: onSelectAssets, autoOpen: openGallery }), _jsx(OpenCameraBtn, { disabled: (media === null || media === void 0 ? void 0 : media.type) === 'images' ? isMaxImages : !!media, onAdd: onImageAdd }), _jsx(SelectGifBtn, { onSelectGif: onSelectGif, disabled: !!media }), !isMobile ? (_jsx(Button, { onPress: onEmojiButtonPress, style: a.p_sm, label: _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Open emoji picker"], ["Open emoji picker"])))), accessibilityHint: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Opens emoji picker"], ["Opens emoji picker"])))), variant: "ghost", shape: "round", color: "primary", children: _jsx(EmojiSmileIcon, { size: "lg" }) })) : null] })) }) }), _jsxs(View, { style: [a.flex_row, a.align_center, a.justify_between], children: [showAddButton && (_jsx(Button, { label: _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Add another post to thread"], ["Add another post to thread"])))), onPress: onAddPost, style: [a.p_sm], variant: "ghost", shape: "round", color: "primary", children: _jsx(PlusIcon, { size: "lg" }) })), _jsx(PostLanguageSelect, { currentLanguages: currentLanguages, onSelectLanguage: onSelectLanguage }), _jsx(CharProgress, { count: post.shortenedGraphemeLength, style: { width: 65 } })] })] }));
}
export function useComposerCancelRef() {
    return useRef(null);
}
function useScrollTracker(_a) {
    var scrollViewRef = _a.scrollViewRef, stickyBottom = _a.stickyBottom;
    var t = useTheme();
    var contentOffset = useSharedValue(0);
    var scrollViewHeight = useSharedValue(Infinity);
    var contentHeight = useSharedValue(0);
    var hasScrolledToTop = useDerivedValue(function () {
        return withTiming(contentOffset.get() === 0 ? 1 : 0);
    });
    var hasScrolledToBottom = useDerivedValue(function () {
        return withTiming(contentHeight.get() - contentOffset.get() - 5 <= scrollViewHeight.get()
            ? 1
            : 0);
    });
    var showHideBottomBorder = useCallback(function (_a) {
        'worklet';
        var newContentHeight = _a.newContentHeight, newContentOffset = _a.newContentOffset, newScrollViewHeight = _a.newScrollViewHeight;
        if (typeof newContentHeight === 'number')
            contentHeight.set(Math.floor(newContentHeight));
        if (typeof newContentOffset === 'number')
            contentOffset.set(Math.floor(newContentOffset));
        if (typeof newScrollViewHeight === 'number')
            scrollViewHeight.set(Math.floor(newScrollViewHeight));
    }, [contentHeight, contentOffset, scrollViewHeight]);
    var scrollHandler = useAnimatedScrollHandler({
        onScroll: function (event) {
            'worklet';
            showHideBottomBorder({
                newContentOffset: event.contentOffset.y,
                newContentHeight: event.contentSize.height,
                newScrollViewHeight: event.layoutMeasurement.height,
            });
        },
    });
    var onScrollViewContentSizeChangeUIThread = useCallback(function (newContentHeight) {
        'worklet';
        var oldContentHeight = contentHeight.get();
        var shouldScrollToBottom = false;
        if (stickyBottom && newContentHeight > oldContentHeight) {
            var isFairlyCloseToBottom = oldContentHeight - contentOffset.get() - 100 <= scrollViewHeight.get();
            if (isFairlyCloseToBottom) {
                shouldScrollToBottom = true;
            }
        }
        showHideBottomBorder({ newContentHeight: newContentHeight });
        if (shouldScrollToBottom) {
            scrollTo(scrollViewRef, 0, newContentHeight, true);
        }
    }, [
        showHideBottomBorder,
        scrollViewRef,
        contentHeight,
        stickyBottom,
        contentOffset,
        scrollViewHeight,
    ]);
    var onScrollViewContentSizeChange = useCallback(function (_width, height) {
        runOnUI(onScrollViewContentSizeChangeUIThread)(height);
    }, [onScrollViewContentSizeChangeUIThread]);
    var onScrollViewLayout = useCallback(function (evt) {
        showHideBottomBorder({
            newScrollViewHeight: evt.nativeEvent.layout.height,
        });
    }, [showHideBottomBorder]);
    var topBarAnimatedStyle = useAnimatedStyle(function () {
        return {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: interpolateColor(hasScrolledToTop.get(), [0, 1], [t.atoms.border_contrast_medium.borderColor, 'transparent']),
        };
    });
    var bottomBarAnimatedStyle = useAnimatedStyle(function () {
        return {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderColor: interpolateColor(hasScrolledToBottom.get(), [0, 1], [t.atoms.border_contrast_medium.borderColor, 'transparent']),
        };
    });
    return {
        scrollHandler: scrollHandler,
        onScrollViewContentSizeChange: onScrollViewContentSizeChange,
        onScrollViewLayout: onScrollViewLayout,
        topBarAnimatedStyle: topBarAnimatedStyle,
        bottomBarAnimatedStyle: bottomBarAnimatedStyle,
    };
}
function useKeyboardVerticalOffset() {
    var _a = useSafeAreaInsets(), top = _a.top, bottom = _a.bottom;
    // Android etc
    if (!IS_IOS) {
        // need to account for the edge-to-edge nav bar
        return bottom * -1;
    }
    // iPhone SE
    if (top === 20)
        return 40;
    // all other iPhones
    return top + 10;
}
function whenAppViewReady(agent, uri, fn) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, until(5, // 5 tries
                    1e3, // 1s delay between tries
                    fn, function () {
                        return agent.app.bsky.unspecced.getPostThreadV2({
                            anchor: uri,
                            above: false,
                            below: 0,
                            branchingFactor: 0,
                        });
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function isEmptyPost(post) {
    return (post.richtext.text.trim().length === 0 &&
        !post.embed.media &&
        !post.embed.link &&
        !post.embed.quote);
}
function useHideKeyboardOnBackground() {
    var appState = useAppState();
    useEffect(function () {
        if (IS_IOS) {
            if (appState === 'inactive') {
                Keyboard.dismiss();
            }
        }
    }, [appState]);
}
var styles = StyleSheet.create({
    topbarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: 54,
        gap: 4,
    },
    postBtn: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 6,
        marginLeft: 12,
    },
    stickyFooterWeb: web({
        position: 'sticky',
        bottom: 0,
    }),
    errorLine: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.red1,
        borderRadius: 6,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
    },
    reminderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 6,
        marginHorizontal: 16,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginBottom: 8,
    },
    errorIcon: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.red4,
        color: colors.red4,
        borderRadius: 30,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5,
    },
    inactivePost: {
        opacity: 0.5,
    },
    addExtLinkBtn: {
        borderWidth: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 10,
        marginBottom: 4,
    },
});
function ErrorBanner(_a) {
    var standardError = _a.error, videoState = _a.videoState, clearError = _a.clearError, clearVideo = _a.clearVideo;
    var t = useTheme();
    var _ = useLingui()._;
    var videoError = videoState.status === 'error' ? videoState.error : undefined;
    var error = standardError || videoError;
    var onClearError = function () {
        if (standardError) {
            clearError();
        }
        else {
            clearVideo();
        }
    };
    if (!error)
        return null;
    return (_jsx(Animated.View, { style: [a.px_lg, a.pb_sm], entering: FadeIn, exiting: FadeOut, children: _jsxs(View, { style: [
                a.px_md,
                a.py_sm,
                a.gap_xs,
                a.rounded_sm,
                t.atoms.bg_contrast_25,
            ], children: [_jsxs(View, { style: [a.relative, a.flex_row, a.gap_sm, { paddingRight: 48 }], children: [_jsx(CircleInfoIcon, { fill: t.palette.negative_400 }), _jsx(NewText, { style: [a.flex_1, a.leading_snug, { paddingTop: 1 }], children: error }), _jsx(Button, { label: _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Dismiss error"], ["Dismiss error"])))), size: "tiny", color: "secondary", variant: "ghost", shape: "round", style: [a.absolute, { top: 0, right: 0 }], onPress: onClearError, children: _jsx(ButtonIcon, { icon: XIcon }) })] }), videoError && videoState.jobId && (_jsx(NewText, { style: [
                        { paddingLeft: 28 },
                        a.text_xs,
                        a.font_semi_bold,
                        a.leading_snug,
                        t.atoms.text_contrast_low,
                    ], children: _jsxs(Trans, { children: ["Job ID: ", videoState.jobId] }) }))] }) }));
}
function ToolbarWrapper(_a) {
    var style = _a.style, children = _a.children;
    if (IS_WEB)
        return children;
    return (_jsx(Animated.View, { style: style, entering: FadeIn.duration(400), exiting: FadeOut.duration(400), children: children }));
}
function VideoUploadToolbar(_a) {
    var state = _a.state;
    var t = useTheme();
    var _ = useLingui()._;
    var progress = state.progress;
    var shouldRotate = state.status === 'processing' && (progress === 0 || progress === 1);
    var wheelProgress = shouldRotate ? 0.33 : progress;
    var rotate = useDerivedValue(function () {
        if (shouldRotate) {
            return withRepeat(withTiming(360, {
                duration: 2500,
                easing: Easing.out(Easing.cubic),
            }), -1);
        }
        return 0;
    });
    var animatedStyle = useAnimatedStyle(function () {
        return {
            transform: [{ rotateZ: "".concat(rotate.get(), "deg") }],
        };
    });
    var text = '';
    switch (state.status) {
        case 'compressing':
            text = _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Compressing video..."], ["Compressing video..."]))));
            break;
        case 'uploading':
            text = _(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Uploading video..."], ["Uploading video..."]))));
            break;
        case 'processing':
            text = _(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Processing video..."], ["Processing video..."]))));
            break;
        case 'error':
            text = _(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Error"], ["Error"]))));
            wheelProgress = 100;
            break;
        case 'done':
            text = _(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Video uploaded"], ["Video uploaded"]))));
            break;
    }
    return (_jsxs(ToolbarWrapper, { style: [a.flex_row, a.align_center, { paddingVertical: 5 }], children: [_jsx(Animated.View, { style: [animatedStyle], children: _jsx(ProgressCircle, { size: 30, borderWidth: 1, borderColor: t.atoms.border_contrast_low.borderColor, color: state.status === 'error'
                        ? t.palette.negative_500
                        : t.palette.primary_500, progress: wheelProgress }) }), _jsx(NewText, { style: [a.font_semi_bold, a.ml_sm], children: text })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33;
