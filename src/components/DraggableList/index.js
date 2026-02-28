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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { measure, runOnJS, scrollTo, useAnimatedRef, useAnimatedStyle, useFrameCallback, useSharedValue, withSpring, withTiming, } from 'react-native-reanimated';
import { useHaptics } from '#/lib/haptics';
import { atoms as a, useTheme, web } from '#/alf';
import { DotGrid2x3_Stroke2_Corner0_Rounded as GripIcon } from '#/components/icons/DotGrid';
import { IS_IOS } from '#/env';
var AUTO_SCROLL_THRESHOLD = 50;
var AUTO_SCROLL_SPEED = 4;
export function SortableList(_a) {
    var data = _a.data, keyExtractor = _a.keyExtractor, renderItem = _a.renderItem, onReorder = _a.onReorder, onDragStart = _a.onDragStart, onDragEnd = _a.onDragEnd, itemHeight = _a.itemHeight, scrollRef = _a.scrollRef, scrollOffset = _a.scrollOffset;
    var t = useTheme();
    var state = useSharedValue({
        slots: Object.fromEntries(data.map(function (item, i) { return [keyExtractor(item), i]; })),
        activeKey: '',
        dragStartSlot: -1,
    });
    var dragY = useSharedValue(0);
    // Auto-scroll shared values
    var scrollCompensation = useSharedValue(0);
    var isGestureActive = useSharedValue(false);
    // We track scroll position ourselves because scrollOffset.get() lags
    // by one frame after scrollTo(), causing a feedback loop where the
    // frame callback keeps thinking the item is at the edge.
    var trackedScrollY = useSharedValue(0);
    // For measuring list position within scroll content
    var listRef = useAnimatedRef();
    var listContentOffset = useSharedValue(0);
    var viewportHeight = useSharedValue(0);
    var measureDone = useSharedValue(false);
    // Sync slots when data changes externally (e.g. pin/unpin).
    // Skip after our own reorder — the worklet already set correct slots
    // on the UI thread, and a redundant JS-side set() would be wasteful.
    var skipNextSync = useRef(false);
    var currentKeys = data.map(function (item) { return keyExtractor(item); }).join(',');
    useLayoutEffect(function () {
        if (skipNextSync.current) {
            skipNextSync.current = false;
            return;
        }
        var nextSlots = {};
        data.forEach(function (item, i) {
            nextSlots[keyExtractor(item)] = i;
        });
        state.set({ slots: nextSlots, activeKey: '', dragStartSlot: -1 });
        dragY.set(0);
    }, [currentKeys, data, keyExtractor, state, dragY]);
    var handleReorder = function (sortedKeys) {
        skipNextSync.current = true;
        var byKey = new Map(data.map(function (item) { return [keyExtractor(item), item]; }));
        onReorder(sortedKeys.map(function (key) { return byKey.get(key); }));
        onDragEnd === null || onDragEnd === void 0 ? void 0 : onDragEnd();
    };
    // Auto-scroll: runs every frame while a gesture is active.
    useFrameCallback(function () {
        if (!isGestureActive.get())
            return;
        if (!scrollRef || !scrollOffset)
            return;
        var s = state.get();
        if (s.activeKey === '')
            return;
        // Measure list and scroll view on first frame of drag.
        // Use scrollOffset here (only once) since no lag has occurred yet.
        if (!measureDone.get()) {
            var scrollM = measure(scrollRef);
            var listM = measure(listRef);
            if (!scrollM || !listM)
                return;
            trackedScrollY.set(scrollOffset.get());
            listContentOffset.set(listM.pageY - scrollM.pageY + trackedScrollY.get());
            viewportHeight.set(scrollM.height);
            measureDone.set(true);
        }
        var startSlot = s.dragStartSlot;
        var currentDragY = dragY.get();
        // Use trackedScrollY (not scrollOffset) to avoid the one-frame lag
        // after scrollTo() that causes a feedback loop.
        var scrollY = trackedScrollY.get();
        // Item position relative to scroll viewport top.
        var itemContentY = listContentOffset.get() + startSlot * itemHeight + currentDragY;
        var itemViewportY = itemContentY - scrollY;
        var itemBottomViewportY = itemViewportY + itemHeight;
        var scrollDelta = 0;
        if (itemViewportY < AUTO_SCROLL_THRESHOLD) {
            scrollDelta = -AUTO_SCROLL_SPEED;
        }
        else if (itemBottomViewportY >
            viewportHeight.get() - AUTO_SCROLL_THRESHOLD) {
            scrollDelta = AUTO_SCROLL_SPEED;
        }
        if (scrollDelta === 0)
            return;
        // Don't scroll if the item is already at a list boundary.
        var effectiveSlotPos = (startSlot * itemHeight + currentDragY) / itemHeight;
        if (scrollDelta < 0 && effectiveSlotPos <= 0)
            return;
        if (scrollDelta > 0 && effectiveSlotPos >= data.length - 1)
            return;
        // Don't scroll past the top.
        if (scrollDelta < 0 && scrollY <= 0)
            return;
        var newScrollY = Math.max(0, scrollY + scrollDelta);
        scrollTo(scrollRef, 0, newScrollY, false);
        trackedScrollY.set(newScrollY);
        scrollCompensation.set(scrollCompensation.get() + (newScrollY - scrollY));
    });
    // Render in stable key order so React never reorders native views.
    // On Android, native ViewGroup child reordering causes a visual flash.
    var sortedData = __spreadArray([], data, true).sort(function (a, b) {
        var ka = keyExtractor(a);
        var kb = keyExtractor(b);
        return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    return (_jsx(Animated.View, { ref: listRef, style: [{ height: data.length * itemHeight }, t.atoms.bg_contrast_25], children: sortedData.map(function (item) {
            var key = keyExtractor(item);
            return (_jsx(SortableItem, { item: item, itemKey: key, itemCount: data.length, itemHeight: itemHeight, state: state, dragY: dragY, scrollCompensation: scrollCompensation, isGestureActive: isGestureActive, measureDone: measureDone, renderItem: renderItem, onCommitReorder: handleReorder, onDragStart: onDragStart, onDragEnd: onDragEnd }, key));
        }) }));
}
function SortableItem(_a) {
    var item = _a.item, itemKey = _a.itemKey, itemCount = _a.itemCount, itemHeight = _a.itemHeight, state = _a.state, dragY = _a.dragY, scrollCompensation = _a.scrollCompensation, isGestureActive = _a.isGestureActive, measureDone = _a.measureDone, renderItem = _a.renderItem, onCommitReorder = _a.onCommitReorder, onDragStart = _a.onDragStart, onDragEnd = _a.onDragEnd;
    var t = useTheme();
    var playHaptic = useHaptics();
    var lastHapticSlot = useSharedValue(-1);
    var gesture = Gesture.Pan()
        .onStart(function () {
        'worklet';
        var s = state.get();
        var mySlot = s.slots[itemKey];
        state.set(__assign(__assign({}, s), { activeKey: itemKey, dragStartSlot: mySlot }));
        dragY.set(0);
        scrollCompensation.set(0);
        isGestureActive.set(true);
        measureDone.set(false);
        lastHapticSlot.set(mySlot);
        if (onDragStart) {
            runOnJS(onDragStart)();
        }
        runOnJS(playHaptic)();
    })
        .onChange(function (e) {
        'worklet';
        var startSlot = state.get().dragStartSlot;
        var minY = -startSlot * itemHeight;
        var maxY = (itemCount - 1 - startSlot) * itemHeight;
        // Include scroll compensation so the item tracks with auto-scroll.
        var effectiveY = e.translationY + scrollCompensation.get();
        var clampedY = Math.max(minY, Math.min(effectiveY, maxY));
        dragY.set(clampedY);
        var currentSlot = Math.round((startSlot * itemHeight + clampedY) / itemHeight);
        var clampedSlot = Math.max(0, Math.min(currentSlot, itemCount - 1));
        if (IS_IOS && clampedSlot !== lastHapticSlot.get()) {
            lastHapticSlot.set(clampedSlot);
            runOnJS(playHaptic)('Light');
        }
    })
        .onEnd(function () {
        'worklet';
        // Stop auto-scroll BEFORE the snap animation.
        isGestureActive.set(false);
        var startSlot = state.get().dragStartSlot;
        var rawNewSlot = Math.round((startSlot * itemHeight + dragY.get()) / itemHeight);
        var newSlot = Math.max(0, Math.min(rawNewSlot, itemCount - 1));
        var snapOffset = (newSlot - startSlot) * itemHeight;
        // Animate to the target slot, then commit.
        dragY.set(withTiming(snapOffset, { duration: 200 }, function (finished) {
            if (finished) {
                if (newSlot !== startSlot) {
                    // Compute new slots on the UI thread so animated styles
                    // reflect final positions before React re-renders.
                    var cur = state.get();
                    var sorted = new Array(itemCount);
                    for (var key in cur.slots) {
                        sorted[cur.slots[key]] = key;
                    }
                    var movedKey = sorted[startSlot];
                    sorted.splice(startSlot, 1);
                    sorted.splice(newSlot, 0, movedKey);
                    var nextSlots = {};
                    for (var i = 0; i < sorted.length; i++) {
                        nextSlots[sorted[i]] = i;
                    }
                    state.set({
                        slots: nextSlots,
                        activeKey: '',
                        dragStartSlot: -1,
                    });
                    dragY.set(0);
                    runOnJS(onCommitReorder)(sorted);
                }
                else {
                    var s = state.get();
                    state.set(__assign(__assign({}, s), { activeKey: '', dragStartSlot: -1 }));
                    dragY.set(0);
                    if (onDragEnd) {
                        runOnJS(onDragEnd)();
                    }
                }
            }
        }));
    })
        // Reset if the gesture is cancelled without onEnd firing.
        .onFinalize(function () {
        'worklet';
        isGestureActive.set(false);
        if (state.get().activeKey === itemKey && dragY.get() === 0) {
            var s = state.get();
            state.set(__assign(__assign({}, s), { activeKey: '', dragStartSlot: -1 }));
            if (onDragEnd) {
                runOnJS(onDragEnd)();
            }
        }
    });
    // All vertical positioning is via translateY (no `top`). This avoids
    // discrete jumps when slots change — Reanimated smoothly animates from
    // the current translateY to the new target on every state transition.
    // On first mount we skip the animation so items appear instantly.
    var isFirstRender = useSharedValue(true);
    var animatedStyle = useAnimatedStyle(function () {
        var s = state.get();
        var mySlot = s.slots[itemKey];
        if (mySlot === undefined) {
            return {};
        }
        var baseY = mySlot * itemHeight;
        // Active item: follow the finger with a slight scale-up and shadow.
        if (s.activeKey === itemKey) {
            return __assign({ transform: [
                    { translateY: s.dragStartSlot * itemHeight + dragY.get() },
                    { scale: withSpring(1.03) },
                ], zIndex: 999 }, (IS_IOS
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: withSpring(0.08),
                    shadowRadius: withSpring(4),
                }
                : {
                    elevation: withSpring(3),
                }));
        }
        // Reset for non-active states. Without this, shadow props
        // set during dragging linger on the native view.
        var inactive = __assign({}, (IS_IOS
            ? {
                shadowOpacity: withSpring(0),
                shadowRadius: withSpring(0),
            }
            : {
                elevation: withSpring(0),
            }));
        // Another item is being dragged — shift to make room.
        if (s.activeKey !== '') {
            isFirstRender.set(false);
            var currentDragPos = Math.round((s.dragStartSlot * itemHeight + dragY.get()) / itemHeight);
            var clampedPos = Math.max(0, Math.min(currentDragPos, itemCount - 1));
            var offset = 0;
            if (s.dragStartSlot < clampedPos &&
                mySlot > s.dragStartSlot &&
                mySlot <= clampedPos) {
                offset = -itemHeight;
            }
            else if (s.dragStartSlot > clampedPos &&
                mySlot < s.dragStartSlot &&
                mySlot >= clampedPos) {
                offset = itemHeight;
            }
            return __assign({ transform: [
                    { translateY: withTiming(baseY + offset, { duration: 200 }) },
                    { scale: withSpring(1) },
                ], zIndex: 0 }, inactive);
        }
        // Idle: sit at our slot. On first render use a direct value so items
        // don't animate from y=0. After any drag, use withTiming so the
        // shift→idle transition is smooth (no discrete jump).
        if (isFirstRender.get()) {
            isFirstRender.set(false);
            return __assign({ transform: [{ translateY: baseY }, { scale: 1 }], zIndex: 0 }, inactive);
        }
        return __assign({ transform: [{ translateY: withTiming(baseY, { duration: 200 }) }, { scale: 1 }], zIndex: 0 }, inactive);
    });
    var dragHandle = (_jsx(GestureDetector, { gesture: gesture, children: _jsx(Animated.View, { style: [
                a.justify_center,
                a.align_center,
                a.px_sm,
                a.py_md,
                web({ cursor: 'grab' }),
            ], hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }, children: _jsx(GripIcon, { size: "lg", fill: t.atoms.text_contrast_medium.color, style: web({ pointerEvents: 'none' }) }) }) }));
    return (_jsx(Animated.View, { style: [
            {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: itemHeight,
            },
            animatedStyle,
        ], children: renderItem(item, dragHandle) }));
}
