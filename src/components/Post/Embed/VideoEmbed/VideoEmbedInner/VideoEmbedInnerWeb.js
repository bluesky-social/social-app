var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { atoms as a } from '#/alf';
import * as BandwidthEstimate from './bandwidth-estimate';
import { Controls } from './web-controls/VideoControls';
export function VideoEmbedInnerWeb(_a) {
    var embed = _a.embed, active = _a.active, setActive = _a.setActive, onScreen = _a.onScreen, lastKnownTime = _a.lastKnownTime;
    var containerRef = useRef(null);
    var videoRef = useRef(null);
    var _b = useState(false), focused = _b[0], setFocused = _b[1];
    var _c = useState(false), hasSubtitleTrack = _c[0], setHasSubtitleTrack = _c[1];
    var _d = useState(false), hlsLoading = _d[0], setHlsLoading = _d[1];
    var figId = useId();
    var _ = useLingui()._;
    // send error up to error boundary
    var _e = useState(null), error = _e[0], setError = _e[1];
    if (error) {
        throw error;
    }
    var _f = useHLS({
        playlist: embed.playlist,
        setHasSubtitleTrack: setHasSubtitleTrack,
        setError: setError,
        videoRef: videoRef,
        setHlsLoading: setHlsLoading,
    }), hlsRef = _f.hlsRef, loop = _f.loop;
    useEffect(function () {
        if (lastKnownTime.current && videoRef.current) {
            videoRef.current.currentTime = lastKnownTime.current;
        }
    }, [lastKnownTime]);
    return (_jsx(View, { style: [a.flex_1, a.rounded_md, a.overflow_hidden], accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Embedded video player"], ["Embedded video player"])))), accessibilityHint: "", children: _jsxs("div", { ref: containerRef, style: { height: '100%', width: '100%' }, children: [_jsxs("figure", { style: { margin: 0, position: 'absolute', inset: 0 }, children: [_jsx("video", { ref: videoRef, poster: embed.thumbnail, style: { width: '100%', height: '100%', objectFit: 'contain' }, playsInline: true, preload: "none", muted: embed.presentation === 'gif' || !focused, "aria-labelledby": embed.alt ? figId : undefined, onTimeUpdate: function (e) {
                                lastKnownTime.current = e.currentTarget.currentTime;
                            }, loop: loop }), embed.alt && (_jsx("figcaption", { id: figId, style: a.sr_only, children: embed.alt }))] }), _jsx(Controls, { videoRef: videoRef, hlsRef: hlsRef, active: active, setActive: setActive, focused: focused, setFocused: setFocused, hlsLoading: hlsLoading, onScreen: onScreen, fullscreenRef: containerRef, hasSubtitleTrack: hasSubtitleTrack, isGif: embed.presentation === 'gif', altText: embed.alt })] }) }));
}
var HLSUnsupportedError = /** @class */ (function (_super) {
    __extends(HLSUnsupportedError, _super);
    function HLSUnsupportedError() {
        return _super.call(this, 'HLS is not supported') || this;
    }
    return HLSUnsupportedError;
}(Error));
export { HLSUnsupportedError };
var VideoNotFoundError = /** @class */ (function (_super) {
    __extends(VideoNotFoundError, _super);
    function VideoNotFoundError() {
        return _super.call(this, 'Video not found') || this;
    }
    return VideoNotFoundError;
}(Error));
export { VideoNotFoundError };
var promiseForHls = import(
// @ts-ignore
'hls.js/dist/hls.min').then(function (mod) { return mod.default; });
promiseForHls.value = undefined;
promiseForHls.then(function (Hls) {
    promiseForHls.value = Hls;
});
function useHLS(_a) {
    var playlist = _a.playlist, setHasSubtitleTrack = _a.setHasSubtitleTrack, setError = _a.setError, videoRef = _a.videoRef, setHlsLoading = _a.setHlsLoading;
    var _b = useState(function () { return promiseForHls.value; }), Hls = _b[0], setHls = _b[1];
    useEffect(function () {
        if (!Hls) {
            setHlsLoading(true);
            promiseForHls.then(function (loadedHls) {
                setHls(function () { return loadedHls; });
                setHlsLoading(false);
            });
        }
    }, [Hls, setHlsLoading]);
    var hlsRef = useRef(undefined);
    var _c = useState([]), lowQualityFragments = _c[0], setLowQualityFragments = _c[1];
    // purge low quality segments from buffer on next frag change
    var handleFragChange = useNonReactiveCallback(function (_event, _a) {
        var frag = _a.frag;
        if (!Hls)
            return;
        if (!hlsRef.current)
            return;
        var hls = hlsRef.current;
        // if the current quality level goes above 0, flush the low quality segments
        if (hls.nextAutoLevel > 0) {
            var flushed_1 = [];
            for (var _i = 0, lowQualityFragments_1 = lowQualityFragments; _i < lowQualityFragments_1.length; _i++) {
                var lowQualFrag = lowQualityFragments_1[_i];
                // avoid if close to the current fragment
                if (Math.abs(frag.start - lowQualFrag.start) < 0.1) {
                    continue;
                }
                hls.trigger(Hls.Events.BUFFER_FLUSHING, {
                    startOffset: lowQualFrag.start,
                    endOffset: lowQualFrag.end,
                    type: 'video',
                });
                flushed_1.push(lowQualFrag);
            }
            setLowQualityFragments(function (prev) { return prev.filter(function (f) { return !flushed_1.includes(f); }); });
        }
    });
    useEffect(function () {
        if (!videoRef.current)
            return;
        if (!Hls)
            return;
        if (!Hls.isSupported()) {
            throw new HLSUnsupportedError();
        }
        var latestEstimate = BandwidthEstimate.get();
        var hls = new Hls({
            maxMaxBufferLength: 10, // only load 10s ahead
            // note: the amount buffered is affected by both maxBufferLength and maxBufferSize
            // it will buffer until it is greater than *both* of those values
            // so we use maxMaxBufferLength to set the actual maximum amount of buffering instead
            startLevel: latestEstimate === undefined ? -1 : Hls.DefaultConfig.startLevel,
            // the '-1' value makes a test request to estimate bandwidth and quality level
            // before showing the first fragment
        });
        hlsRef.current = hls;
        if (latestEstimate !== undefined) {
            hls.bandwidthEstimate = latestEstimate;
        }
        hls.attachMedia(videoRef.current);
        hls.loadSource(playlist);
        hls.on(Hls.Events.FRAG_LOADED, function () {
            BandwidthEstimate.set(hls.bandwidthEstimate);
        });
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, function (_event, data) {
            if (data.subtitleTracks.length > 0) {
                setHasSubtitleTrack(true);
            }
        });
        hls.on(Hls.Events.FRAG_BUFFERED, function (_event, _a) {
            var frag = _a.frag;
            if (frag.level === 0) {
                setLowQualityFragments(function (prev) { return __spreadArray(__spreadArray([], prev, true), [frag], false); });
            }
        });
        hls.on(Hls.Events.ERROR, function (_event, data) {
            var _a;
            if (data.fatal) {
                if (data.details === 'manifestLoadError' &&
                    ((_a = data.response) === null || _a === void 0 ? void 0 : _a.code) === 404) {
                    setError(new VideoNotFoundError());
                }
                else {
                    setError(data.error);
                }
            }
            else {
                console.error(data.error);
            }
        });
        hls.on(Hls.Events.FRAG_CHANGED, handleFragChange);
        return function () {
            hlsRef.current = undefined;
            hls.detachMedia();
            hls.destroy();
        };
    }, [playlist, setError, setHasSubtitleTrack, videoRef, handleFragChange, Hls]);
    var flushOnLoop = useNonReactiveCallback(function () {
        if (!Hls)
            return;
        if (!hlsRef.current)
            return;
        var hls = hlsRef.current;
        // `handleFragChange` will catch most stale frags, but there's a corner case -
        // if there's only one segment in the video, it won't get flushed because it avoids
        // flushing the currently active segment. Therefore, we have to catch it when we loop
        if (hls.nextAutoLevel > 0 &&
            lowQualityFragments.length === 1 &&
            lowQualityFragments[0].start === 0) {
            var lowQualFrag = lowQualityFragments[0];
            hls.trigger(Hls.Events.BUFFER_FLUSHING, {
                startOffset: lowQualFrag.start,
                endOffset: lowQualFrag.end,
                type: 'video',
            });
            setLowQualityFragments([]);
        }
    });
    // manually loop, so if we've flushed the first buffer it doesn't get confused
    var hasLowQualityFragmentAtStart = lowQualityFragments.some(function (frag) { return frag.start === 0; });
    useEffect(function () {
        if (!videoRef.current)
            return;
        // use `loop` prop on `<video>` element if the starting frag is high quality.
        // otherwise, we need to do it with an event listener as we may need to manually flush the frag
        if (!hasLowQualityFragmentAtStart)
            return;
        var abortController = new AbortController();
        var signal = abortController.signal;
        var videoNode = videoRef.current;
        videoNode.addEventListener('ended', function () {
            flushOnLoop();
            videoNode.currentTime = 0;
            var maybePromise = videoNode.play();
            if (maybePromise) {
                maybePromise.catch(function () { });
            }
        }, { signal: signal });
        return function () {
            abortController.abort();
        };
    }, [videoRef, flushOnLoop, hasLowQualityFragmentAtStart]);
    return {
        hlsRef: hlsRef,
        loop: !hasLowQualityFragmentAtStart,
    };
}
var templateObject_1;
