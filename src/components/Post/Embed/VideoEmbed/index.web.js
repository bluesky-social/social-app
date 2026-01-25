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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useRef, useState, } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { atoms as a, useTheme } from '#/alf';
import { useIsWithinMessage } from '#/components/dms/MessageContext';
import { useFullscreen } from '#/components/hooks/useFullscreen';
import { ConstrainedImage } from '#/components/images/AutoSizedImage';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { HLSUnsupportedError, VideoEmbedInnerWeb, VideoNotFoundError, } from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb';
import { IS_WEB_FIREFOX } from '#/env';
import { useActiveVideoWeb } from './ActiveVideoWebContext';
import * as VideoFallback from './VideoEmbedInner/VideoFallback';
export function VideoEmbed(_a) {
    var embed = _a.embed;
    var t = useTheme();
    var ref = useRef(null);
    var _b = useActiveVideoWeb(), active = _b.active, setActive = _b.setActive, sendPosition = _b.sendPosition, currentActiveView = _b.currentActiveView;
    var _c = useState(false), onScreen = _c[0], setOnScreen = _c[1];
    var isFullscreen = useFullscreen()[0];
    var lastKnownTime = useRef(undefined);
    useEffect(function () {
        if (!ref.current)
            return;
        if (isFullscreen && !IS_WEB_FIREFOX)
            return;
        var observer = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            if (!entry)
                return;
            setOnScreen(entry.isIntersecting);
            sendPosition(entry.boundingClientRect.y + entry.boundingClientRect.height / 2);
        }, { threshold: 0.5 });
        observer.observe(ref.current);
        return function () { return observer.disconnect(); };
    }, [sendPosition, isFullscreen]);
    var _d = useState(0), key = _d[0], setKey = _d[1];
    var renderError = useCallback(function (error) { return (_jsx(VideoError, { error: error, retry: function () { return setKey(key + 1); } })); }, [key]);
    var aspectRatio;
    var dims = embed.aspectRatio;
    if (dims) {
        aspectRatio = dims.width / dims.height;
        if (Number.isNaN(aspectRatio)) {
            aspectRatio = undefined;
        }
    }
    var constrained;
    if (aspectRatio !== undefined) {
        var ratio = 1 / 2; // max of 1:2 ratio in feeds
        constrained = Math.max(aspectRatio, ratio);
    }
    var contents = (_jsx("div", { ref: ref, style: {
            display: 'flex',
            flex: 1,
            cursor: 'default',
            backgroundColor: t.palette.black,
            backgroundImage: "url(".concat(embed.thumbnail, ")"),
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }, onClick: function (evt) { return evt.stopPropagation(); }, children: _jsx(ErrorBoundary, { renderError: renderError, children: _jsx(OnlyNearScreen, { children: _jsx(VideoEmbedInnerWeb, { embed: embed, active: active, setActive: setActive, onScreen: onScreen, lastKnownTime: lastKnownTime }) }) }, key) }));
    return (_jsx(View, { style: [a.pt_xs], children: _jsx(ViewportObserver, { sendPosition: sendPosition, isAnyViewActive: currentActiveView !== null, children: _jsxs(ConstrainedImage, { fullBleed: true, aspectRatio: constrained || 1, 
                // slightly smaller max height than images
                // images use 16 / 9, for reference
                minMobileAspectRatio: 14 / 9, children: [contents, _jsx(MediaInsetBorder, {})] }) }) }));
}
var NearScreenContext = createContext(false);
NearScreenContext.displayName = 'VideoNearScreenContext';
/**
 * Renders a 100vh tall div and watches it with an IntersectionObserver to
 * send the position of the div when it's near the screen.
 *
 * IMPORTANT: ViewportObserver _must_ not be within a `overflow: hidden` container.
 */
function ViewportObserver(_a) {
    var children = _a.children, sendPosition = _a.sendPosition, isAnyViewActive = _a.isAnyViewActive;
    var ref = useRef(null);
    var _b = useState(false), nearScreen = _b[0], setNearScreen = _b[1];
    var isFullscreen = useFullscreen()[0];
    var isWithinMessage = useIsWithinMessage();
    // Send position when scrolling. This is done with an IntersectionObserver
    // observing a div of 100vh height
    useEffect(function () {
        if (!ref.current)
            return;
        if (isFullscreen && !IS_WEB_FIREFOX)
            return;
        var observer = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            if (!entry)
                return;
            var position = entry.boundingClientRect.y + entry.boundingClientRect.height / 2;
            sendPosition(position);
            setNearScreen(entry.isIntersecting);
        }, { threshold: Array.from({ length: 101 }, function (_, i) { return i / 100; }) });
        observer.observe(ref.current);
        return function () { return observer.disconnect(); };
    }, [sendPosition, isFullscreen]);
    // In case scrolling hasn't started yet, send up the position
    useEffect(function () {
        if (ref.current && !isAnyViewActive) {
            var rect = ref.current.getBoundingClientRect();
            var position = rect.y + rect.height / 2;
            sendPosition(position);
        }
    }, [isAnyViewActive, sendPosition]);
    return (_jsxs(View, { style: [a.flex_1, a.flex_row], children: [_jsx(NearScreenContext.Provider, { value: nearScreen, children: children }), _jsx("div", { ref: ref, style: __assign(__assign({}, (isWithinMessage
                    ? { top: 0, height: '100%' }
                    : { top: 'calc(50% - 50vh)', height: '100vh' })), { position: 'absolute', left: '50%', width: 1, pointerEvents: 'none' }) })] }));
}
/**
 * Awkward data flow here, but we need to hide the video when it's not near the screen.
 * But also, ViewportObserver _must_ not be within a `overflow: hidden` container.
 * So we put it at the top level of the component tree here, then hide the children of
 * the auto-resizing container.
 */
export var OnlyNearScreen = function (_a) {
    var children = _a.children;
    var nearScreen = useContext(NearScreenContext);
    return nearScreen ? children : null;
};
function VideoError(_a) {
    var error = _a.error, retry = _a.retry;
    var _ = useLingui()._;
    var showRetryButton = true;
    var text = null;
    if (error instanceof VideoNotFoundError) {
        text = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Video not found."], ["Video not found."]))));
    }
    else if (error instanceof HLSUnsupportedError) {
        showRetryButton = false;
        text = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Your browser does not support the video format. Please try a different browser."], ["Your browser does not support the video format. Please try a different browser."]))));
    }
    else {
        text = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["An error occurred while loading the video. Please try again."], ["An error occurred while loading the video. Please try again."]))));
    }
    return (_jsxs(VideoFallback.Container, { children: [_jsx(VideoFallback.Text, { children: text }), showRetryButton && _jsx(VideoFallback.RetryButton, { onPress: retry })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
