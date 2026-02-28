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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { runOnJS, scrollTo, useAnimatedRef, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { AppBskyRichtextFacet, RichText, } from '@atproto/api';
import { useHideBottomBarBorderForScreen } from '#/lib/hooks/useHideBottomBarBorder';
import { ScrollProvider } from '#/lib/ScrollContext';
import { shortenLinks, stripInvalidMentions } from '#/lib/strings/rich-text-manip';
import { convertBskyAppUrlIfNeeded, isBskyPostUrl, } from '#/lib/strings/url-helpers';
import { logger } from '#/logger';
import { isConvoActive, useConvoActive, } from '#/state/messages/convo';
import { ConvoStatus, } from '#/state/messages/convo/types';
import { useGetPost } from '#/state/queries/post';
import { useAgent } from '#/state/session';
import { useShellLayout } from '#/state/shell/shell-layout';
import { EmojiPicker, } from '#/view/com/composer/text-input/web/EmojiPicker';
import { List } from '#/view/com/util/List';
import { ChatDisabled } from '#/screens/Messages/components/ChatDisabled';
import { MessageInput } from '#/screens/Messages/components/MessageInput';
import { MessageListError } from '#/screens/Messages/components/MessageListError';
import { ChatEmptyPill } from '#/components/dms/ChatEmptyPill';
import { MessageItem } from '#/components/dms/MessageItem';
import { NewMessagesPill } from '#/components/dms/NewMessagesPill';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { IS_WEB } from '#/env';
import { ChatStatusInfo } from './ChatStatusInfo';
import { MessageInputEmbed, useMessageEmbed } from './MessageInputEmbed';
function MaybeLoader(_a) {
    var isLoading = _a.isLoading;
    return (_jsx(View, { style: {
            height: 50,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        }, children: isLoading && _jsx(Loader, { size: "xl" }) }));
}
function renderItem(_a) {
    var item = _a.item;
    if (item.type === 'message' || item.type === 'pending-message') {
        return _jsx(MessageItem, { item: item });
    }
    else if (item.type === 'deleted-message') {
        return _jsx(Text, { children: "Deleted message" });
    }
    else if (item.type === 'error') {
        return _jsx(MessageListError, { item: item });
    }
    return null;
}
function keyExtractor(item) {
    return item.key;
}
function onScrollToIndexFailed() {
    // Placeholder function. You have to give FlatList something or else it will error.
}
export function MessagesList(_a) {
    var _this = this;
    var hasScrolled = _a.hasScrolled, setHasScrolled = _a.setHasScrolled, blocked = _a.blocked, footer = _a.footer, hasAcceptOverride = _a.hasAcceptOverride;
    var convoState = useConvoActive();
    var agent = useAgent();
    var getPost = useGetPost();
    var _b = useMessageEmbed(), embedUri = _b.embedUri, setEmbed = _b.setEmbed;
    useHideBottomBarBorderForScreen();
    var flatListRef = useAnimatedRef();
    var _c = useState({
        show: false,
        startContentOffset: 0,
    }), newMessagesPill = _c[0], setNewMessagesPill = _c[1];
    var _d = useState({
        isOpen: false,
        pos: { top: 0, left: 0, right: 0, bottom: 0, nextFocusRef: null },
    }), emojiPickerState = _d[0], setEmojiPickerState = _d[1];
    // We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
    // are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
    // the bottom.
    var isAtBottom = useSharedValue(true);
    // This will be used on web to assist in determining if we need to maintain the content offset
    var isAtTop = useSharedValue(true);
    // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
    // onStartReached to fire.
    var prevContentHeight = useRef(0);
    var prevItemCount = useRef(0);
    // -- Keep track of background state and positioning for new pill
    var layoutHeight = useSharedValue(0);
    var didBackground = useRef(false);
    useEffect(function () {
        if (convoState.status === ConvoStatus.Backgrounded) {
            didBackground.current = true;
        }
    }, [convoState.status]);
    // -- Scroll handling
    // Every time the content size changes, that means one of two things is happening:
    // 1. New messages are being added from the log or from a message you have sent
    // 2. Old messages are being prepended to the top
    //
    // The first time that the content size changes is when the initial items are rendered. Because we cannot rely on
    // `initialScrollIndex`, we need to immediately scroll to the bottom of the list. That scroll will not be animated.
    //
    // Subsequent resizes will only scroll to the bottom if the user is at the bottom of the list (within 100 pixels of
    // the bottom). Therefore, any new messages that come in or are sent will result in an animated scroll to end. However
    // we will not scroll whenever new items get prepended to the top.
    var onContentSizeChange = useCallback(function (_, height) {
        var _a, _b, _c;
        // Because web does not have `maintainVisibleContentPosition` support, we will need to manually scroll to the
        // previous off whenever we add new content to the previous offset whenever we add new content to the list.
        if (IS_WEB && isAtTop.get() && hasScrolled) {
            (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
                offset: height - prevContentHeight.current,
                animated: false,
            });
        }
        // This number _must_ be the height of the MaybeLoader component
        if (height > 50 && isAtBottom.get()) {
            // If the size of the content is changing by more than the height of the screen, then we don't
            // want to scroll further than the start of all the new content. Since we are storing the previous offset,
            // we can just scroll the user to that offset and add a little bit of padding. We'll also show the pill
            // that can be pressed to immediately scroll to the end.
            if (didBackground.current &&
                hasScrolled &&
                height - prevContentHeight.current > layoutHeight.get() - 50 &&
                convoState.items.length - prevItemCount.current > 1) {
                (_b = flatListRef.current) === null || _b === void 0 ? void 0 : _b.scrollToOffset({
                    offset: prevContentHeight.current - 65,
                    animated: true,
                });
                setNewMessagesPill({
                    show: true,
                    startContentOffset: prevContentHeight.current - 65,
                });
            }
            else {
                (_c = flatListRef.current) === null || _c === void 0 ? void 0 : _c.scrollToOffset({
                    offset: height,
                    animated: hasScrolled && height > prevContentHeight.current,
                });
                // HACK Unfortunately, we need to call `setHasScrolled` after a brief delay,
                // because otherwise there is too much of a delay between the time the content
                // scrolls and the time the screen appears, causing a flicker.
                // We cannot actually use a synchronous scroll here, because `onContentSizeChange`
                // is actually async itself - all the info has to come across the bridge first.
                if (!hasScrolled && !convoState.isFetchingHistory) {
                    setTimeout(function () {
                        setHasScrolled(true);
                    }, 100);
                }
            }
        }
        prevContentHeight.current = height;
        prevItemCount.current = convoState.items.length;
        didBackground.current = false;
    }, [
        hasScrolled,
        setHasScrolled,
        convoState.isFetchingHistory,
        convoState.items.length,
        // these are stable
        flatListRef,
        isAtTop,
        isAtBottom,
        layoutHeight,
    ]);
    var onStartReached = useCallback(function () {
        if (hasScrolled && prevContentHeight.current > layoutHeight.get()) {
            convoState.fetchMessageHistory();
        }
    }, [convoState, hasScrolled, layoutHeight]);
    var onScroll = useCallback(function (e) {
        'worklet';
        layoutHeight.set(e.layoutMeasurement.height);
        var bottomOffset = e.contentOffset.y + e.layoutMeasurement.height;
        // Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
        // when a new message is added, hence the 100 pixel offset
        isAtBottom.set(e.contentSize.height - 100 < bottomOffset);
        isAtTop.set(e.contentOffset.y <= 1);
        if (newMessagesPill.show &&
            (e.contentOffset.y > newMessagesPill.startContentOffset + 200 ||
                isAtBottom.get())) {
            runOnJS(setNewMessagesPill)({
                show: false,
                startContentOffset: 0,
            });
        }
    }, [layoutHeight, newMessagesPill, isAtBottom, isAtTop]);
    // -- Keyboard animation handling
    var footerHeight = useShellLayout().footerHeight;
    var keyboardHeight = useSharedValue(0);
    var keyboardIsOpening = useSharedValue(false);
    // In some cases - like when the emoji piker opens - we don't want to animate the scroll in the list onLayout event.
    // We use this value to keep track of when we want to disable the animation.
    var layoutScrollWithoutAnimation = useSharedValue(false);
    useKeyboardHandler({
        onStart: function (e) {
            'worklet';
            // Immediate updates - like opening the emoji picker - will have a duration of zero. In those cases, we should
            // just update the height here instead of having the `onMove` event do it (that event will not fire!)
            if (e.duration === 0) {
                layoutScrollWithoutAnimation.set(true);
                keyboardHeight.set(e.height);
            }
            else {
                keyboardIsOpening.set(true);
            }
        },
        onMove: function (e) {
            'worklet';
            keyboardHeight.set(e.height);
            if (e.height > footerHeight.get()) {
                scrollTo(flatListRef, 0, 1e7, false);
            }
        },
        onEnd: function (e) {
            'worklet';
            keyboardHeight.set(e.height);
            if (e.height > footerHeight.get()) {
                scrollTo(flatListRef, 0, 1e7, false);
            }
            keyboardIsOpening.set(false);
        },
    }, [footerHeight]);
    var animatedListStyle = useAnimatedStyle(function () { return ({
        marginBottom: Math.max(keyboardHeight.get(), footerHeight.get()),
    }); });
    var animatedStickyViewStyle = useAnimatedStyle(function () { return ({
        transform: [
            { translateY: -Math.max(keyboardHeight.get(), footerHeight.get()) },
        ],
    }); });
    // -- Message sending
    var onSendMessage = useCallback(function (text) { return __awaiter(_this, void 0, void 0, function () {
        var rt, embed, post_1, postLinkFacet, isAtStart, isAtEnd, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    rt = new RichText({ text: text.trimEnd() }, { cleanNewlines: true });
                    // detect facets without resolution first - this is used to see if there's
                    // any post links in the text that we can embed. We do this first because
                    // we want to remove the post link from the text, re-trim, then detect facets
                    rt.detectFacetsWithoutResolution();
                    if (!embedUri) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getPost({ uri: embedUri })];
                case 2:
                    post_1 = _b.sent();
                    if (post_1) {
                        embed = {
                            $type: 'app.bsky.embed.record',
                            record: {
                                uri: post_1.uri,
                                cid: post_1.cid,
                            },
                        };
                        postLinkFacet = (_a = rt.facets) === null || _a === void 0 ? void 0 : _a.find(function (facet) {
                            return facet.features.find(function (feature) {
                                if (AppBskyRichtextFacet.isLink(feature)) {
                                    if (isBskyPostUrl(feature.uri)) {
                                        var url = convertBskyAppUrlIfNeeded(feature.uri);
                                        var _a = url.split('/').filter(Boolean), _0 = _a[0], _1 = _a[1], _2 = _a[2], rkey = _a[3];
                                        // this might have a handle instead of a DID
                                        // so just compare the rkey - not particularly dangerous
                                        return post_1.uri.endsWith(rkey);
                                    }
                                }
                                return false;
                            });
                        });
                        if (postLinkFacet) {
                            isAtStart = postLinkFacet.index.byteStart === 0;
                            isAtEnd = postLinkFacet.index.byteEnd === rt.unicodeText.graphemeLength;
                            // remove the post link from the text
                            if (isAtStart || isAtEnd) {
                                rt.delete(postLinkFacet.index.byteStart, postLinkFacet.index.byteEnd);
                            }
                            rt = new RichText({ text: rt.text.trim() }, { cleanNewlines: true });
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    logger.error('Failed to get post as quote for DM', { error: error_1 });
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, rt.detectFacets(agent)];
                case 5:
                    _b.sent();
                    rt = shortenLinks(rt);
                    rt = stripInvalidMentions(rt);
                    if (!hasScrolled) {
                        setHasScrolled(true);
                    }
                    convoState.sendMessage({
                        text: rt.text,
                        facets: rt.facets,
                        embed: embed,
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [agent, convoState, embedUri, getPost, hasScrolled, setHasScrolled]);
    // -- List layout changes (opening emoji keyboard, etc.)
    var onListLayout = useCallback(function (e) {
        var _a;
        layoutHeight.set(e.nativeEvent.layout.height);
        if (IS_WEB || !keyboardIsOpening.get()) {
            (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({
                animated: !layoutScrollWithoutAnimation.get(),
            });
            layoutScrollWithoutAnimation.set(false);
        }
    }, [
        flatListRef,
        keyboardIsOpening,
        layoutScrollWithoutAnimation,
        layoutHeight,
    ]);
    var scrollToEndOnPress = useCallback(function () {
        var _a;
        (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            offset: prevContentHeight.current,
            animated: true,
        });
    }, [flatListRef]);
    var onOpenEmojiPicker = useCallback(function (pos) {
        setEmojiPickerState({ isOpen: true, pos: pos });
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ScrollProvider, { onScroll: onScroll, children: _jsx(List, { ref: flatListRef, data: convoState.items, renderItem: renderItem, keyExtractor: keyExtractor, disableFullWindowScroll: true, disableVirtualization: true, style: animatedListStyle, 
                    // The extra two items account for the header and the footer components
                    initialNumToRender: IS_NATIVE ? 32 : 62, maxToRenderPerBatch: IS_WEB ? 32 : 62, keyboardDismissMode: "on-drag", keyboardShouldPersistTaps: "handled", maintainVisibleContentPosition: {
                        minIndexForVisible: 0,
                    }, removeClippedSubviews: false, sideBorders: false, onContentSizeChange: onContentSizeChange, onLayout: onListLayout, onStartReached: onStartReached, onScrollToIndexFailed: onScrollToIndexFailed, scrollEventThrottle: 100, ListHeaderComponent: _jsx(MaybeLoader, { isLoading: convoState.isFetchingHistory }) }) }), _jsx(Animated.View, { style: animatedStickyViewStyle, children: convoState.status === ConvoStatus.Disabled ? (_jsx(ChatDisabled, {})) : blocked ? (footer) : (_jsx(ConversationFooter, { convoState: convoState, hasAcceptOverride: hasAcceptOverride, children: _jsx(MessageInput, { onSendMessage: onSendMessage, hasEmbed: !!embedUri, setEmbed: setEmbed, openEmojiPicker: onOpenEmojiPicker, children: _jsx(MessageInputEmbed, { embedUri: embedUri, setEmbed: setEmbed }) }) })) }), IS_WEB && (_jsx(EmojiPicker, { pinToTop: true, state: emojiPickerState, close: function () { return setEmojiPickerState(function (prev) { return (__assign(__assign({}, prev), { isOpen: false })); }); } })), newMessagesPill.show && _jsx(NewMessagesPill, { onPress: scrollToEndOnPress })] }));
}
function getFooterState(convoState, hasAcceptOverride) {
    if (convoState.items.length === 0) {
        if (convoState.isFetchingHistory) {
            return 'loading';
        }
        else {
            return 'new-chat';
        }
    }
    if (convoState.convo.status === 'request' && !hasAcceptOverride) {
        return 'request';
    }
    return 'standard';
}
function ConversationFooter(_a) {
    var convoState = _a.convoState, hasAcceptOverride = _a.hasAcceptOverride, children = _a.children;
    if (!isConvoActive(convoState)) {
        return null;
    }
    var footerState = getFooterState(convoState, hasAcceptOverride);
    switch (footerState) {
        case 'loading':
            return null;
        case 'new-chat':
            return (_jsxs(_Fragment, { children: [_jsx(ChatEmptyPill, {}), children] }));
        case 'request':
            return _jsx(ChatStatusInfo, { convoState: convoState });
        case 'standard':
            return children;
    }
}
