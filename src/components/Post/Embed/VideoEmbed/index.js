var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ImageBackground } from 'expo-image';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { atoms as a } from '#/alf';
import { Button } from '#/components/Button';
import { useThrottledValue } from '#/components/hooks/useThrottledValue';
import { ConstrainedImage } from '#/components/images/AutoSizedImage';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';
import { VideoEmbedInnerNative } from './VideoEmbedInner/VideoEmbedInnerNative';
import * as VideoFallback from './VideoEmbedInner/VideoFallback';
export function VideoEmbed(_a) {
    var embed = _a.embed;
    var _b = useState(0), key = _b[0], setKey = _b[1];
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
    var contents = (_jsx(ErrorBoundary, { renderError: renderError, children: _jsx(InnerWrapper, { embed: embed }) }, key));
    return (_jsx(View, { style: [a.pt_xs], children: _jsx(ConstrainedImage, { aspectRatio: constrained || 1, 
            // slightly smaller max height than images
            // images use 16 / 9, for reference
            minMobileAspectRatio: 14 / 9, children: contents }) }));
}
function InnerWrapper(_a) {
    var embed = _a.embed;
    var _ = useLingui()._;
    var ref = useRef(null);
    var _b = useState('pending'), status = _b[0], setStatus = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(false), isActive = _d[0], setIsActive = _d[1];
    var showSpinner = useThrottledValue(isActive && isLoading, 100);
    var showOverlay = !isActive ||
        isLoading ||
        (status === 'paused' && !isActive) ||
        status === 'pending';
    if (!isActive && status !== 'pending') {
        setStatus('pending');
    }
    return (_jsxs(_Fragment, { children: [_jsx(VideoEmbedInnerNative, { embed: embed, setStatus: setStatus, setIsLoading: setIsLoading, setIsActive: setIsActive, ref: ref }), _jsx(ImageBackground, { source: { uri: embed.thumbnail }, accessibilityIgnoresInvertColors: true, style: [
                    a.absolute,
                    a.inset_0,
                    {
                        backgroundColor: 'transparent', // If you don't add `backgroundColor` to the styles here,
                        // the play button won't show up on the first render on android 🥴😮‍💨
                        display: showOverlay ? 'flex' : 'none',
                    },
                ], cachePolicy: "memory-disk" // Preferring memory cache helps to avoid flicker when re-displaying on android
                , children: showOverlay && (_jsx(Button, { style: [a.flex_1, a.align_center, a.justify_center], onPress: function () {
                        var _a;
                        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.togglePlayback();
                    }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Play video"], ["Play video"])))), children: showSpinner ? (_jsx(View, { style: [
                            a.rounded_full,
                            a.p_xs,
                            a.align_center,
                            a.justify_center,
                        ], children: _jsx(ActivityIndicator, { size: "large", color: "white" }) })) : (_jsx(PlayButtonIcon, {})) })) })] }));
}
function VideoError(_a) {
    var retry = _a.retry;
    return (_jsxs(VideoFallback.Container, { children: [_jsx(VideoFallback.Text, { children: _jsx(Trans, { children: "An error occurred while loading the video. Please try again later." }) }), _jsx(VideoFallback.RetryButton, { onPress: retry })] }));
}
var templateObject_1;
