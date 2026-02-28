import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsKeyboardVisible } from '#/lib/hooks/useIsKeyboardVisible';
import { GlobalGestureEventsProvider } from '#/state/global-gesture-events';
import { atoms as a, select, useTheme } from '#/alf';
import { useOnGesture } from '#/components/hooks/useOnGesture';
import { createPortalGroup, Portal as RootPortal } from '#/components/Portal';
import { ARROW_HALF_SIZE, ARROW_SIZE, BUBBLE_MAX_WIDTH, MIN_EDGE_SPACE, } from '#/components/Tooltip/const';
import { Text } from '#/components/Typography';
var TooltipPortal = createPortalGroup();
var TooltipProviderContext = createContext(null);
/**
 * Provider for Tooltip component. Only needed when you need to position the tooltip relative to a container,
 * such as in the composer sheet.
 *
 * Only really necessary on iOS but can work on Android.
 */
export function SheetCompatProvider(_a) {
    var children = _a.children;
    var ref = useRef(null);
    return (_jsx(GlobalGestureEventsProvider, { style: [a.flex_1], children: _jsxs(TooltipPortal.Provider, { children: [_jsx(View, { ref: ref, collapsable: false, style: [a.flex_1], children: _jsx(TooltipProviderContext, { value: ref, children: children }) }), _jsx(TooltipPortal.Outlet, {})] }) }));
}
SheetCompatProvider.displayName = 'TooltipSheetCompatProvider';
/**
 * These are native specific values, not shared with web
 */
