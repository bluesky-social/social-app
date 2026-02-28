import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback, useEffect } from 'react';
import { clamp, interpolate, useSharedValue, withSpring, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventEmitter from 'eventemitter3';
import { ScrollProvider } from '#/lib/ScrollContext';
import { useMinimalShellMode } from '#/state/shell';
import { useShellLayout } from '#/state/shell/shell-layout';
import { IS_LIQUID_GLASS, IS_NATIVE, IS_WEB } from '#/env';
var WEB_HIDE_SHELL_THRESHOLD = 200;
export function MainScrollProvider(_a) {
    var children = _a.children;
    var headerHeight = useShellLayout().headerHeight;
    var headerMode = useMinimalShellMode().headerMode;
    var topInset = useSafeAreaInsets().top;
    var headerPinnedHeight = IS_LIQUID_GLASS ? topInset : 0;
    var startDragOffset = useSharedValue(null);
    var startMode = useSharedValue(null);
    var didJustRestoreScroll = useSharedValue(false);
    var setMode = React.useCallback(function (v) {
        'worklet';
        headerMode.set(function () {
            return withSpring(v ? 1 : 0, {
                overshootClamping: true,
            });
        });
    }, [headerMode]);
    useEffect(function () {
        if (IS_WEB) {
            return listenToForcedWindowScroll(function () {
                startDragOffset.set(null);
                startMode.set(null);
                didJustRestoreScroll.set(true);
            });
        }
    });
    var snapToClosestState = useCallback(function (e) {
        'worklet';
        var offsetY = Math.max(0, e.contentOffset.y);
        if (IS_NATIVE) {
            var startDragOffsetValue = startDragOffset.get();
            if (startDragOffsetValue === null) {
                return;
            }
            var didScrollDown = offsetY > startDragOffsetValue;
            startDragOffset.set(null);
            startMode.set(null);
            if (offsetY < headerHeight.get()) {
                // If we're close to the top, show the shell.
                setMode(false);
            }
            else if (didScrollDown) {
                // Showing the bar again on scroll down feels annoying, so don't.
                setMode(true);
            }
            else {
                // Snap to whichever state is the closest.
                setMode(Math.round(headerMode.get()) === 1);
            }
        }
    }, [startDragOffset, startMode, setMode, headerMode, headerHeight]);
    var onBeginDrag = useCallback(function (e) {
        'worklet';
        var offsetY = Math.max(0, e.contentOffset.y);
        if (IS_NATIVE) {
            startDragOffset.set(offsetY);
            startMode.set(headerMode.get());
        }
    }, [headerMode, startDragOffset, startMode]);
    var onEndDrag = useCallback(function (e) {
        'worklet';
        if (IS_NATIVE) {
            if (e.velocity && e.velocity.y !== 0) {
                // If we detect a velocity, wait for onMomentumEnd to snap.
                return;
            }
            snapToClosestState(e);
        }
    }, [snapToClosestState]);
    var onMomentumEnd = useCallback(function (e) {
        'worklet';
        if (IS_NATIVE) {
            snapToClosestState(e);
        }
    }, [snapToClosestState]);
    var onScroll = useCallback(function (e) {
        'worklet';
        var _a;
        var offsetY = Math.max(0, e.contentOffset.y);
        if (IS_NATIVE) {
            var startDragOffsetValue = startDragOffset.get();
            var startModeValue = startMode.get();
            if (startDragOffsetValue === null || startModeValue === null) {
                if (headerMode.get() !== 0 && offsetY < headerHeight.get()) {
                    // If we're close enough to the top, always show the shell.
                    // Even if we're not dragging.
                    setMode(false);
                }
                return;
            }
            // The "mode" value is always between 0 and 1.
            // Figure out how much to move it based on the current dragged distance.
            var dy = offsetY - startDragOffsetValue;
            var hideDistance = headerHeight.get() - headerPinnedHeight;
            var dProgress = interpolate(dy, [-hideDistance, hideDistance], [-1, 1]);
            var newValue = clamp(startModeValue + dProgress, 0, 1);
            if (newValue !== headerMode.get()) {
                // Manually adjust the value. This won't be (and shouldn't be) animated.
                headerMode.set(newValue);
            }
        }
        else {
            if (didJustRestoreScroll.get()) {
                didJustRestoreScroll.set(false);
                // Don't hide/show navbar based on scroll restoratoin.
                return;
            }
            // On the web, we don't try to follow the drag because we don't know when it ends.
            // Instead, show/hide immediately based on whether we're scrolling up or down.
            var dy = offsetY - ((_a = startDragOffset.get()) !== null && _a !== void 0 ? _a : 0);
            startDragOffset.set(offsetY);
            if (dy < 0 || offsetY < WEB_HIDE_SHELL_THRESHOLD) {
                setMode(false);
            }
            else if (dy > 0) {
                setMode(true);
            }
        }
    }, [
        headerHeight,
        headerPinnedHeight,
        headerMode,
        setMode,
        startDragOffset,
        startMode,
        didJustRestoreScroll,
    ]);
    return (_jsx(ScrollProvider, { onBeginDrag: onBeginDrag, onEndDrag: onEndDrag, onScroll: onScroll, onMomentumEnd: onMomentumEnd, children: children }));
}
var emitter = new EventEmitter();
if (IS_WEB) {
    var originalScroll_1 = window.scroll;
    window.scroll = function () {
        emitter.emit('forced-scroll');
        return originalScroll_1.apply(this, arguments);
    };
    var originalScrollTo_1 = window.scrollTo;
    window.scrollTo = function () {
        emitter.emit('forced-scroll');
        return originalScrollTo_1.apply(this, arguments);
    };
}
function listenToForcedWindowScroll(listener) {
    emitter.addListener('forced-scroll', listener);
    return function () {
        emitter.removeListener('forced-scroll', listener);
    };
}
