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
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, interpolate, interpolateColor, runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useReducedMotion, useSharedValue, withSequence, withTiming, } from 'react-native-reanimated';
import { useHaptics } from '#/lib/haptics';
var MAX_WIDTH = Dimensions.get('screen').width;
var ICON_SIZE = 32;
export function GestureActionView(_a) {
    var _b, _c, _d, _e;
    var children = _a.children, actions = _a.actions;
    if ((actions.leftSecond && !actions.leftFirst) ||
        (actions.rightSecond && !actions.rightFirst)) {
        throw new Error('You must provide the first action before the second action');
    }
    var _f = React.useState(null), activeAction = _f[0], setActiveAction = _f[1];
    var haptic = useHaptics();
    var isReducedMotion = useReducedMotion();
    var transX = useSharedValue(0);
    var clampedTransX = useDerivedValue(function () {
        var min = actions.leftFirst ? -MAX_WIDTH : 0;
        var max = actions.rightFirst ? MAX_WIDTH : 0;
        return clamp(transX.get(), min, max);
    });
    var iconScale = useSharedValue(1);
    var isActive = useSharedValue(false);
    var hitFirst = useSharedValue(false);
    var hitSecond = useSharedValue(false);
    var runPopAnimation = function () {
        'worklet';
        if (isReducedMotion) {
            return;
        }
        iconScale.set(function () {
            return withSequence(withTiming(1.2, { duration: 175 }), withTiming(1, { duration: 100 }));
        });
    };
    useAnimatedReaction(function () { return transX; }, function () {
        if (transX.get() === 0) {
            runOnJS(setActiveAction)(null);
        }
        else if (transX.get() < 0) {
            if (actions.leftSecond &&
                transX.get() <= -actions.leftSecond.threshold) {
                if (activeAction !== 'leftSecond') {
                    runOnJS(setActiveAction)('leftSecond');
                }
            }
            else if (activeAction !== 'leftFirst') {
                runOnJS(setActiveAction)('leftFirst');
            }
        }
        else if (transX.get() > 0) {
            if (actions.rightSecond &&
                transX.get() > actions.rightSecond.threshold) {
                if (activeAction !== 'rightSecond') {
                    runOnJS(setActiveAction)('rightSecond');
                }
            }
            else if (activeAction !== 'rightFirst') {
                runOnJS(setActiveAction)('rightFirst');
            }
        }
    });
    // NOTE(haileyok):
    // Absurdly high value so it doesn't interfere with the pan gestures above (i.e., scroll)
    // reanimated doesn't offer great support for disabling y/x axes :/
    var effectivelyDisabledOffset = 200;
    var panGesture = Gesture.Pan()
        .activeOffsetX([
        actions.leftFirst ? -10 : -effectivelyDisabledOffset,
        actions.rightFirst ? 10 : effectivelyDisabledOffset,
    ])
        .activeOffsetY([-effectivelyDisabledOffset, effectivelyDisabledOffset])
        .onStart(function () {
        'worklet';
        isActive.set(true);
    })
        .onChange(function (e) {
        'worklet';
        transX.set(e.translationX);
        if (e.translationX < 0) {
            // Left side
            if (actions.leftSecond) {
                if (e.translationX <= -actions.leftSecond.threshold &&
                    !hitSecond.get()) {
                    runPopAnimation();
                    runOnJS(haptic)();
                    hitSecond.set(true);
                }
                else if (hitSecond.get() &&
                    e.translationX > -actions.leftSecond.threshold) {
                    runPopAnimation();
                    hitSecond.set(false);
                }
            }
            if (!hitSecond.get() && actions.leftFirst) {
                if (e.translationX <= -actions.leftFirst.threshold &&
                    !hitFirst.get()) {
                    runPopAnimation();
                    runOnJS(haptic)();
                    hitFirst.set(true);
                }
                else if (hitFirst.get() &&
                    e.translationX > -actions.leftFirst.threshold) {
                    hitFirst.set(false);
                }
            }
        }
        else if (e.translationX > 0) {
            // Right side
            if (actions.rightSecond) {
                if (e.translationX >= actions.rightSecond.threshold &&
                    !hitSecond.get()) {
                    runPopAnimation();
                    runOnJS(haptic)();
                    hitSecond.set(true);
                }
                else if (hitSecond.get() &&
                    e.translationX < actions.rightSecond.threshold) {
                    runPopAnimation();
                    hitSecond.set(false);
                }
            }
            if (!hitSecond.get() && actions.rightFirst) {
                if (e.translationX >= actions.rightFirst.threshold &&
                    !hitFirst.get()) {
                    runPopAnimation();
                    runOnJS(haptic)();
                    hitFirst.set(true);
                }
                else if (hitFirst.get() &&
                    e.translationX < actions.rightFirst.threshold) {
                    hitFirst.set(false);
                }
            }
        }
    })
        .onEnd(function (e) {
        'worklet';
        if (e.translationX < 0) {
            if (hitSecond.get() && actions.leftSecond) {
                runOnJS(actions.leftSecond.action)();
            }
            else if (hitFirst.get() && actions.leftFirst) {
                runOnJS(actions.leftFirst.action)();
            }
        }
        else if (e.translationX > 0) {
            if (hitSecond.get() && actions.rightSecond) {
                runOnJS(actions.rightSecond.action)();
            }
            else if (hitSecond.get() && actions.rightFirst) {
                runOnJS(actions.rightFirst.action)();
            }
        }
        transX.set(function () { return withTiming(0, { duration: 200 }); });
        hitFirst.set(false);
        hitSecond.set(false);
        isActive.set(false);
    });
    var composedGesture = Gesture.Simultaneous(panGesture);
    var animatedSliderStyle = useAnimatedStyle(function () {
        return {
            transform: [{ translateX: clampedTransX.get() }],
        };
    });
    var leftSideInterpolation = React.useMemo(function () {
        var _a, _b, _c, _d;
        return createInterpolation({
            firstColor: (_a = actions.leftFirst) === null || _a === void 0 ? void 0 : _a.color,
            secondColor: (_b = actions.leftSecond) === null || _b === void 0 ? void 0 : _b.color,
            firstThreshold: (_c = actions.leftFirst) === null || _c === void 0 ? void 0 : _c.threshold,
            secondThreshold: (_d = actions.leftSecond) === null || _d === void 0 ? void 0 : _d.threshold,
            side: 'left',
        });
    }, [actions.leftFirst, actions.leftSecond]);
    var rightSideInterpolation = React.useMemo(function () {
        var _a, _b, _c, _d;
        return createInterpolation({
            firstColor: (_a = actions.rightFirst) === null || _a === void 0 ? void 0 : _a.color,
            secondColor: (_b = actions.rightSecond) === null || _b === void 0 ? void 0 : _b.color,
            firstThreshold: (_c = actions.rightFirst) === null || _c === void 0 ? void 0 : _c.threshold,
            secondThreshold: (_d = actions.rightSecond) === null || _d === void 0 ? void 0 : _d.threshold,
            side: 'right',
        });
    }, [actions.rightFirst, actions.rightSecond]);
    var interpolation = React.useMemo(function () {
        if (!actions.leftFirst) {
            return rightSideInterpolation;
        }
        else if (!actions.rightFirst) {
            return leftSideInterpolation;
        }
        else {
            return {
                inputRange: __spreadArray(__spreadArray([], leftSideInterpolation.inputRange, true), rightSideInterpolation.inputRange, true),
                outputRange: __spreadArray(__spreadArray([], leftSideInterpolation.outputRange, true), rightSideInterpolation.outputRange, true),
            };
        }
    }, [
        leftSideInterpolation,
        rightSideInterpolation,
        actions.leftFirst,
        actions.rightFirst,
    ]);
    var animatedBackgroundStyle = useAnimatedStyle(function () {
        return {
            backgroundColor: interpolateColor(clampedTransX.get(), interpolation.inputRange, 
            // @ts-expect-error - Weird type expected by reanimated, but this is okay
            interpolation.outputRange),
        };
    });
    var animatedIconStyle = useAnimatedStyle(function () {
        var absTransX = Math.abs(clampedTransX.get());
        return {
            opacity: interpolate(absTransX, [0, 75], [0.15, 1]),
            transform: [{ scale: iconScale.get() }],
        };
    });
    return (_jsx(GestureDetector, { gesture: composedGesture, children: _jsxs(View, { children: [_jsx(Animated.View, { style: [StyleSheet.absoluteFill, animatedBackgroundStyle], children: _jsx(View, { style: {
                            flex: 1,
                            marginHorizontal: 12,
                            justifyContent: 'center',
                            alignItems: activeAction === 'leftFirst' || activeAction === 'leftSecond'
                                ? 'flex-end'
                                : 'flex-start',
                        }, children: _jsx(Animated.View, { style: [animatedIconStyle], children: activeAction === 'leftFirst' && ((_b = actions.leftFirst) === null || _b === void 0 ? void 0 : _b.icon) ? (_jsx(actions.leftFirst.icon, { height: ICON_SIZE, width: ICON_SIZE, style: {
                                    color: 'white',
                                } })) : activeAction === 'leftSecond' && ((_c = actions.leftSecond) === null || _c === void 0 ? void 0 : _c.icon) ? (_jsx(actions.leftSecond.icon, { height: ICON_SIZE, width: ICON_SIZE, style: { color: 'white' } })) : activeAction === 'rightFirst' && ((_d = actions.rightFirst) === null || _d === void 0 ? void 0 : _d.icon) ? (_jsx(actions.rightFirst.icon, { height: ICON_SIZE, width: ICON_SIZE, style: { color: 'white' } })) : activeAction === 'rightSecond' &&
                                ((_e = actions.rightSecond) === null || _e === void 0 ? void 0 : _e.icon) ? (_jsx(actions.rightSecond.icon, { height: ICON_SIZE, width: ICON_SIZE, style: { color: 'white' } })) : null }) }) }), _jsx(Animated.View, { style: animatedSliderStyle, children: children })] }) }));
}
function createInterpolation(_a) {
    var firstColor = _a.firstColor, secondColor = _a.secondColor, firstThreshold = _a.firstThreshold, secondThreshold = _a.secondThreshold, side = _a.side;
    if ((secondThreshold && !secondColor) || (!secondThreshold && secondColor)) {
        throw new Error('You must provide a second color if you provide a second threshold');
    }
    if (!firstThreshold) {
        return {
            inputRange: [0],
            outputRange: ['transparent'],
        };
    }
    var offset = side === 'left' ? -20 : 20;
    if (side === 'left') {
        firstThreshold = -firstThreshold;
        if (secondThreshold) {
            secondThreshold = -secondThreshold;
        }
    }
    var res;
    if (secondThreshold) {
        res = {
            inputRange: [
                0,
                firstThreshold,
                firstThreshold + offset - 20,
                secondThreshold,
            ],
            outputRange: ['transparent', firstColor, firstColor, secondColor],
        };
    }
    else {
        res = {
            inputRange: [0, firstThreshold],
            outputRange: ['transparent', firstColor],
        };
    }
    if (side === 'left') {
        // Reverse the input/output ranges
        res.inputRange.reverse();
        res.outputRange.reverse();
    }
    return res;
}
