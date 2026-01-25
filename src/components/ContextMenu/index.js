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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
import React, { useCallback, useEffect, useId, useMemo, useRef, useState, } from 'react';
import { BackHandler, Keyboard, Pressable, useWindowDimensions, View, } from 'react-native';
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import Animated, { clamp, interpolate, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Image } from 'expo-image';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useIsFocused } from '@react-navigation/native';
import flattenReactChildren from 'react-keyed-flatten-children';
import { HITSLOP_10 } from '#/lib/constants';
import { useHaptics } from '#/lib/haptics';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { logger } from '#/logger';
import { atoms as a, platform, tokens, useTheme } from '#/alf';
import { Context, ItemContext, MenuContext, useContextMenuContext, useContextMenuItemContext, useContextMenuMenuContext, } from '#/components/ContextMenu/context';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { createPortalGroup } from '#/components/Portal';
import { Text } from '#/components/Typography';
import { IS_ANDROID, IS_IOS } from '#/env';
import { Backdrop } from './Backdrop';
export { useDialogControl as useContextMenuControl, } from '#/components/Dialog';
var _a = createPortalGroup(), PortalProvider = _a.Provider, Outlet = _a.Outlet, Portal = _a.Portal;
var SPRING_IN = {
    mass: IS_IOS ? 1.25 : 0.75,
    damping: 50,
    stiffness: 1100,
    restDisplacementThreshold: 0.01,
};
var SPRING_OUT = {
    mass: IS_IOS ? 1.25 : 0.75,
    damping: 150,
    stiffness: 1000,
    restDisplacementThreshold: 0.01,
};
/**
 * Needs placing near the top of the provider stack, but BELOW the theme provider.
 */