var ARROW_VISUAL_OFFSET = ARROW_SIZE / 1.25; // vibes-based, slightly off the target
var BUBBLE_SHADOW_OFFSET = ARROW_SIZE / 3; // vibes-based, provide more shadow beneath tip
var TooltipContext = createContext({
    position: 'bottom',
    visible: false,
    onVisibleChange: function () { },
});
TooltipContext.displayName = 'TooltipContext';
var TargetContext = createContext({
    targetMeasurements: undefined,
    setTargetMeasurements: function () { },
    shouldMeasure: false,
});
TargetContext.displayName = 'TargetContext';
export function Outer(_a) {
    var children = _a.children, _b = _a.position, position = _b === void 0 ? 'bottom' : _b, requestVisible = _a.visible, onVisibleChange = _a.onVisibleChange;
    /**
     * Lagging state to track the externally-controlled visibility of the
     * tooltip, which needs to wait for the target to be measured before
     * actually being shown.
     */
    var _c = useState(false), visible = _c[0], setVisible = _c[1];
    var _d = useState(undefined), targetMeasurements = _d[0], setTargetMeasurements = _d[1];
    if (requestVisible && !visible && targetMeasurements) {
        setVisible(true);
    }
    else if (!requestVisible && visible) {
        setVisible(false);
        setTargetMeasurements(undefined);
    }
    var ctx = useMemo(function () { return ({ position: position, visible: visible, onVisibleChange: onVisibleChange }); }, [position, visible, onVisibleChange]);
    var targetCtx = useMemo(function () { return ({
        targetMeasurements: targetMeasurements,
        setTargetMeasurements: setTargetMeasurements,
        shouldMeasure: requestVisible,
    }); }, [requestVisible, targetMeasurements, setTargetMeasurements]);
    return (_jsx(TooltipContext.Provider, { value: ctx, children: _jsx(TargetContext.Provider, { value: targetCtx, children: children }) }));
}
export function Target(_a) {
    var children = _a.children;
    var _b = useContext(TargetContext), shouldMeasure = _b.shouldMeasure, setTargetMeasurements = _b.setTargetMeasurements;
    var _c = useState(false), hasLayedOut = _c[0], setHasLayedOut = _c[1];
    var targetRef = useRef(null);
    var containerRef = useContext(TooltipProviderContext);
    var keyboardIsOpen = useIsKeyboardVisible();
    useEffect(function () {
        var _a, _b;
        if (!shouldMeasure || !hasLayedOut)
            return;
        /*
         * Once opened, measure the dimensions and position of the target
         */
        if (containerRef === null || containerRef === void 0 ? void 0 : containerRef.current) {
            (_a = targetRef.current) === null || _a === void 0 ? void 0 : _a.measureLayout(containerRef.current, function (x, y, width, height) {
                if (x !== undefined && y !== undefined && width && height) {
                    setTargetMeasurements({ x: x, y: y, width: width, height: height });
                }
            });
        }
        else {
            (_b = targetRef.current) === null || _b === void 0 ? void 0 : _b.measure(function (_x, _y, width, height, x, y) {
                if (x !== undefined && y !== undefined && width && height) {
                    setTargetMeasurements({ x: x, y: y, width: width, height: height });
                }
            });
        }
    }, [
        shouldMeasure,
        setTargetMeasurements,
        hasLayedOut,
        containerRef,
        keyboardIsOpen,
    ]);
    return (_jsx(View, { collapsable: false, ref: targetRef, onLayout: function () { return setHasLayedOut(true); }, children: children }));
}
export function Content(_a) {
    var children = _a.children, label = _a.label;
    var _b = useContext(TooltipContext), position = _b.position, visible = _b.visible, onVisibleChange = _b.onVisibleChange;
    var targetMeasurements = useContext(TargetContext).targetMeasurements;
    var isWithinProvider = !!useContext(TooltipProviderContext);
    var requestClose = useCallback(function () {
        onVisibleChange(false);
    }, [onVisibleChange]);
    if (!visible || !targetMeasurements)
        return null;
    var Portal = isWithinProvider ? TooltipPortal.Portal : RootPortal;
    return (_jsx(Portal, { children: _jsx(Bubble, { label: label, position: position, 
            /*
             * Gotta pass these in here. Inside the Bubble, we're Potal-ed outside
             * the context providers.
             */
            targetMeasurements: targetMeasurements, requestClose: requestClose, children: children }) }));
}
function Bubble(_a) {
    var children = _a.children, label = _a.label, position = _a.position, requestClose = _a.requestClose, targetMeasurements = _a.targetMeasurements;
    var t = useTheme();
    var insets = useSafeAreaInsets();
    var dimensions = useWindowDimensions();
    var _b = useState(undefined), bubbleMeasurements = _b[0], setBubbleMeasurements = _b[1];
    var coords = useMemo(function () {
        if (!bubbleMeasurements)
            return {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                tipTop: 0,
                tipLeft: 0,
            };
        var ww = dimensions.width, wh = dimensions.height;
        var maxTop = insets.top;
        var maxBottom = wh - insets.bottom;
        var cw = bubbleMeasurements.width, ch = bubbleMeasurements.height;
        var minLeft = MIN_EDGE_SPACE;
        var maxLeft = ww - minLeft;
        var computedPosition = position;
        var top = targetMeasurements.y + targetMeasurements.height;
        var left = Math.max(minLeft, targetMeasurements.x + targetMeasurements.width / 2 - cw / 2);
        var tipTranslate = ARROW_HALF_SIZE * -1;
        var tipTop = tipTranslate;
        if (left + cw > maxLeft) {
            left -= left + cw - maxLeft;
        }
        var tipLeft = targetMeasurements.x -
            left +
            targetMeasurements.width / 2 -
            ARROW_HALF_SIZE;
        var bottom = top + ch;
        function positionTop() {
            top = top - ch - targetMeasurements.height;
            bottom = top + ch;
            tipTop = tipTop + ch;
            computedPosition = 'top';
        }
        function positionBottom() {
            top = targetMeasurements.y + targetMeasurements.height;
            bottom = top + ch;
            tipTop = tipTranslate;
            computedPosition = 'bottom';
        }
        if (position === 'top') {
            positionTop();
            if (top < maxTop) {
                positionBottom();
            }
        }
        else {
            if (bottom > maxBottom) {
                positionTop();
            }
        }
        if (computedPosition === 'bottom') {
            top += ARROW_VISUAL_OFFSET;
            bottom += ARROW_VISUAL_OFFSET;
        }
        else {
            top -= ARROW_VISUAL_OFFSET;
            bottom -= ARROW_VISUAL_OFFSET;
        }
        return {
            computedPosition: computedPosition,
            top: top,
            bottom: bottom,
            left: left,
            right: left + cw,
            tipTop: tipTop,
            tipLeft: tipLeft,
        };
    }, [position, targetMeasurements, bubbleMeasurements, insets, dimensions]);
    var requestCloseWrapped = useCallback(function () {
        setBubbleMeasurements(undefined);
        requestClose();
    }, [requestClose]);
    useOnGesture(useCallback(function (e) {
        var x = e.x, y = e.y;
        var isInside = x > coords.left &&
            x < coords.right &&
            y > coords.top &&
            y < coords.bottom;
        if (!isInside) {
            requestCloseWrapped();
        }
    }, [coords, requestCloseWrapped]));
    return (_jsx(View, { accessible: true, role: "alert", accessibilityHint: "", accessibilityLabel: label, 
        // android
        importantForAccessibility: "yes", 
        // ios
        accessibilityViewIsModal: true, style: [
            a.absolute,
            a.align_start,
            {
                width: BUBBLE_MAX_WIDTH,
                opacity: bubbleMeasurements ? 1 : 0,
                top: coords.top,
                left: coords.left,
            },
        ], children: _jsxs(Animated.View, { entering: ZoomIn.easing(Easing.out(Easing.exp)), style: { transformOrigin: oppposite(position) }, children: [_jsx(View, { style: [
                        a.absolute,
                        a.top_0,
                        a.z_10,
                        t.atoms.bg,
                        select(t.name, {
                            light: t.atoms.bg,
                            dark: t.atoms.bg_contrast_100,
                            dim: t.atoms.bg_contrast_100,
                        }),
                        {
                            borderTopLeftRadius: a.rounded_2xs.borderRadius,
                            borderBottomRightRadius: a.rounded_2xs.borderRadius,
                            width: ARROW_SIZE,
                            height: ARROW_SIZE,
                            transform: [{ rotate: '45deg' }],
                            top: coords.tipTop,
                            left: coords.tipLeft,
                        },
                    ] }), _jsx(View, { style: [
                        a.px_md,
                        a.py_sm,
                        a.rounded_sm,
                        select(t.name, {
                            light: t.atoms.bg,
                            dark: t.atoms.bg_contrast_100,
                            dim: t.atoms.bg_contrast_100,
                        }),
                        t.atoms.shadow_md,
                        {
                            shadowOpacity: 0.2,
                            shadowOffset: {
                                width: 0,
                                height: BUBBLE_SHADOW_OFFSET *
                                    (coords.computedPosition === 'bottom' ? -1 : 1),
                            },
                        },
                    ], onLayout: function (e) {
                        setBubbleMeasurements({
                            width: e.nativeEvent.layout.width,
                            height: e.nativeEvent.layout.height,
                        });
                    }, children: children })] }) }));
}
function oppposite(position) {
    switch (position) {
        case 'top':
            return 'center bottom';
        case 'bottom':
            return 'center top';
        default:
            return 'center';
    }
}
export function TextBubble(_a) {
    var children = _a.children;
    var c = Children.toArray(children);
    return (_jsx(Content, { label: c.join(' '), children: _jsx(View, { style: [a.gap_xs], children: c.map(function (child, i) { return (_jsx(Text, { style: [a.text_sm, a.leading_snug], children: child }, i)); }) }) }));
}
