var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, View, } from 'react-native';
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { useEvent, useEventListener } from 'expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { createVideoPlayer, VideoView } from 'expo-video';
import { AppBskyEmbedVideo, AppBskyFeedPost, AtUri, RichText as RichTextAPI, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, } from '@react-navigation/native';
import { HITSLOP_20 } from '#/lib/constants';
import { useHaptics } from '#/lib/haptics';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { logger } from '#/logger';
import { useA11y } from '#/state/a11y';
import { POST_TOMBSTONE, usePostShadow, } from '#/state/cache/post-shadow';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { FeedFeedbackProvider, useFeedFeedback, useFeedFeedbackContext, } from '#/state/feed-feedback';
import { useFeedInfo } from '#/state/queries/feed';
import { usePostLikeMutationQueue } from '#/state/queries/post';
import { usePostFeedQuery, } from '#/state/queries/post-feed';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { useSetLightStatusBar } from '#/state/shell/light-status-bar';
import { List } from '#/view/com/util/List';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { ThreadComposePrompt } from '#/screens/PostThread/components/ThreadComposePrompt';
import { Header } from '#/screens/VideoFeed/components/Header';
import { atoms as a, ios, platform, ThemeProvider, useTheme } from '#/alf';
import { setSystemUITheme } from '#/alf/util/systemUI';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Divider } from '#/components/Divider';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { EyeSlash_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/EyeSlash';
import { Leaf_Stroke2_Corner0_Rounded as LeafIcon } from '#/components/icons/Leaf';
import { KeepAwake } from '#/components/KeepAwake';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
import { ListFooter } from '#/components/Lists';
import * as Hider from '#/components/moderation/Hider';
import { PostControls } from '#/components/PostControls';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_ANDROID } from '#/env';
import * as bsky from '#/types/bsky';
import { Scrubber, VIDEO_PLAYER_BOTTOM_INSET } from './components/Scrubber';
function createThreeVideoPlayers(sources) {
    var _a, _b, _c;
    // android is typically slower and can't keep up with a 0.1 interval
    var eventInterval = platform({
        ios: 0.2,
        android: 0.5,
        default: 0,
    });
    var p1 = createVideoPlayer((_a = sources === null || sources === void 0 ? void 0 : sources[0]) !== null && _a !== void 0 ? _a : '');
    p1.loop = true;
    p1.timeUpdateEventInterval = eventInterval;
    var p2 = createVideoPlayer((_b = sources === null || sources === void 0 ? void 0 : sources[1]) !== null && _b !== void 0 ? _b : '');
    p2.loop = true;
    p2.timeUpdateEventInterval = eventInterval;
    var p3 = createVideoPlayer((_c = sources === null || sources === void 0 ? void 0 : sources[2]) !== null && _c !== void 0 ? _c : '');
    p3.loop = true;
    p3.timeUpdateEventInterval = eventInterval;
    return [p1, p2, p3];
}
export function VideoFeed(_a) {
    var top = useSafeAreaInsets().top;
    var params = useRoute().params;
    var t = useTheme();
    var setMinShellMode = useSetMinimalShellMode();
    useFocusEffect(useCallback(function () {
        setMinShellMode(true);
        setSystemUITheme('lightbox', t);
        return function () {
            setMinShellMode(false);
            setSystemUITheme('theme', t);
        };
    }, [setMinShellMode, t]));
    var isFocused = useIsFocused();
    useSetLightStatusBar(isFocused);
    return (_jsx(ThemeProvider, { theme: "dark", children: _jsxs(Layout.Screen, { noInsetTop: true, style: { backgroundColor: 'black' }, children: [_jsx(KeepAwake, {}), _jsx(View, { style: [
                        a.absolute,
                        a.z_50,
                        { top: 0, left: 0, right: 0, paddingTop: top },
                    ], children: _jsx(Header, { sourceContext: params }) }), _jsx(Feed, {})] }) }));
}
var viewabilityConfig = {
    itemVisiblePercentThreshold: 100,
    minimumViewTime: 0,
};
function Feed() {
    var params = useRoute().params;
    var isFocused = useIsFocused();
    var hasSession = useSession().hasSession;
    var height = useSafeAreaFrame().height;
    var feedDesc = useMemo(function () {
        switch (params.type) {
            case 'feedgen':
                return "feedgen|".concat(params.uri);
            case 'author':
                return "author|".concat(params.did, "|").concat(params.filter);
            default:
                throw new Error("Invalid video feed params ".concat(JSON.stringify(params)));
        }
    }, [params]);
    var feedUri = params.type === 'feedgen' ? params.uri : undefined;
    var feedInfo = useFeedInfo(feedUri).data;
    var feedFeedback = useFeedFeedback(feedInfo !== null && feedInfo !== void 0 ? feedInfo : undefined, hasSession);
    var _a = usePostFeedQuery(feedDesc, params.type === 'feedgen' && params.sourceInterstitial !== 'none'
        ? { feedCacheKey: params.sourceInterstitial }
        : undefined), data = _a.data, error = _a.error, hasNextPage = _a.hasNextPage, isFetchingNextPage = _a.isFetchingNextPage, fetchNextPage = _a.fetchNextPage;
    var videos = useMemo(function () {
        var _a;
        var vids = (_a = data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) {
            var items = [];
            var _loop_1 = function (slice) {
                var feedPost = slice.items.find(function (item) { return item.uri === slice.feedPostUri; });
                if (feedPost && AppBskyEmbedVideo.isView(feedPost.post.embed)) {
                    items.push({
                        _reactKey: feedPost._reactKey,
                        moderation: feedPost.moderation,
                        post: feedPost.post,
                        video: feedPost.post.embed,
                        feedContext: slice.feedContext,
                        reqId: slice.reqId,
                    });
                }
            };
            for (var _i = 0, _a = page.slices; _i < _a.length; _i++) {
                var slice = _a[_i];
                _loop_1(slice);
            }
            return items;
        })) !== null && _a !== void 0 ? _a : [];
        var startingVideoIndex = vids === null || vids === void 0 ? void 0 : vids.findIndex(function (video) {
            return video.post.uri === params.initialPostUri;
        });
        if (vids && startingVideoIndex && startingVideoIndex > -1) {
            vids = vids.slice(startingVideoIndex);
        }
        return vids;
    }, [data, params.initialPostUri]);
    var _b = useState([null, null, null]), currentSources = _b[0], setCurrentSources = _b[1];
    var _c = useState(null), players = _c[0], setPlayers = _c[1];
    var _d = useState(0), currentIndex = _d[0], setCurrentIndex = _d[1];
    var scrollGesture = useMemo(function () { return Gesture.Native(); }, []);
    var renderItem = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        var post = item.post, video = item.video;
        var player = players === null || players === void 0 ? void 0 : players[index % 3];
        var currentSource = currentSources[index % 3];
        return (_jsx(VideoItem, { player: player, post: post, embed: video, active: isFocused &&
                index === currentIndex &&
                (currentSource === null || currentSource === void 0 ? void 0 : currentSource.source) === video.playlist, adjacent: index === currentIndex - 1 || index === currentIndex + 1, moderation: item.moderation, scrollGesture: scrollGesture, feedContext: item.feedContext, reqId: item.reqId }));
    }, [players, currentIndex, isFocused, currentSources, scrollGesture]);
    var updateVideoState = useCallback(function (index) {
        var _a, _b, _c, _d, _e, _f;
        if (!videos.length)
            return;
        var prevSlice = videos.at(index - 1);
        var prevPost = prevSlice === null || prevSlice === void 0 ? void 0 : prevSlice.post;
        var prevEmbed = prevPost === null || prevPost === void 0 ? void 0 : prevPost.embed;
        var prevVideo = prevEmbed && AppBskyEmbedVideo.isView(prevEmbed)
            ? prevEmbed.playlist
            : null;
        var currSlice = videos.at(index);
        var currPost = currSlice === null || currSlice === void 0 ? void 0 : currSlice.post;
        var currEmbed = currPost === null || currPost === void 0 ? void 0 : currPost.embed;
        var currVideo = currEmbed && AppBskyEmbedVideo.isView(currEmbed)
            ? currEmbed.playlist
            : null;
        var currVideoModeration = currSlice === null || currSlice === void 0 ? void 0 : currSlice.moderation;
        var nextSlice = videos.at(index + 1);
        var nextPost = nextSlice === null || nextSlice === void 0 ? void 0 : nextSlice.post;
        var nextEmbed = nextPost === null || nextPost === void 0 ? void 0 : nextPost.embed;
        var nextVideo = nextEmbed && AppBskyEmbedVideo.isView(nextEmbed)
            ? nextEmbed.playlist
            : null;
        var prevPlayerCurrentSource = currentSources[(index + 2) % 3];
        var currPlayerCurrentSource = currentSources[index % 3];
        var nextPlayerCurrentSource = currentSources[(index + 1) % 3];
        if (!players) {
            var args = ['', '', ''];
            if (prevVideo)
                args[(index + 2) % 3] = prevVideo;
            if (currVideo)
                args[index % 3] = currVideo;
            if (nextVideo)
                args[(index + 1) % 3] = nextVideo;
            var _g = createThreeVideoPlayers(args), player1 = _g[0], player2 = _g[1], player3 = _g[2];
            setPlayers([player1, player2, player3]);
            if (currVideo) {
                var currPlayer = [player1, player2, player3][index % 3];
                currPlayer.play();
            }
        }
        else {
            var player1 = players[0], player2 = players[1], player3 = players[2];
            var prevPlayer = [player1, player2, player3][(index + 2) % 3];
            var currPlayer = [player1, player2, player3][index % 3];
            var nextPlayer = [player1, player2, player3][(index + 1) % 3];
            if (prevVideo && prevVideo !== (prevPlayerCurrentSource === null || prevPlayerCurrentSource === void 0 ? void 0 : prevPlayerCurrentSource.source)) {
                prevPlayer.replace(prevVideo);
            }
            prevPlayer.pause();
            if (currVideo) {
                if (currVideo !== (currPlayerCurrentSource === null || currPlayerCurrentSource === void 0 ? void 0 : currPlayerCurrentSource.source)) {
                    currPlayer.replace(currVideo);
                }
                if (currVideoModeration &&
                    (currVideoModeration.ui('contentView').blur ||
                        currVideoModeration.ui('contentMedia').blur)) {
                    currPlayer.pause();
                }
                else {
                    currPlayer.play();
                }
            }
            if (nextVideo && nextVideo !== (nextPlayerCurrentSource === null || nextPlayerCurrentSource === void 0 ? void 0 : nextPlayerCurrentSource.source)) {
                nextPlayer.replace(nextVideo);
            }
            nextPlayer.pause();
        }
        var updatedSources = __spreadArray([], currentSources, true);
        if (prevVideo && prevVideo !== (prevPlayerCurrentSource === null || prevPlayerCurrentSource === void 0 ? void 0 : prevPlayerCurrentSource.source)) {
            updatedSources[(index + 2) % 3] = {
                source: prevVideo,
            };
        }
        if (currVideo && currVideo !== (currPlayerCurrentSource === null || currPlayerCurrentSource === void 0 ? void 0 : currPlayerCurrentSource.source)) {
            updatedSources[index % 3] = {
                source: currVideo,
            };
        }
        if (nextVideo && nextVideo !== (nextPlayerCurrentSource === null || nextPlayerCurrentSource === void 0 ? void 0 : nextPlayerCurrentSource.source)) {
            updatedSources[(index + 1) % 3] = {
                source: nextVideo,
            };
        }
        if (((_a = updatedSources[0]) === null || _a === void 0 ? void 0 : _a.source) !== ((_b = currentSources[0]) === null || _b === void 0 ? void 0 : _b.source) ||
            ((_c = updatedSources[1]) === null || _c === void 0 ? void 0 : _c.source) !== ((_d = currentSources[1]) === null || _d === void 0 ? void 0 : _d.source) ||
            ((_e = updatedSources[2]) === null || _e === void 0 ? void 0 : _e.source) !== ((_f = currentSources[2]) === null || _f === void 0 ? void 0 : _f.source)) {
            setCurrentSources(updatedSources);
        }
    }, [videos, currentSources, players]);
    var updateVideoStateInitially = useNonReactiveCallback(function () {
        updateVideoState(currentIndex);
    });
    useFocusEffect(useCallback(function () {
        if (!players) {
            // create players, set sources, start playing
            updateVideoStateInitially();
        }
        return function () {
            if (players) {
                // manually release players when offscreen
                players.forEach(function (p) { return p.release(); });
                setPlayers(null);
            }
        };
    }, [players, updateVideoStateInitially]));
    var onViewableItemsChanged = useCallback(function (_a) {
        var viewableItems = _a.viewableItems;
        if (viewableItems[0] && viewableItems[0].index !== null) {
            var newIndex = viewableItems[0].index;
            setCurrentIndex(newIndex);
            updateVideoState(newIndex);
        }
    }, [updateVideoState]);
    var renderEndMessage = useCallback(function () { return _jsx(EndMessage, {}); }, []);
    return (_jsx(FeedFeedbackProvider, { value: feedFeedback, children: _jsx(GestureDetector, { gesture: scrollGesture, children: _jsx(List, { data: videos, renderItem: renderItem, keyExtractor: keyExtractor, initialNumToRender: 3, maxToRenderPerBatch: 3, windowSize: 6, pagingEnabled: true, ListFooterComponent: _jsx(ListFooter, { hasNextPage: hasNextPage, isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage, height: height, showEndMessage: true, renderEndMessage: renderEndMessage, style: [a.justify_center, a.border_0] }), onEndReached: function () {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }, showsVerticalScrollIndicator: false, onViewableItemsChanged: onViewableItemsChanged, viewabilityConfig: viewabilityConfig }) }) }));
}
function keyExtractor(item) {
    return item._reactKey;
}
var VideoItem = function (_a) {
    var player = _a.player, post = _a.post, embed = _a.embed, active = _a.active, adjacent = _a.adjacent, scrollGesture = _a.scrollGesture, moderation = _a.moderation, feedContext = _a.feedContext, reqId = _a.reqId;
    var ax = useAnalytics();
    var postShadow = usePostShadow(post);
    var _b = useSafeAreaFrame(), width = _b.width, height = _b.height;
    var _c = useFeedFeedbackContext(), sendInteraction = _c.sendInteraction, feedDescriptor = _c.feedDescriptor;
    var hasTrackedView = useRef(false);
    useEffect(function () {
        if (active) {
            sendInteraction({
                item: post.uri,
                event: 'app.bsky.feed.defs#interactionSeen',
                feedContext: feedContext,
                reqId: reqId,
            });
            // Track post:view event
            if (!hasTrackedView.current) {
                hasTrackedView.current = true;
                ax.metric('post:view', {
                    uri: post.uri,
                    authorDid: post.author.did,
                    logContext: 'ImmersiveVideo',
                    feedDescriptor: feedDescriptor,
                });
            }
        }
    }, [
        active,
        post.uri,
        post.author.did,
        feedContext,
        reqId,
        sendInteraction,
        feedDescriptor,
    ]);
    // TODO: high-performance android phones should also
    // be capable of rendering 3 video players, but currently
    // we can't distinguish between them
    var shouldRenderVideo = active || ios(adjacent);
    return (_jsx(View, { style: [a.relative, { height: height, width: width }], children: postShadow === POST_TOMBSTONE ? (_jsx(View, { style: [
                a.absolute,
                a.inset_0,
                a.z_20,
                a.align_center,
                a.justify_center,
                { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
            ], children: _jsx(Text, { style: [
                    a.text_2xl,
                    a.font_bold,
                    a.text_center,
                    a.leading_tight,
                    a.mx_xl,
                ], children: _jsx(Trans, { children: "Post has been deleted" }) }) })) : (_jsxs(_Fragment, { children: [_jsx(VideoItemPlaceholder, { embed: embed }), shouldRenderVideo && player && (_jsx(VideoItemInner, { player: player, embed: embed })), moderation && (_jsx(Overlay, { player: player, post: postShadow, embed: embed, active: active, scrollGesture: scrollGesture, moderation: moderation, feedContext: feedContext, reqId: reqId }))] })) }));
};
VideoItem = memo(VideoItem);
function VideoItemInner(_a) {
    var player = _a.player, embed = _a.embed;
    var bottom = useSafeAreaInsets().bottom;
    var _b = useState(!IS_ANDROID), isReady = _b[0], setIsReady = _b[1];
    useEventListener(player, 'timeUpdate', function (evt) {
        if (IS_ANDROID && !isReady && evt.currentTime >= 0.05) {
            setIsReady(true);
        }
    });
    return (_jsx(VideoView, { accessible: false, style: [
            a.absolute,
            {
                top: 0,
                left: 0,
                right: 0,
                bottom: bottom + VIDEO_PLAYER_BOTTOM_INSET,
            },
            !isReady && { opacity: 0 },
        ], player: player, nativeControls: false, contentFit: isTallAspectRatio(embed.aspectRatio) ? 'cover' : 'contain', accessibilityIgnoresInvertColors: true }));
}
function ModerationOverlay(_a) {
    var embed = _a.embed, onPressShow = _a.onPressShow;
    var _ = useLingui()._;
    var hider = Hider.useHider();
    var bottom = useSafeAreaInsets().bottom;
    var onShow = useCallback(function () {
        hider.setIsContentVisible(true);
        onPressShow();
    }, [hider, onPressShow]);
    return (_jsxs(View, { style: [a.absolute, a.inset_0, a.z_20], children: [_jsx(VideoItemPlaceholder, { blur: true, embed: embed }), _jsxs(View, { style: [
                    a.absolute,
                    a.inset_0,
                    a.z_20,
                    a.justify_center,
                    a.align_center,
                    { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
                ], children: [_jsxs(View, { style: [a.align_center, a.gap_sm], children: [_jsx(Eye, { width: 36, fill: "white" }), _jsx(Text, { style: [a.text_center, a.leading_snug, a.pb_xs], children: _jsx(Trans, { children: "Hidden by your moderation settings." }) }), _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Show anyway"], ["Show anyway"])))), size: "small", variant: "solid", color: "secondary_inverted", onPress: onShow, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Show anyway" }) }) })] }), _jsxs(View, { style: [
                            a.absolute,
                            a.inset_0,
                            a.px_xl,
                            a.pt_4xl,
                            {
                                top: 'auto',
                                paddingBottom: bottom,
                            },
                        ], children: [_jsx(LinearGradient, { colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)'], style: [a.absolute, a.inset_0] }), _jsx(Divider, { style: { borderColor: 'white' } }), _jsx(View, { children: _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View details"], ["View details"])))), onPress: function () {
                                        hider.showInfoDialog();
                                    }, style: [
                                        a.w_full,
                                        {
                                            height: 60,
                                        },
                                    ], children: function (_a) {
                                        var pressed = _a.pressed;
                                        return (_jsx(Text, { style: [
                                                a.text_sm,
                                                a.font_semi_bold,
                                                a.text_center,
                                                { opacity: pressed ? 0.5 : 1 },
                                            ], children: _jsx(Trans, { children: "View details" }) }));
                                    } }) })] })] })] }));
}
function Overlay(_a) {
    var _b, _c, _d, _e, _f, _g;
    var player = _a.player, post = _a.post, embed = _a.embed, active = _a.active, scrollGesture = _a.scrollGesture, moderation = _a.moderation, feedContext = _a.feedContext, reqId = _a.reqId;
    var _ = useLingui()._;
    var t = useTheme();
    var openComposer = useOpenComposer().openComposer;
    var currentAccount = useSession().currentAccount;
    var navigation = useNavigation();
    var seekingAnimationSV = useSharedValue(0);
    var profile = useProfileShadow(post.author);
    var _h = useProfileFollowMutationQueue(profile, 'ImmersiveVideo'), queueFollow = _h[0], queueUnfollow = _h[1];
    var rkey = new AtUri(post.uri).rkey;
    var record = bsky.dangerousIsType(post.record, AppBskyFeedPost.isRecord)
        ? post.record
        : undefined;
    var richText = new RichTextAPI({
        text: (record === null || record === void 0 ? void 0 : record.text) || '',
        facets: record === null || record === void 0 ? void 0 : record.facets,
    });
    var handle = sanitizeHandle(post.author.handle, '@');
    var animatedStyle = useAnimatedStyle(function () { return ({
        opacity: 1 - seekingAnimationSV.get(),
    }); });
    var onPressShow = useCallback(function () {
        player === null || player === void 0 ? void 0 : player.play();
    }, [player]);
    var mergedModui = useMemo(function () {
        var modui = moderation.ui('contentView');
        var mediaModui = moderation.ui('contentMedia');
        modui.alerts = __spreadArray(__spreadArray([], modui.alerts, true), mediaModui.alerts, true);
        modui.blurs = __spreadArray(__spreadArray([], modui.blurs, true), mediaModui.blurs, true);
        modui.filters = __spreadArray(__spreadArray([], modui.filters, true), mediaModui.filters, true);
        modui.informs = __spreadArray(__spreadArray([], modui.informs, true), mediaModui.informs, true);
        return modui;
    }, [moderation]);
    var onPressReply = useCallback(function () {
        openComposer({
            replyTo: {
                uri: post.uri,
                cid: post.cid,
                text: (record === null || record === void 0 ? void 0 : record.text) || '',
                author: post.author,
                embed: post.embed,
                langs: record === null || record === void 0 ? void 0 : record.langs,
            },
        });
    }, [openComposer, post, record]);
    return (_jsxs(Hider.Outer, { modui: mergedModui, children: [_jsx(Hider.Mask, { children: _jsx(ModerationOverlay, { embed: embed, onPressShow: onPressShow }) }), _jsx(Hider.Content, { children: _jsxs(View, { style: [a.absolute, a.inset_0, a.z_20], children: [_jsx(View, { style: [a.flex_1], children: player && (_jsx(PlayPauseTapArea, { player: player, post: post, feedContext: feedContext, reqId: reqId })) }), _jsxs(LinearGradient, { colors: [
                                'rgba(0,0,0,0)',
                                'rgba(0,0,0,0.7)',
                                'rgba(0,0,0,0.95)',
                                'rgba(0,0,0,0.95)',
                            ], style: [a.w_full, a.pt_md], children: [_jsxs(Animated.View, { style: [a.px_md, animatedStyle], children: [_jsxs(View, { style: [a.w_full, a.flex_row, a.align_center, a.gap_md], children: [_jsxs(Link, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["View ", "'s profile"], ["View ", "'s profile"])), sanitizeDisplayName(post.author.displayName || post.author.handle))), to: {
                                                        screen: 'Profile',
                                                        params: { name: post.author.did },
                                                    }, style: [a.flex_1, a.flex_row, a.gap_md, a.align_center], children: [_jsx(UserAvatar, { type: "user", avatar: post.author.avatar, size: 32 }), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { style: [a.text_md, a.font_bold], emoji: true, numberOfLines: 1, children: sanitizeDisplayName(post.author.displayName || post.author.handle) }), _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_high], numberOfLines: 1, children: handle })] })] }), post.author.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
                                                    !((_b = post.author.viewer) === null || _b === void 0 ? void 0 : _b.following) && (_jsxs(Button, { label: ((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.following)
                                                        ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Following ", ""], ["Following ", ""])), handle))
                                                        : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Follow ", ""], ["Follow ", ""])), handle)), accessibilityHint: ((_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.following)
                                                        ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Unfollows the user"], ["Unfollows the user"]))))
                                                        : '', size: "small", variant: "solid", color: "secondary_inverted", style: [a.mb_xs], onPress: function () {
                                                        var _a;
                                                        return ((_a = profile.viewer) === null || _a === void 0 ? void 0 : _a.following)
                                                            ? queueUnfollow()
                                                            : queueFollow();
                                                    }, children: [!!((_e = profile.viewer) === null || _e === void 0 ? void 0 : _e.following) && (_jsx(ButtonIcon, { icon: CheckIcon })), _jsx(ButtonText, { children: ((_f = profile.viewer) === null || _f === void 0 ? void 0 : _f.following) ? (_jsx(Trans, { children: "Following" })) : (_jsx(Trans, { children: "Follow" })) })] }))] }), ((_g = record === null || record === void 0 ? void 0 : record.text) === null || _g === void 0 ? void 0 : _g.trim()) && (_jsx(ExpandableRichTextView, { value: richText, authorHandle: post.author.handle })), record && (_jsx(View, { style: [{ left: -5 }], children: _jsx(PostControls, { richText: richText, post: post, record: record, feedContext: feedContext, logContext: "FeedItem", onPressReply: function () {
                                                    return navigation.navigate('PostThread', {
                                                        name: post.author.did,
                                                        rkey: rkey,
                                                    });
                                                }, big: true }) }))] }), _jsx(Scrubber, { active: active, player: player, seekingAnimationSV: seekingAnimationSV, scrollGesture: scrollGesture, children: _jsx(ThreadComposePrompt, { onPressCompose: onPressReply, style: [a.pt_md, a.pb_sm] }) })] })] }) })] }));
}
function ExpandableRichTextView(_a) {
    var value = _a.value, authorHandle = _a.authorHandle;
    var screenHeight = useSafeAreaFrame().height;
    var _b = useState(false), expanded = _b[0], setExpanded = _b[1];
    var _c = useState(false), hasBeenExpanded = _c[0], setHasBeenExpanded = _c[1];
    var _d = useState(false), constrained = _d[0], setConstrained = _d[1];
    var _e = useState(0), contentHeight = _e[0], setContentHeight = _e[1];
    var _ = useLingui()._;
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    if (expanded && !hasBeenExpanded) {
        setHasBeenExpanded(true);
    }
    return (_jsxs(ScrollView, { scrollEnabled: expanded, onContentSizeChange: function (_w, h) {
            if (hasBeenExpanded) {
                LayoutAnimation.configureNext({
                    duration: 500,
                    update: { type: 'spring', springDamping: 0.6 },
                });
            }
            setContentHeight(h);
        }, style: { height: Math.min(contentHeight, screenHeight * 0.5) }, contentContainerStyle: [
            a.py_sm,
            a.gap_xs,
            expanded ? [a.align_start] : a.flex_row,
        ], children: [_jsx(RichText, { value: value, style: [a.text_sm, a.flex_1, a.leading_relaxed], authorHandle: authorHandle, enableTags: true, numberOfLines: expanded || screenReaderEnabled ? undefined : constrained ? 2 : 2, onTextLayout: function (evt) {
                    if (!constrained && evt.nativeEvent.lines.length > 1) {
                        setConstrained(true);
                    }
                } }), constrained && !screenReaderEnabled && (_jsx(Pressable, { accessibilityHint: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Expands or collapses post text"], ["Expands or collapses post text"])))), accessibilityLabel: expanded ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Read less"], ["Read less"])))) : _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Read more"], ["Read more"])))), hitSlop: HITSLOP_20, onPress: function () { return setExpanded(function (prev) { return !prev; }); }, style: [a.absolute, a.inset_0] }))] }));
}
function VideoItemPlaceholder(_a) {
    var embed = _a.embed, style = _a.style, blur = _a.blur;
    var bottom = useSafeAreaInsets().bottom;
    var src = embed.thumbnail;
    var contentFit = isTallAspectRatio(embed.aspectRatio)
        ? 'cover'
        : 'contain';
    if (blur) {
        contentFit = 'cover';
    }
    return src ? (_jsx(Image, { accessibilityIgnoresInvertColors: true, source: { uri: src }, style: [
            a.absolute,
            blur
                ? a.inset_0
                : {
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: bottom + VIDEO_PLAYER_BOTTOM_INSET,
                },
            style,
        ], contentFit: contentFit, blurRadius: blur ? 100 : 0 })) : null;
}
function PlayPauseTapArea(_a) {
    var player = _a.player, post = _a.post, feedContext = _a.feedContext, reqId = _a.reqId;
    var _ = useLingui()._;
    var doubleTapRef = useRef(null);
    var playHaptic = useHaptics();
    // TODO: implement viaRepost -sfn
    var queueLike = usePostLikeMutationQueue(post, undefined, undefined, 'ImmersiveVideo')[0];
    var sendInteraction = useFeedFeedbackContext().sendInteraction;
    var isPlaying = useEvent(player, 'playingChange', {
        isPlaying: player.playing,
    }).isPlaying;
    var isMounted = useRef(false);
    useEffect(function () {
        isMounted.current = true;
        return function () {
            isMounted.current = false;
        };
    }, []);
    var togglePlayPause = useNonReactiveCallback(function () {
        // gets called after a timeout, so guard against being called after unmount -sfn
        if (!player || !isMounted.current)
            return;
        doubleTapRef.current = null;
        try {
            if (player.playing) {
                player.pause();
            }
            else {
                player.play();
            }
        }
        catch (err) {
            logger.error('Could not toggle play/pause', { safeMessage: err });
        }
    });
    var onPress = function () {
        if (doubleTapRef.current) {
            clearTimeout(doubleTapRef.current);
            doubleTapRef.current = null;
            playHaptic('Light');
            queueLike();
            sendInteraction({
                item: post.uri,
                event: 'app.bsky.feed.defs#interactionLike',
                feedContext: feedContext,
                reqId: reqId,
            });
        }
        else {
            doubleTapRef.current = setTimeout(togglePlayPause, 200);
        }
    };
    return (_jsx(Button, { disabled: !player, "aria-valuetext": isPlaying ? _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Video is playing"], ["Video is playing"])))) : _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Video is paused"], ["Video is paused"])))), label: _("Video from ".concat(sanitizeHandle(post.author.handle, '@'), ". Tap to play or pause the video")), accessibilityHint: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Double tap to like"], ["Double tap to like"])))), onPress: onPress, style: [a.absolute, a.inset_0, a.z_10], children: _jsx(View, {}) }));
}
function EndMessage() {
    var navigation = useNavigation();
    var _ = useLingui()._;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.w_full,
            a.gap_3xl,
            a.px_lg,
            a.mx_auto,
            a.align_center,
            { maxWidth: 350 },
        ], children: [_jsx(View, { style: [
                    { height: 100, width: 100 },
                    a.rounded_full,
                    t.atoms.bg_contrast_700,
                    a.align_center,
                    a.justify_center,
                ], children: _jsx(LeafIcon, { width: 64, fill: "black" }) }), _jsxs(View, { style: [a.w_full, a.gap_md], children: [_jsx(Text, { style: [a.text_3xl, a.text_center, a.font_bold], children: _jsx(Trans, { children: "That's everything!" }) }), _jsx(Text, { style: [
                            a.text_lg,
                            a.text_center,
                            t.atoms.text_contrast_high,
                            a.leading_snug,
                        ], children: _jsx(Trans, { children: "You've run out of videos to watch. Maybe it's a good time to take a break?" }) })] }), _jsxs(Button, { testID: "videoFeedGoBackButton", onPress: function () {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    }
                    else {
                        navigation.navigate('Home');
                    }
                }, variant: "solid", color: "secondary_inverted", size: "small", label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Go back"], ["Go back"])))), accessibilityHint: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Returns to previous page"], ["Returns to previous page"])))), children: [_jsx(ButtonIcon, { icon: ArrowLeftIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Go back" }) })] })] }));
}
/*
 * If the video is taller than 9:16
 */
function isTallAspectRatio(aspectRatio) {
    var _a, _b;
    var videoAspectRatio = ((_a = aspectRatio === null || aspectRatio === void 0 ? void 0 : aspectRatio.width) !== null && _a !== void 0 ? _a : 1) / ((_b = aspectRatio === null || aspectRatio === void 0 ? void 0 : aspectRatio.height) !== null && _b !== void 0 ? _b : 1);
    return videoAspectRatio <= 9 / 16;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14;