export function Provider(_a) {
    var children = _a.children;
    return (_jsxs(PortalProvider, { children: [children, _jsx(Outlet, {})] }));
}
export function Root(_a) {
    var children = _a.children;
    var playHaptic = useHaptics();
    var _b = useState('full'), mode = _b[0], setMode = _b[1];
    var _c = useState(null), measurement = _c[0], setMeasurement = _c[1];
    var animationSV = useSharedValue(0);
    var translationSV = useSharedValue(0);
    var isFocused = useIsFocused();
    var hoverables = useRef(new Map());
    var hoverablesSV = useSharedValue({});
    var syncHoverablesThrottleRef = useRef(undefined);
    var _d = useState(null), hoveredMenuItem = _d[0], setHoveredMenuItem = _d[1];
    var onHoverableTouchUp = useCallback(function (id) {
        var hoverable = hoverables.current.get(id);
        if (!hoverable) {
            logger.warn("No such hoverable with id ".concat(id));
            return;
        }
        hoverable.onTouchUp();
    }, []);
    var onCompletedClose = useCallback(function () {
        hoverables.current.clear();
        setMeasurement(null);
    }, []);
    var context = useMemo(function () {
        return ({
            isOpen: !!measurement && isFocused,
            measurement: measurement,
            animationSV: animationSV,
            translationSV: translationSV,
            mode: mode,
            open: function (evt, mode) {
                setMeasurement(evt);
                setMode(mode);
                animationSV.set(withSpring(1, SPRING_IN));
            },
            close: function () {
                animationSV.set(withSpring(0, SPRING_OUT, function (finished) {
                    if (finished) {
                        hoverablesSV.set({});
                        translationSV.set(0);
                        runOnJS(onCompletedClose)();
                    }
                }));
            },
            registerHoverable: function (id, rect, onTouchUp) {
                hoverables.current.set(id, { id: id, rect: rect, onTouchUp: onTouchUp });
                // we need this data on the UI thread, but we want to limit cross-thread communication
                // and this function will be called in quick succession, so we need to throttle it
                if (syncHoverablesThrottleRef.current)
                    clearTimeout(syncHoverablesThrottleRef.current);
                syncHoverablesThrottleRef.current = setTimeout(function () {
                    syncHoverablesThrottleRef.current = undefined;
                    hoverablesSV.set(Object.fromEntries(
                    // eslint-ignore
                    __spreadArray([], hoverables.current.entries(), true).map(function (_a) {
                        var id = _a[0], rect = _a[1].rect;
                        return [
                            id,
                            { id: id, rect: rect },
                        ];
                    })));
                }, 1);
            },
            hoverablesSV: hoverablesSV,
            onTouchUpMenuItem: onHoverableTouchUp,
            hoveredMenuItem: hoveredMenuItem,
            setHoveredMenuItem: function (item) {
                if (item)
                    playHaptic('Light');
                setHoveredMenuItem(item);
            },
        });
    }, [
        measurement,
        setMeasurement,
        onCompletedClose,
        isFocused,
        animationSV,
        translationSV,
        hoverablesSV,
        onHoverableTouchUp,
        hoveredMenuItem,
        setHoveredMenuItem,
        playHaptic,
        mode,
    ]);
    useEffect(function () {
        if (IS_ANDROID && context.isOpen) {
            var listener_1 = BackHandler.addEventListener('hardwareBackPress', function () {
                context.close();
                return true;
            });
            return function () { return listener_1.remove(); };
        }
    }, [context]);
    return _jsx(Context.Provider, { value: context, children: children });
}
export function Trigger(_a) {
    var _this = this;
    var children = _a.children, label = _a.label, contentLabel = _a.contentLabel, style = _a.style;
    var context = useContextMenuContext();
    var playHaptic = useHaptics();
    var topInset = useSafeAreaInsets().top;
    var ref = useRef(null);
    var isFocused = useIsFocused();
    var _b = useState(null), image = _b[0], setImage = _b[1];
    var _c = useState(null), pendingMeasurement = _c[0], setPendingMeasurement = _c[1];
    var open = useNonReactiveCallback(function (mode) { return __awaiter(_this, void 0, void 0, function () {
        var _a, measurement, capture;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    playHaptic();
                    Keyboard.dismiss();
                    return [4 /*yield*/, Promise.all([
                            new Promise(function (resolve) {
                                var _a;
                                (_a = ref.current) === null || _a === void 0 ? void 0 : _a.measureInWindow(function (x, y, width, height) {
                                    return resolve({
                                        x: x,
                                        y: y +
                                            platform({
                                                default: 0,
                                                android: topInset, // not included in measurement
                                            }),
                                        width: width,
                                        height: height,
                                    });
                                });
                            }),
                            captureRef(ref, { result: 'data-uri' }).catch(function (err) {
                                logger.error(err instanceof Error ? err : String(err), {
                                    message: 'Failed to capture image of context menu trigger',
                                });
                                // will cause the image to fail to load, but it will get handled gracefully
                                return '<failed capture>';
                            }),
                        ])];
                case 1:
                    _a = _b.sent(), measurement = _a[0], capture = _a[1];
                    setImage(capture);
                    setPendingMeasurement({ measurement: measurement, mode: mode });
                    return [2 /*return*/];
            }
        });
    }); });
    var doubleTapGesture = useMemo(function () {
        return Gesture.Tap()
            .numberOfTaps(2)
            .hitSlop(HITSLOP_10)
            .onEnd(function () { return open('auxiliary-only'); })
            .runOnJS(true);
    }, [open]);
    var hoverablesSV = context.hoverablesSV, setHoveredMenuItem = context.setHoveredMenuItem, onTouchUpMenuItem = context.onTouchUpMenuItem, translationSV = context.translationSV, animationSV = context.animationSV;
    var hoveredItemSV = useSharedValue(null);
    useAnimatedReaction(function () { return hoveredItemSV.get(); }, function (hovered, prev) {
        if (hovered !== prev) {
            runOnJS(setHoveredMenuItem)(hovered);
        }
    });
    var pressAndHoldGesture = useMemo(function () {
        return Gesture.Pan()
            .activateAfterLongPress(500)
            .cancelsTouchesInView(false)
            .averageTouches(true)
            .onStart(function () {
            'worklet';
            runOnJS(open)('full');
        })
            .onUpdate(function (evt) {
            'worklet';
            var item = getHoveredHoverable(evt, hoverablesSV, translationSV);
            hoveredItemSV.set(item);
        })
            .onEnd(function () {
            'worklet';
            // don't recalculate hovered item - if they haven't moved their finger from
            // the initial press, it's jarring to then select the item underneath
            // as the menu may have slid into place beneath their finger
            var item = hoveredItemSV.get();
            if (item) {
                runOnJS(onTouchUpMenuItem)(item);
            }
        });
    }, [open, hoverablesSV, onTouchUpMenuItem, hoveredItemSV, translationSV]);
    var composedGestures = Gesture.Exclusive(doubleTapGesture, pressAndHoldGesture);
    var measurement = context.measurement || (pendingMeasurement === null || pendingMeasurement === void 0 ? void 0 : pendingMeasurement.measurement);
    return (_jsxs(_Fragment, { children: [_jsx(GestureDetector, { gesture: composedGestures, children: _jsx(View, { ref: ref, style: [{ opacity: context.isOpen ? 0 : 1 }, style], children: children({
                        IS_NATIVE: true,
                        control: { isOpen: context.isOpen, open: open },
                        state: {
                            pressed: false,
                            hovered: false,
                            focused: false,
                        },
                        props: {
                            ref: null,
                            onPress: null,
                            onFocus: null,
                            onBlur: null,
                            onPressIn: null,
                            onPressOut: null,
                            accessibilityHint: null,
                            accessibilityLabel: label,
                            accessibilityRole: null,
                        },
                    }) }) }), isFocused && image && measurement && (_jsx(Portal, { children: _jsx(TriggerClone, { label: contentLabel, translation: translationSV, animation: animationSV, image: image, measurement: measurement, onDisplay: function () {
                        if (pendingMeasurement) {
                            context.open(pendingMeasurement.measurement, pendingMeasurement.mode);
                            setPendingMeasurement(null);
                        }
                    } }) }))] }));
}
/**
 * an image of the underlying trigger with a grow animation
 */
