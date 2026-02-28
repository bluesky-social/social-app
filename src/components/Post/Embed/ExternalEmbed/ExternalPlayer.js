var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View, } from 'react-native';
import Animated, { measure, runOnJS, useAnimatedRef, useFrameCallback, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { getPlayerAspect, } from '#/lib/strings/embed-player';
import { useExternalEmbedsPrefs } from '#/state/preferences';
import { EventStopper } from '#/view/com/util/EventStopper';
import { atoms as a, useTheme } from '#/alf';
import { useDialogControl } from '#/components/Dialog';
import { EmbedConsentDialog } from '#/components/dialogs/EmbedConsent';
import { Fill } from '#/components/Fill';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
import { IS_NATIVE } from '#/env';
// This renders the overlay when the player is either inactive or loading as a separate layer
function PlaceholderOverlay(_a) {
    var isLoading = _a.isLoading, isPlayerActive = _a.isPlayerActive, onPress = _a.onPress;
    var _ = useLingui()._;
    // If the player is active and not loading, we don't want to show the overlay.
    if (isPlayerActive && !isLoading)
        return null;
    return (_jsx(View, { style: [a.absolute, a.inset_0, styles.overlayLayer], children: _jsx(Pressable, { accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Play Video"], ["Play Video"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Plays the video"], ["Plays the video"])))), onPress: onPress, style: [styles.overlayContainer], children: !isPlayerActive ? (_jsx(PlayButtonIcon, {})) : (_jsx(ActivityIndicator, { size: "large", color: "white" })) }) }));
}
// This renders the webview/youtube player as a separate layer
function Player(_a) {
    var params = _a.params, onLoad = _a.onLoad, isPlayerActive = _a.isPlayerActive;
    // ensures we only load what's requested
    // when it's a youtube video, we need to allow both bsky.app and youtube.com
    var onShouldStartLoadWithRequest = React.useCallback(function (event) {
        return event.url === params.playerUri ||
            (params.source.startsWith('youtube') &&
                event.url.includes('www.youtube.com'));
    }, [params.playerUri, params.source]);
    // Don't show the player until it is active
    if (!isPlayerActive)
        return null;
    return (_jsx(EventStopper, { style: [a.absolute, a.inset_0, styles.playerLayer], children: _jsx(WebView, { javaScriptEnabled: true, onShouldStartLoadWithRequest: onShouldStartLoadWithRequest, mediaPlaybackRequiresUserAction: false, allowsInlineMediaPlayback: true, bounces: false, allowsFullscreenVideo: true, nestedScrollEnabled: true, source: { uri: params.playerUri }, onLoad: onLoad, style: styles.webview, setSupportMultipleWindows: false }) }));
}
// This renders the player area and handles the logic for when to show the player and when to show the overlay
export function ExternalPlayer(_a) {
    var link = _a.link, params = _a.params;
    var t = useTheme();
    var navigation = useNavigation();
    var insets = useSafeAreaInsets();
    var windowDims = useWindowDimensions();
    var externalEmbedsPrefs = useExternalEmbedsPrefs();
    var consentDialogControl = useDialogControl();
    var _b = React.useState(false), isPlayerActive = _b[0], setPlayerActive = _b[1];
    var _c = React.useState(true), isLoading = _c[0], setIsLoading = _c[1];
    var aspect = React.useMemo(function () {
        return getPlayerAspect({
            type: params.type,
            width: windowDims.width,
            hasThumb: !!link.thumb,
        });
    }, [params.type, windowDims.width, link.thumb]);
    var viewRef = useAnimatedRef();
    var frameCallback = useFrameCallback(function () {
        var measurement = measure(viewRef);
        if (!measurement)
            return;
        var winHeight = windowDims.height, winWidth = windowDims.width;
        // Get the proper screen height depending on what is going on
        var realWinHeight = IS_NATIVE // If it is native, we always want the larger number
            ? winHeight > winWidth
                ? winHeight
                : winWidth
            : winHeight; // On web, we always want the actual screen height
        var top = measurement.pageY;
        var bot = measurement.pageY + measurement.height;
        // We can use the same logic on all platforms against the screenHeight that we get above
        var isVisible = top <= realWinHeight - insets.bottom && bot >= insets.top;
        if (!isVisible) {
            runOnJS(setPlayerActive)(false);
        }
    }, false); // False here disables autostarting the callback
    // watch for leaving the viewport due to scrolling
    React.useEffect(function () {
        // We don't want to do anything if the player isn't active
        if (!isPlayerActive)
            return;
        // Interval for scrolling works in most cases, However, for twitch embeds, if we navigate away from the screen the webview will
        // continue playing. We need to watch for the blur event
        var unsubscribe = navigation.addListener('blur', function () {
            setPlayerActive(false);
        });
        // Start watching for changes
        frameCallback.setActive(true);
        return function () {
            unsubscribe();
            frameCallback.setActive(false);
        };
    }, [navigation, isPlayerActive, frameCallback]);
    var onLoad = React.useCallback(function () {
        setIsLoading(false);
    }, []);
    var onPlayPress = React.useCallback(function (event) {
        // Prevent this from propagating upward on web
        event.preventDefault();
        if ((externalEmbedsPrefs === null || externalEmbedsPrefs === void 0 ? void 0 : externalEmbedsPrefs[params.source]) === undefined) {
            consentDialogControl.open();
            return;
        }
        setPlayerActive(true);
    }, [externalEmbedsPrefs, consentDialogControl, params.source]);
    var onAcceptConsent = React.useCallback(function () {
        setPlayerActive(true);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(EmbedConsentDialog, { control: consentDialogControl, source: params.source, onAccept: onAcceptConsent }), _jsxs(Animated.View, { ref: viewRef, collapsable: false, style: [aspect, a.overflow_hidden], children: [link.thumb && (!isPlayerActive || isLoading) ? (_jsxs(_Fragment, { children: [_jsx(Image, { style: [a.flex_1], source: { uri: link.thumb }, accessibilityIgnoresInvertColors: true, loading: "lazy" }), _jsx(Fill, { style: [
                                    t.name === 'light' ? t.atoms.bg_contrast_975 : t.atoms.bg,
                                    {
                                        opacity: 0.3,
                                    },
                                ] })] })) : (_jsx(Fill, { style: [
                            {
                                backgroundColor: t.name === 'light' ? t.palette.contrast_975 : 'black',
                                opacity: 0.3,
                            },
                        ] })), _jsx(PlaceholderOverlay, { isLoading: isLoading, isPlayerActive: isPlayerActive, onPress: onPlayPress }), _jsx(Player, { isPlayerActive: isPlayerActive, params: params, onLoad: onLoad })] })] }));
}
var styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayLayer: {
        zIndex: 2,
    },
    playerLayer: {
        zIndex: 3,
    },
    webview: {
        backgroundColor: 'transparent',
    },
    gifContainer: {
        width: '100%',
        overflow: 'hidden',
    },
});
var templateObject_1, templateObject_2;
