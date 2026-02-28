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
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo } from 'react';
import { Pressable, View, } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { HITSLOP_10 } from '#/lib/constants';
import { useHaptics } from '#/lib/haptics';
import { atoms as a, native, platform, useTheme, } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { CheckThick_Stroke2_Corner0_Rounded as Checkmark } from '#/components/icons/Check';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
export * from './Panel';
var ItemContext = createContext({
    name: '',
    selected: false,
    disabled: false,
    isInvalid: false,
    hovered: false,
    pressed: false,
    focused: false,
});
ItemContext.displayName = 'ToggleItemContext';
var GroupContext = createContext({
    type: 'checkbox',
    values: [],
    disabled: false,
    maxSelectionsReached: false,
    setFieldValue: function () { },
});
GroupContext.displayName = 'ToggleGroupContext';
export function useItemContext() {
    return useContext(ItemContext);
}
export function Group(_a) {
    var children = _a.children, providedValues = _a.values, onChange = _a.onChange, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.type, type = _c === void 0 ? 'checkbox' : _c, maxSelections = _a.maxSelections, label = _a.label, style = _a.style;
    var groupRole = type === 'radio' ? 'radiogroup' : undefined;
    var values = type === 'radio' ? providedValues.slice(0, 1) : providedValues;
    var setFieldValue = useCallback(function (_a) {
        var name = _a.name, value = _a.value;
        if (type === 'checkbox') {
            var pruned = values.filter(function (v) { return v !== name; });
            var next = value ? pruned.concat(name) : pruned;
            onChange(next);
        }
        else {
            onChange([name]);
        }
    }, [type, onChange, values]);
    var maxReached = !!(type === 'checkbox' &&
        maxSelections &&
        values.length >= maxSelections);
    var context = useMemo(function () { return ({
        values: values,
        type: type,
        disabled: disabled,
        maxSelectionsReached: maxReached,
        setFieldValue: setFieldValue,
    }); }, [values, disabled, type, maxReached, setFieldValue]);
    return (_jsx(GroupContext.Provider, { value: context, children: _jsx(View, __assign({ style: [a.w_full, style], role: groupRole }, (groupRole === 'radiogroup'
            ? {
                'aria-label': label,
                accessibilityLabel: label,
                accessibilityRole: groupRole,
            }
            : {}), { children: children })) }));
}
export function Item(_a) {
    var children = _a.children, name = _a.name, _b = _a.value, value = _b === void 0 ? false : _b, _c = _a.disabled, itemDisabled = _c === void 0 ? false : _c, onChange = _a.onChange, isInvalid = _a.isInvalid, style = _a.style, _d = _a.type, type = _d === void 0 ? 'checkbox' : _d, label = _a.label, rest = __rest(_a, ["children", "name", "value", "disabled", "onChange", "isInvalid", "style", "type", "label"]);
    var _e = useContext(GroupContext), selectedValues = _e.values, groupType = _e.type, groupDisabled = _e.disabled, setFieldValue = _e.setFieldValue, maxSelectionsReached = _e.maxSelectionsReached;
    var _f = useInteractionState(), hovered = _f.state, onHoverIn = _f.onIn, onHoverOut = _f.onOut;
    var _g = useInteractionState(), pressed = _g.state, onPressIn = _g.onIn, onPressOut = _g.onOut;
    var _h = useInteractionState(), focused = _h.state, onFocus = _h.onIn, onBlur = _h.onOut;
    var playHaptic = useHaptics();
    var role = groupType === 'radio' ? 'radio' : type;
    var selected = selectedValues.includes(name) || !!value;
    var disabled = groupDisabled || itemDisabled || (!selected && maxSelectionsReached);
    var onPress = useCallback(function () {
        playHaptic('Light');
        var next = !selected;
        setFieldValue({ name: name, value: next });
        onChange === null || onChange === void 0 ? void 0 : onChange(next);
    }, [playHaptic, name, selected, onChange, setFieldValue]);
    var state = useMemo(function () { return ({
        name: name,
        selected: selected,
        disabled: disabled !== null && disabled !== void 0 ? disabled : false,
        isInvalid: isInvalid !== null && isInvalid !== void 0 ? isInvalid : false,
        hovered: hovered,
        pressed: pressed,
        focused: focused,
    }); }, [name, selected, disabled, hovered, pressed, focused, isInvalid]);
    return (_jsx(ItemContext.Provider, { value: state, children: _jsx(Pressable, __assign({ accessibilityHint: undefined, hitSlop: HITSLOP_10 }, rest, { disabled: disabled, "aria-disabled": disabled !== null && disabled !== void 0 ? disabled : false, "aria-checked": selected, "aria-invalid": isInvalid, "aria-label": label, role: role, accessibilityRole: role, accessibilityState: {
                disabled: disabled !== null && disabled !== void 0 ? disabled : false,
                selected: selected,
            }, accessibilityLabel: label, onPress: onPress, onHoverIn: onHoverIn, onHoverOut: onHoverOut, onPressIn: onPressIn, onPressOut: onPressOut, onFocus: onFocus, onBlur: onBlur, style: [a.flex_row, a.align_center, a.gap_sm, style], children: typeof children === 'function' ? children(state) : children })) }));
}
export function LabelText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var disabled = useItemContext().disabled;
    return (_jsx(Text, { style: [
            a.font_semi_bold,
            a.leading_tight,
            a.user_select_none,
            {
                color: disabled
                    ? t.atoms.text_contrast_low.color
                    : t.atoms.text_contrast_high.color,
            },
            native({
                paddingTop: 2,
            }),
            style,
        ], children: children }));
}
// TODO(eric) refactor to memoize styles without knowledge of state
export function createSharedToggleStyles(_a) {
    var t = _a.theme, hovered = _a.hovered, selected = _a.selected, disabled = _a.disabled, isInvalid = _a.isInvalid;
    var base = [];
    var baseHover = [];
    var indicator = [];
    if (selected) {
        base.push({
            backgroundColor: t.palette.primary_500,
            borderColor: t.palette.primary_500,
        });
        if (hovered) {
            baseHover.push({
                backgroundColor: t.palette.primary_400,
                borderColor: t.palette.primary_400,
            });
        }
    }
    else {
        base.push({
            backgroundColor: t.palette.contrast_25,
            borderColor: t.palette.contrast_100,
        });
        if (hovered) {
            baseHover.push({
                backgroundColor: t.palette.contrast_50,
                borderColor: t.palette.contrast_200,
            });
        }
    }
    if (isInvalid) {
        base.push({
            backgroundColor: t.palette.negative_25,
            borderColor: t.palette.negative_300,
        });
        if (hovered) {
            baseHover.push({
                backgroundColor: t.palette.negative_25,
                borderColor: t.palette.negative_600,
            });
        }
        if (selected) {
            base.push({
                backgroundColor: t.palette.negative_500,
                borderColor: t.palette.negative_500,
            });
            if (hovered) {
                baseHover.push({
                    backgroundColor: t.palette.negative_400,
                    borderColor: t.palette.negative_400,
                });
            }
        }
    }
    if (disabled) {
        base.push({
            backgroundColor: t.palette.contrast_100,
            borderColor: t.palette.contrast_400,
        });
        if (selected) {
            base.push({
                backgroundColor: t.palette.primary_100,
                borderColor: t.palette.contrast_400,
            });
        }
    }
    return {
        baseStyles: base,
        baseHoverStyles: disabled ? [] : baseHover,
        indicatorStyles: indicator,
    };
}
export function Checkbox() {
    var t = useTheme();
    var _a = useItemContext(), selected = _a.selected, hovered = _a.hovered, focused = _a.focused, disabled = _a.disabled, isInvalid = _a.isInvalid;
    var _b = createSharedToggleStyles({
        theme: t,
        hovered: hovered,
        focused: focused,
        selected: selected,
        disabled: disabled,
        isInvalid: isInvalid,
    }), baseStyles = _b.baseStyles, baseHoverStyles = _b.baseHoverStyles;
    return (_jsx(View, { style: [
            a.justify_center,
            a.align_center,
            t.atoms.border_contrast_high,
            a.transition_color,
            {
                borderWidth: 1,
                height: 24,
                width: 24,
                borderRadius: 6,
            },
            baseStyles,
            hovered ? baseHoverStyles : {},
        ], children: selected && _jsx(Checkmark, { width: 14, fill: t.palette.white }) }));
}
export function Switch() {
    var t = useTheme();
    var _a = useItemContext(), selected = _a.selected, hovered = _a.hovered, disabled = _a.disabled, isInvalid = _a.isInvalid;
    var _b = useMemo(function () {
        var base = [];
        var baseHover = [];
        var indicator = [];
        if (selected) {
            base.push({
                backgroundColor: t.palette.primary_500,
            });
            if (hovered) {
                baseHover.push({
                    backgroundColor: t.palette.primary_400,
                });
            }
        }
        else {
            base.push({
                backgroundColor: t.palette.contrast_200,
            });
            if (hovered) {
                baseHover.push({
                    backgroundColor: t.palette.contrast_100,
                });
            }
        }
        if (isInvalid) {
            base.push({
                backgroundColor: t.palette.negative_200,
            });
            if (hovered) {
                baseHover.push({
                    backgroundColor: t.palette.negative_100,
                });
            }
            if (selected) {
                base.push({
                    backgroundColor: t.palette.negative_500,
                });
                if (hovered) {
                    baseHover.push({
                        backgroundColor: t.palette.negative_400,
                    });
                }
            }
        }
        if (disabled) {
            base.push({
                backgroundColor: t.palette.contrast_50,
            });
            if (selected) {
                base.push({
                    backgroundColor: t.palette.primary_100,
                });
            }
        }
        return {
            baseStyles: base,
            baseHoverStyles: disabled ? [] : baseHover,
            indicatorStyles: indicator,
        };
    }, [t, hovered, disabled, selected, isInvalid]), baseStyles = _b.baseStyles, baseHoverStyles = _b.baseHoverStyles, indicatorStyles = _b.indicatorStyles;
    return (_jsx(View, { style: [
            a.relative,
            a.rounded_full,
            t.atoms.bg,
            {
                height: 28,
                width: 48,
                padding: 3,
            },
            a.transition_color,
            baseStyles,
            hovered ? baseHoverStyles : {},
        ], children: _jsx(Animated.View, { layout: LinearTransition.duration(platform({
                web: 100,
                default: 200,
            })).easing(Easing.inOut(Easing.cubic)), style: [
                a.rounded_full,
                {
                    backgroundColor: t.palette.white,
                    height: 22,
                    width: 22,
                },
                selected ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                indicatorStyles,
            ] }) }));
}
export function Radio() {
    var props = useContext(ItemContext);
    return _jsx(BaseRadio, __assign({}, props));
}
export function BaseRadio(_a) {
    var hovered = _a.hovered, focused = _a.focused, selected = _a.selected, disabled = _a.disabled, isInvalid = _a.isInvalid;
    var t = useTheme();
    var _b = createSharedToggleStyles({
        theme: t,
        hovered: hovered,
        focused: focused,
        selected: selected,
        disabled: disabled,
        isInvalid: isInvalid,
    }), baseStyles = _b.baseStyles, baseHoverStyles = _b.baseHoverStyles, indicatorStyles = _b.indicatorStyles;
    return (_jsx(View, { style: [
            a.justify_center,
            a.align_center,
            a.rounded_full,
            t.atoms.border_contrast_high,
            a.transition_color,
            {
                borderWidth: 1,
                height: 25,
                width: 25,
                margin: -1,
            },
            baseStyles,
            hovered ? baseHoverStyles : {},
        ], children: selected && (_jsx(View, { style: [
                a.absolute,
                a.rounded_full,
                { height: 12, width: 12 },
                { backgroundColor: t.palette.white },
                indicatorStyles,
            ] })) }));
}
export var Platform = IS_NATIVE ? Switch : Checkbox;
