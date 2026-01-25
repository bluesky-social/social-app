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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, } from 'react';
import { View } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { useHaptics } from '#/lib/haptics';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { atoms as a, native, platform, useTheme } from '#/alf';
import { Button, ButtonText, } from '../Button';
var InternalContext = createContext(null);
/**
 * Segmented control component.
 *
 * @example
 * ```tsx
 * <SegmentedControl.Root value={value} onChange={setValue}>
 *   <SegmentedControl.Item value="one">
 *     <SegmentedControl.ItemText value="one">
 *       One
 *     </SegmentedControl.ItemText>
 *   </SegmentedControl.Item>
 *   <SegmentedControl.Item value="two">
 *     <SegmentedControl.ItemText value="two">
 *       Two
 *     </SegmentedControl.ItemText>
 *   </SegmentedControl.Item>
 * </SegmentedControl.Root>
 * ```
 */
export function Root(_a) {
    var label = _a.label, _b = _a.type, type = _b === void 0 ? 'radio' : _b, _c = _a.size, size = _c === void 0 ? 'large' : _c, value = _a.value, onChange = _a.onChange, children = _a.children, style = _a.style, accessibilityHint = _a.accessibilityHint;
    var t = useTheme();
    var _d = useState(null), selectedPosition = _d[0], setSelectedPosition = _d[1];
    var contextValue = useMemo(function () {
        return {
            type: type,
            size: size,
            selectedValue: value,
            selectedPosition: selectedPosition,
            onSelectValue: function (val, position) {
                onChange(val);
                if (position)
                    setSelectedPosition(position);
            },
            updatePosition: function (position) {
                setSelectedPosition(function (currPos) {
                    if (currPos &&
                        currPos.width === position.width &&
                        currPos.x === position.x) {
                        return currPos;
                    }
                    return position;
                });
            },
        };
    }, [value, selectedPosition, setSelectedPosition, onChange, type, size]);
    return (_jsxs(View, { accessibilityLabel: label, accessibilityHint: accessibilityHint !== null && accessibilityHint !== void 0 ? accessibilityHint : '', style: [
            a.w_full,
            a.flex_1,
            a.relative,
            a.flex_row,
            t.atoms.bg_contrast_50,
            { borderRadius: 14 },
            a.curve_continuous,
            a.p_xs,
            style,
        ], role: type === 'tabs' ? 'tablist' : 'radiogroup', children: [selectedPosition !== null && (_jsx(Slider, { x: selectedPosition.x, width: selectedPosition.width })), _jsx(InternalContext.Provider, { value: contextValue, children: children })] }));
}
var InternalItemContext = createContext(null);
export function Item(_a) {
    var _b, _c;
    var value = _a.value, style = _a.style, children = _a.children, onPressProp = _a.onPress, props = __rest(_a, ["value", "style", "children", "onPress"]);
    var playHaptic = useHaptics();
    var _d = useState(null), position = _d[0], setPosition = _d[1];
    var ctx = useContext(InternalContext);
    if (!ctx)
        throw new Error('SegmentedControl.Item must be used within a SegmentedControl.Root');
    var active = ctx.selectedValue === value;
    // update position if change was external, and not due to onPress
    var needsUpdate = active &&
        position &&
        (((_b = ctx.selectedPosition) === null || _b === void 0 ? void 0 : _b.x) !== position.x ||
            ((_c = ctx.selectedPosition) === null || _c === void 0 ? void 0 : _c.width) !== position.width);
    // can't wait for `useEffectEvent`
    var update = useNonReactiveCallback(function () {
        if (position)
            ctx.updatePosition(position);
    });
    useLayoutEffect(function () {
        if (needsUpdate) {
            update();
        }
    }, [needsUpdate, update]);
    var onPress = useCallback(function (evt) {
        playHaptic('Light');
        ctx.onSelectValue(value, position);
        onPressProp === null || onPressProp === void 0 ? void 0 : onPressProp(evt);
    }, [ctx, value, position, onPressProp, playHaptic]);
    return (_jsx(View, { style: [a.flex_1, a.flex_row], onLayout: function (evt) {
            var measuredPosition = {
                x: evt.nativeEvent.layout.x,
                width: evt.nativeEvent.layout.width,
            };
            if (!ctx.selectedPosition && active) {
                ctx.onSelectValue(value, measuredPosition);
            }
            setPosition(measuredPosition);
        }, children: _jsx(Button, __assign({}, props, { onPress: onPress, role: ctx.type === 'tabs' ? 'tab' : 'radio', accessibilityState: { selected: active }, style: [
                a.flex_1,
                a.bg_transparent,
                a.px_sm,
                a.py_xs,
                { minHeight: ctx.size === 'large' ? 40 : 32 },
                style,
            ], children: function (_a) {
                var pressed = _a.pressed, hovered = _a.hovered, focused = _a.focused;
                return (_jsx(InternalItemContext.Provider, { value: { active: active, pressed: pressed, hovered: hovered, focused: focused }, children: children }));
            } })) }));
}
export function ItemText(_a) {
    var style = _a.style, props = __rest(_a, ["style"]);
    var t = useTheme();
    var ctx = useContext(InternalItemContext);
    if (!ctx)
        throw new Error('SegmentedControl.ItemText must be used within a SegmentedControl.Item');
    return (_jsx(ButtonText, __assign({}, props, { style: [
            a.text_center,
            a.text_md,
            a.font_medium,
            a.px_xs,
            ctx.active
                ? t.atoms.text
                : ctx.focused || ctx.hovered || ctx.pressed
                    ? t.atoms.text_contrast_medium
                    : t.atoms.text_contrast_low,
            style,
        ] })));
}
function Slider(_a) {
    var x = _a.x, width = _a.width;
    var t = useTheme();
    return (_jsx(Animated.View, { layout: native(LinearTransition.easing(Easing.out(Easing.exp))), style: [
            a.absolute,
            a.curve_continuous,
            t.atoms.bg,
            {
                top: 4,
                bottom: 4,
                left: 0,
                width: width,
                borderRadius: 10,
            },
            // TODO: new arch supports boxShadow on native
            // in the meantime this is an attempt to get close
            platform({
                web: {
                    boxShadow: '0px 2px 4px 0px #0000000D',
                },
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0x0d / 0xff,
                    shadowRadius: 4,
                },
                android: { elevation: 0.25 },
            }),
            platform({
                native: [{ left: x }],
                web: [{ transform: [{ translateX: x }] }, a.transition_transform],
            }),
        ] }));
}
