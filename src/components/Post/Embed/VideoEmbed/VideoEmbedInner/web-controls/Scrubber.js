var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { clamp } from '#/lib/numbers';
import { atoms as a, useTheme, web } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { IS_WEB_FIREFOX, IS_WEB_TOUCH_DEVICE } from '#/env';
import { formatTime } from './utils';
export function Scrubber(_a) {
    var duration = _a.duration, currentTime = _a.currentTime, onSeek = _a.onSeek, onSeekEnd = _a.onSeekEnd, onSeekStart = _a.onSeekStart, seekLeft = _a.seekLeft, seekRight = _a.seekRight, togglePlayPause = _a.togglePlayPause, drawFocus = _a.drawFocus;
    var _ = useLingui()._;
    var t = useTheme();
    var _b = useState(false), scrubberActive = _b[0], setScrubberActive = _b[1];
    var _c = useInteractionState(), hovered = _c.state, onStartHover = _c.onIn, onEndHover = _c.onOut;
    var _d = useInteractionState(), focused = _d.state, onFocus = _d.onIn, onBlur = _d.onOut;
    var _e = useState(0), seekPosition = _e[0], setSeekPosition = _e[1];
    var isSeekingRef = useRef(false);
    var barRef = useRef(null);
    var circleRef = useRef(null);
    var seek = useCallback(function (evt) {
        if (!barRef.current)
            return;
        var _a = barRef.current.getBoundingClientRect(), left = _a.left, width = _a.width;
        var x = evt.clientX;
        var percent = clamp((x - left) / width, 0, 1) * duration;
        onSeek(percent);
        setSeekPosition(percent);
    }, [duration, onSeek]);
    var onPointerDown = useCallback(function (evt) {
        var target = evt.target;
        if (target instanceof Element) {
            evt.preventDefault();
            target.setPointerCapture(evt.pointerId);
            isSeekingRef.current = true;
            seek(evt);
            setScrubberActive(true);
            onSeekStart();
        }
    }, [seek, onSeekStart]);
    var onPointerMove = useCallback(function (evt) {
        if (isSeekingRef.current) {
            evt.preventDefault();
            seek(evt);
        }
    }, [seek]);
    var onPointerUp = useCallback(function (evt) {
        var target = evt.target;
        if (isSeekingRef.current && target instanceof Element) {
            evt.preventDefault();
            target.releasePointerCapture(evt.pointerId);
            isSeekingRef.current = false;
            onSeekEnd();
            setScrubberActive(false);
        }
    }, [onSeekEnd]);
    useEffect(function () {
        // HACK: there's divergent browser behaviour about what to do when
        // a pointerUp event is fired outside the element that captured the
        // pointer. Firefox clicks on the element the mouse is over, so we have
        // to make everything unclickable while seeking -sfn
        if (IS_WEB_FIREFOX && scrubberActive) {
            document.body.classList.add('force-no-clicks');
            return function () {
                document.body.classList.remove('force-no-clicks');
            };
        }
    }, [scrubberActive, onSeekEnd]);
    useEffect(function () {
        if (!circleRef.current)
            return;
        if (focused) {
            var abortController_1 = new AbortController();
            var signal = abortController_1.signal;
            circleRef.current.addEventListener('keydown', function (evt) {
                // space: play/pause
                // arrow left: seek backward
                // arrow right: seek forward
                if (evt.key === ' ') {
                    evt.preventDefault();
                    drawFocus();
                    togglePlayPause();
                }
                else if (evt.key === 'ArrowLeft') {
                    evt.preventDefault();
                    drawFocus();
                    seekLeft();
                }
                else if (evt.key === 'ArrowRight') {
                    evt.preventDefault();
                    drawFocus();
                    seekRight();
                }
            }, { signal: signal });
            return function () { return abortController_1.abort(); };
        }
    }, [focused, seekLeft, seekRight, togglePlayPause, drawFocus]);
    var progress = scrubberActive ? seekPosition : currentTime;
    var progressPercent = (progress / duration) * 100;
    if (duration < 3)
        return null;
    return (_jsx(View, { testID: "scrubber", style: [
            { height: IS_WEB_TOUCH_DEVICE ? 32 : 18, width: '100%' },
            a.flex_shrink_0,
            a.px_xs,
        ], onPointerEnter: onStartHover, onPointerLeave: onEndHover, children: _jsxs("div", { ref: barRef, style: {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                cursor: scrubberActive ? 'grabbing' : 'grab',
                padding: '4px 0',
            }, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerUp, children: [_jsx(View, { style: [
                        a.w_full,
                        a.rounded_full,
                        a.overflow_hidden,
                        { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
                        { height: hovered || scrubberActive ? 6 : 3 },
                        web({ transition: 'height 0.1s ease' }),
                    ], children: duration > 0 && (_jsx(View, { style: [
                            a.h_full,
                            { backgroundColor: t.palette.white },
                            { width: "".concat(progressPercent, "%") },
                        ] })) }), _jsx("div", { ref: circleRef, "aria-label": _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Seek slider. Use the arrow keys to seek forwards and backwards, and space to play/pause"], ["Seek slider. Use the arrow keys to seek forwards and backwards, and space to play/pause"])))), role: "slider", "aria-valuemax": duration, "aria-valuemin": 0, "aria-valuenow": currentTime, "aria-valuetext": _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " of ", ""], ["", " of ", ""])), formatTime(currentTime), formatTime(duration))), tabIndex: 0, onFocus: onFocus, onBlur: onBlur, style: {
                        position: 'absolute',
                        height: 16,
                        width: 16,
                        left: "calc(".concat(progressPercent, "% - 8px)"),
                        borderRadius: 8,
                        pointerEvents: 'none',
                    }, children: _jsx(View, { style: [
                            a.w_full,
                            a.h_full,
                            a.rounded_full,
                            { backgroundColor: t.palette.white },
                            {
                                transform: [
                                    {
                                        scale: hovered || scrubberActive || focused
                                            ? scrubberActive
                                                ? 1
                                                : 0.6
                                            : 0,
                                    },
                                ],
                            },
                        ] }) })] }) }));
}
var templateObject_1, templateObject_2;