function TriggerClone(_a) {
    var translation = _a.translation, animation = _a.animation, image = _a.image, measurement = _a.measurement, onDisplay = _a.onDisplay, label = _a.label;
    var _ = useLingui()._;
    var animatedStyles = useAnimatedStyle(function () { return ({
        transform: [{ translateY: translation.get() * animation.get() }],
    }); });
    var handleError = useCallback(function (evt) {
        logger.error('Context menu image load error', { message: evt.error });
        onDisplay();
    }, [onDisplay]);
    return (_jsx(Animated.View, { style: [
            a.absolute,
            {
                top: measurement.y,
                left: measurement.x,
                width: measurement.width,
                height: measurement.height,
            },
            a.z_10,
            a.pointer_events_none,
            animatedStyles,
        ], children: _jsx(Image, { onDisplay: onDisplay, onError: handleError, source: image, style: {
                width: measurement.width,
                height: measurement.height,
            }, accessibilityLabel: label, accessibilityHint: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["The subject of the context menu"], ["The subject of the context menu"])))), accessibilityIgnoresInvertColors: false }) }));
}
export function AuxiliaryView(_a) {
    var children = _a.children, _b = _a.align, align = _b === void 0 ? 'left' : _b;
    var context = useContextMenuContext();
    var screenWidth = useWindowDimensions().width;
    var topInset = useSafeAreaInsets().top;
    var ensureOnScreenTranslationSV = useSharedValue(0);
    var isOpen = context.isOpen, mode = context.mode, measurement = context.measurement, translationSV = context.translationSV, animationSV = context.animationSV;
    var animatedStyle = useAnimatedStyle(function () {
        return {
            opacity: clamp(animationSV.get(), 0, 1),
            transform: [
                {
                    translateY: (ensureOnScreenTranslationSV.get() || translationSV.get()) *
                        animationSV.get(),
                },
                { scale: interpolate(animationSV.get(), [0, 1], [0.2, 1]) },
            ],
        };
    });
    var menuContext = useMemo(function () { return ({ align: align }); }, [align]);
    var onLayout = useCallback(function () {
        if (!measurement)
            return;
        var translation = 0;
        // vibes based, just assuming it'll fit within this space. revisit if we use
        // AuxiliaryView for something tall
        var TOP_INSET = topInset + 80;
        var distanceMessageFromTop = measurement.y - TOP_INSET;
        if (distanceMessageFromTop < 0) {
            translation = -distanceMessageFromTop;
        }
        // normally, the context menu is responsible for measuring itself and moving everything into the right place
        // however, in auxiliary-only mode, that doesn't happen, so we need to do it ourselves here
        if (mode === 'auxiliary-only') {
            translationSV.set(translation);
            ensureOnScreenTranslationSV.set(0);
        }
        // however, we also need to make sure that for super tall triggers, we don't go off the screen
        // so we have an additional cap on the standard transform every other element has
        // note: this breaks the press-and-hold gesture for the reaction items. unfortunately I think
        // we'll just have to live with it for now, fixing it would be possible but be a large complexity
        // increase for an edge case
        else {
            ensureOnScreenTranslationSV.set(translation);
        }
    }, [mode, measurement, translationSV, topInset, ensureOnScreenTranslationSV]);
    if (!isOpen || !measurement)
        return null;
    return (_jsx(Portal, { children: _jsx(Context.Provider, { value: context, children: _jsx(MenuContext.Provider, { value: menuContext, children: _jsx(Animated.View, { onLayout: onLayout, style: [
                        a.absolute,
                        {
                            top: measurement.y,
                            transformOrigin: align === 'left' ? 'bottom left' : 'bottom right',
                        },
                        align === 'left'
                            ? { left: measurement.x }
                            : { right: screenWidth - measurement.x - measurement.width },
                        animatedStyle,
                        a.z_20,
                    ], children: children }) }) }) }));
}
var MENU_WIDTH = 240;
export function Outer(_a) {
    var children = _a.children, style = _a.style, _b = _a.align, align = _b === void 0 ? 'left' : _b;
    var t = useTheme();
    var context = useContextMenuContext();
    var insets = useSafeAreaInsets();
    var frame = useSafeAreaFrame();
    var screenWidth = useWindowDimensions().width;
    var animationSV = context.animationSV, translationSV = context.translationSV;
    var animatedContainerStyle = useAnimatedStyle(function () { return ({
        transform: [{ translateY: translationSV.get() * animationSV.get() }],
    }); });
    var animatedStyle = useAnimatedStyle(function () { return ({
        opacity: clamp(animationSV.get(), 0, 1),
        transform: [{ scale: interpolate(animationSV.get(), [0, 1], [0.2, 1]) }],
    }); });
    var onLayout = useCallback(function (evt) {
        if (!context.measurement)
            return; // should not happen
        var translation = 0;
        // pure vibes based
        var TOP_INSET = insets.top + 80;
        var BOTTOM_INSET_IOS = insets.bottom + 20;
        var BOTTOM_INSET_ANDROID = insets.bottom + 12;
        var height = evt.nativeEvent.layout.height;
        var topPosition = context.measurement.y + context.measurement.height + tokens.space.xs;
        var bottomPosition = topPosition + height;
        var safeAreaBottomLimit = frame.height -
            platform({
                ios: BOTTOM_INSET_IOS,
                android: BOTTOM_INSET_ANDROID,
                default: 0,
            });
        var diff = bottomPosition - safeAreaBottomLimit;
        if (diff > 0) {
            translation = -diff;
        }
        else {
            var distanceMessageFromTop = context.measurement.y - TOP_INSET;
            if (distanceMessageFromTop < 0) {
                translation = -Math.max(distanceMessageFromTop, diff);
            }
        }
        if (translation !== 0) {
            translationSV.set(translation);
        }
    }, [context.measurement, frame.height, insets, translationSV]);
    var menuContext = useMemo(function () { return ({ align: align }); }, [align]);
    if (!context.isOpen || !context.measurement)
        return null;
    return (_jsx(Portal, { children: _jsx(Context.Provider, { value: context, children: _jsxs(MenuContext.Provider, { value: menuContext, children: [_jsx(Backdrop, { animation: animationSV, onPress: context.close }), context.mode === 'full' && (
                    /* containing element - stays the same size, so we measure it
                   to determine if a translation is necessary. also has the positioning */
                    _jsx(Animated.View, { onLayout: onLayout, style: [
                            a.absolute,
                            a.z_10,
                            a.mt_xs,
                            {
                                width: MENU_WIDTH,
                                top: context.measurement.y + context.measurement.height,
                            },
                            align === 'left'
                                ? { left: context.measurement.x }
                                : {
                                    right: screenWidth -
                                        context.measurement.x -
                                        context.measurement.width,
                                },
                            animatedContainerStyle,
                        ], children: _jsx(Animated.View, { style: [
                                a.rounded_md,
                                a.shadow_md,
                                t.atoms.bg_contrast_25,
                                a.w_full,
                                // @ts-ignore react-native-web expects string, and this file is platform-split -sfn
                                // note: above @ts-ignore cannot be a @ts-expect-error because this does not cause an error
                                // in the typecheck CI - presumably because of RNW overriding the types
                                {
                                    transformOrigin: 
                                    // "top right" doesn't seem to work on android, so set explicitly in pixels
                                    align === 'left' ? [0, 0, 0] : [MENU_WIDTH, 0, 0],
                                },
                                animatedStyle,
                                style,
                            ], children: _jsx(View, { style: [
                                    a.flex_1,
                                    a.rounded_md,
                                    a.overflow_hidden,
                                    a.border,
                                    t.atoms.border_contrast_low,
                                ], children: flattenReactChildren(children).map(function (child, i) {
                                    return React.isValidElement(child) &&
                                        (child.type === Item || child.type === Divider) ? (_jsxs(React.Fragment, { children: [i > 0 ? (_jsx(View, { style: [a.border_b, t.atoms.border_contrast_low] })) : null, React.cloneElement(child, {
                                                // @ts-expect-error not typed
                                                style: {
                                                    borderRadius: 0,
                                                    borderWidth: 0,
                                                },
                                            })] }, i)) : null;
                                }) }) }) }))] }) }) }));
}
export function Item(_a) {
    var children = _a.children, label = _a.label, unstyled = _a.unstyled, style = _a.style, onPress = _a.onPress, position = _a.position, rest = __rest(_a, ["children", "label", "unstyled", "style", "onPress", "position"]);
    var t = useTheme();
    var context = useContextMenuContext();
    var playHaptic = useHaptics();
    var _b = useInteractionState(), focused = _b.state, onFocus = _b.onIn, onBlur = _b.onOut;
    var _c = useInteractionState(), pressed = _c.state, onPressIn = _c.onIn, onPressOut = _c.onOut;
    var id = useId();
    var align = useContextMenuMenuContext().align;
    var close = context.close, measurement = context.measurement, registerHoverable = context.registerHoverable;
    var handleLayout = useCallback(function (evt) {
        if (!measurement)
            return; // should be impossible
        var layout = evt.nativeEvent.layout;
        var yOffset = position
            ? position.y
            : measurement.y + measurement.height + tokens.space.xs;
        var xOffset = position
            ? position.x
            : align === 'left'
                ? measurement.x
                : measurement.x + measurement.width - layout.width;
        registerHoverable(id, {
            width: layout.width,
            height: layout.height,
            y: yOffset + layout.y,
            x: xOffset + layout.x,
        }, function () {
            close();
            onPress();
        });
    }, [id, measurement, registerHoverable, close, onPress, align, position]);
    var itemContext = useMemo(function () { return ({ disabled: Boolean(rest.disabled) }); }, [rest.disabled]);
    return (_jsx(Pressable, __assign({}, rest, { onLayout: handleLayout, accessibilityHint: "", accessibilityLabel: label, onFocus: onFocus, onBlur: onBlur, onPress: function (e) {
            close();
            onPress === null || onPress === void 0 ? void 0 : onPress(e);
        }, onPressIn: function (e) {
            var _a;
            onPressIn();
            (_a = rest.onPressIn) === null || _a === void 0 ? void 0 : _a.call(rest, e);
            playHaptic('Light');
        }, onPressOut: function (e) {
            var _a;
            onPressOut();
            (_a = rest.onPressOut) === null || _a === void 0 ? void 0 : _a.call(rest, e);
        }, style: [
            !unstyled && [
                a.flex_row,
                a.align_center,
                a.gap_sm,
                a.px_md,
                a.rounded_md,
                a.border,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
                { minHeight: 44, paddingVertical: 10 },
                (focused || pressed || context.hoveredMenuItem === id) &&
                    !rest.disabled &&
                    t.atoms.bg_contrast_50,
            ],
            style,
        ], children: _jsx(ItemContext.Provider, { value: itemContext, children: typeof children === 'function'
                ? children((focused || pressed || context.hoveredMenuItem === id) &&
                    !rest.disabled)
                : children }) })));
}
export function ItemText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var disabled = useContextMenuItemContext().disabled;
    return (_jsx(Text, { numberOfLines: 2, ellipsizeMode: "middle", style: [
            a.flex_1,
            a.text_md,
            a.font_semi_bold,
            t.atoms.text_contrast_high,
            { paddingTop: 3 },
            style,
            disabled && t.atoms.text_contrast_low,
        ], children: children }));
}
export function ItemIcon(_a) {
    var Comp = _a.icon;
    var t = useTheme();
    var disabled = useContextMenuItemContext().disabled;
    return (_jsx(Comp, { size: "lg", fill: disabled
            ? t.atoms.text_contrast_low.color
            : t.atoms.text_contrast_medium.color }));
}
export function ItemRadio(_a) {
    var selected = _a.selected;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.border_contrast_high,
            {
                borderWidth: 1,
                height: 20,
                width: 20,
            },
        ], children: selected ? (_jsx(View, { style: [
                a.absolute,
                a.rounded_full,
                { height: 14, width: 14 },
                selected ? { backgroundColor: t.palette.primary_500 } : {},
            ] })) : null }));
}
export function LabelText(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsx(Text, { style: [
            a.font_semi_bold,
            t.atoms.text_contrast_medium,
            { marginBottom: -8 },
        ], children: children }));
}
export function Divider() {
    var t = useTheme();
    return (_jsx(View, { style: [t.atoms.border_contrast_low, a.flex_1, { borderTopWidth: 3 }] }));
}
function getHoveredHoverable(evt, hoverables, translation) {
    'worklet';
    var x = evt.absoluteX;
    var y = evt.absoluteY;
    var yOffset = translation.get();
    var rects = Object.values(hoverables.get());
    for (var _i = 0, rects_1 = rects; _i < rects_1.length; _i++) {
        var _a = rects_1[_i], id = _a.id, rect = _a.rect;
        var isWithinLeftBound = x >= rect.x;
        var isWithinRightBound = x <= rect.x + rect.width;
        var isWithinTopBound = y >= rect.y + yOffset;
        var isWithinBottomBound = y <= rect.y + rect.height + yOffset;
        if (isWithinLeftBound &&
            isWithinRightBound &&
            isWithinTopBound &&
            isWithinBottomBound) {
            return id;
        }
    }
    return null;
}
var templateObject_1;
