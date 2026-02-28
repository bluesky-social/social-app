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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Pressable, View, } from 'react-native';
import { atoms as a, flatten, select, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
var Context = React.createContext({
    hovered: false,
    focused: false,
    pressed: false,
    disabled: false,
});
Context.displayName = 'ButtonContext';
export function useButtonContext() {
    return React.useContext(Context);
}
export var Button = React.forwardRef(function (_a, ref) {
    var children = _a.children, variant = _a.variant, color = _a.color, size = _a.size, _b = _a.shape, shape = _b === void 0 ? 'default' : _b, label = _a.label, _c = _a.disabled, disabled = _c === void 0 ? false : _c, style = _a.style, hoverStyleProp = _a.hoverStyle, _d = _a.PressableComponent, PressableComponent = _d === void 0 ? Pressable : _d, onPressInOuter = _a.onPressIn, onPressOutOuter = _a.onPressOut, onHoverInOuter = _a.onHoverIn, onHoverOutOuter = _a.onHoverOut, onFocusOuter = _a.onFocus, onBlurOuter = _a.onBlur, rest = __rest(_a, ["children", "variant", "color", "size", "shape", "label", "disabled", "style", "hoverStyle", "PressableComponent", "onPressIn", "onPressOut", "onHoverIn", "onHoverOut", "onFocus", "onBlur"]);
    /**
     * The `variant` prop is deprecated in favor of simply specifying `color`.
     * If a `color` is set, then we want to use the existing codepaths for
     * "solid" buttons. This is to maintain backwards compatibility.
     */
    if (!variant && color) {
        variant = 'solid';
    }
    var t = useTheme();
    var _e = React.useState({
        pressed: false,
        hovered: false,
        focused: false,
    }), state = _e[0], setState = _e[1];
    var onPressIn = React.useCallback(function (e) {
        setState(function (s) { return (__assign(__assign({}, s), { pressed: true })); });
        onPressInOuter === null || onPressInOuter === void 0 ? void 0 : onPressInOuter(e);
    }, [setState, onPressInOuter]);
    var onPressOut = React.useCallback(function (e) {
        setState(function (s) { return (__assign(__assign({}, s), { pressed: false })); });
        onPressOutOuter === null || onPressOutOuter === void 0 ? void 0 : onPressOutOuter(e);
    }, [setState, onPressOutOuter]);
    var onHoverIn = React.useCallback(function (e) {
        setState(function (s) { return (__assign(__assign({}, s), { hovered: true })); });
        onHoverInOuter === null || onHoverInOuter === void 0 ? void 0 : onHoverInOuter(e);
    }, [setState, onHoverInOuter]);
    var onHoverOut = React.useCallback(function (e) {
        setState(function (s) { return (__assign(__assign({}, s), { hovered: false })); });
        onHoverOutOuter === null || onHoverOutOuter === void 0 ? void 0 : onHoverOutOuter(e);
    }, [setState, onHoverOutOuter]);
    var onFocus = React.useCallback(function (e) {
        setState(function (s) { return (__assign(__assign({}, s), { focused: true })); });
        onFocusOuter === null || onFocusOuter === void 0 ? void 0 : onFocusOuter(e);
    }, [setState, onFocusOuter]);
    var onBlur = React.useCallback(function (e) {
        setState(function (s) { return (__assign(__assign({}, s), { focused: false })); });
        onBlurOuter === null || onBlurOuter === void 0 ? void 0 : onBlurOuter(e);
    }, [setState, onBlurOuter]);
    var _f = React.useMemo(function () {
        var baseStyles = [];
        var hoverStyles = [];
        /*
         * This is the happy path for new button styles, following the
         * deprecation of `variant` prop. This redundant `variant` check is here
         * just to make this handling easier to understand.
         */
        if (variant === 'solid') {
            if (color === 'primary') {
                if (!disabled) {
                    baseStyles.push({
                        backgroundColor: t.palette.primary_500,
                    });
                    hoverStyles.push({
                        backgroundColor: t.palette.primary_600,
                    });
                }
                else {
                    baseStyles.push({
                        backgroundColor: t.palette.primary_200,
                    });
                }
            }
            else if (color === 'secondary') {
                if (!disabled) {
                    baseStyles.push(t.atoms.bg_contrast_50);
                    hoverStyles.push(t.atoms.bg_contrast_100);
                }
                else {
                    baseStyles.push(t.atoms.bg_contrast_50);
                }
            }
            else if (color === 'secondary_inverted') {
                if (!disabled) {
                    baseStyles.push({
                        backgroundColor: t.palette.contrast_900,
                    });
                    hoverStyles.push({
                        backgroundColor: t.palette.contrast_975,
                    });
                }
                else {
                    baseStyles.push({
                        backgroundColor: t.palette.contrast_600,
                    });
                }
            }
            else if (color === 'negative') {
                if (!disabled) {
                    baseStyles.push({
                        backgroundColor: t.palette.negative_500,
                    });
                    hoverStyles.push({
                        backgroundColor: t.palette.negative_600,
                    });
                }
                else {
                    baseStyles.push({
                        backgroundColor: t.palette.negative_700,
                    });
                }
            }
            else if (color === 'primary_subtle') {
                if (!disabled) {
                    baseStyles.push({
                        backgroundColor: t.palette.primary_50,
                    });
                    hoverStyles.push({
                        backgroundColor: t.palette.primary_100,
                    });
                }
                else {
                    baseStyles.push({
                        backgroundColor: t.palette.primary_50,
                    });
                }
            }
            else if (color === 'negative_subtle') {
                if (!disabled) {
                    baseStyles.push({
                        backgroundColor: t.palette.negative_50,
                    });
                    hoverStyles.push({
                        backgroundColor: t.palette.negative_100,
                    });
                }
                else {
                    baseStyles.push({
                        backgroundColor: t.palette.negative_50,
                    });
                }
            }
        }
        else {
            /*
             * BEGIN DEPRECATED STYLES
             */
            if (color === 'primary') {
                if (variant === 'outline') {
                    baseStyles.push(a.border, t.atoms.bg, {
                        borderWidth: 1,
                    });
                    if (!disabled) {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.primary_500,
                        });
                        hoverStyles.push(a.border, {
                            backgroundColor: t.palette.primary_50,
                        });
                    }
                    else {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.primary_200,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push(t.atoms.bg);
                        hoverStyles.push({
                            backgroundColor: t.palette.primary_100,
                        });
                    }
                }
            }
            else if (color === 'secondary') {
                if (variant === 'outline') {
                    baseStyles.push(a.border, t.atoms.bg, {
                        borderWidth: 1,
                    });
                    if (!disabled) {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.contrast_300,
                        });
                        hoverStyles.push(t.atoms.bg_contrast_50);
                    }
                    else {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.contrast_200,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push(t.atoms.bg);
                        hoverStyles.push({
                            backgroundColor: t.palette.contrast_50,
                        });
                    }
                }
            }
            else if (color === 'secondary_inverted') {
                if (variant === 'outline') {
                    baseStyles.push(a.border, t.atoms.bg, {
                        borderWidth: 1,
                    });
                    if (!disabled) {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.contrast_300,
                        });
                        hoverStyles.push(t.atoms.bg_contrast_50);
                    }
                    else {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.contrast_200,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push(t.atoms.bg);
                        hoverStyles.push({
                            backgroundColor: t.palette.contrast_50,
                        });
                    }
                }
            }
            else if (color === 'negative') {
                if (variant === 'outline') {
                    baseStyles.push(a.border, t.atoms.bg, {
                        borderWidth: 1,
                    });
                    if (!disabled) {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.negative_500,
                        });
                        hoverStyles.push(a.border, {
                            backgroundColor: t.palette.negative_50,
                        });
                    }
                    else {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.negative_200,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push(t.atoms.bg);
                        hoverStyles.push({
                            backgroundColor: t.palette.negative_100,
                        });
                    }
                }
            }
            else if (color === 'negative_subtle') {
                if (variant === 'outline') {
                    baseStyles.push(a.border, t.atoms.bg, {
                        borderWidth: 1,
                    });
                    if (!disabled) {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.negative_500,
                        });
                        hoverStyles.push(a.border, {
                            backgroundColor: t.palette.negative_50,
                        });
                    }
                    else {
                        baseStyles.push(a.border, {
                            borderColor: t.palette.negative_200,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push(t.atoms.bg);
                        hoverStyles.push({
                            backgroundColor: t.palette.negative_100,
                        });
                    }
                }
            }
            /*
             * END DEPRECATED STYLES
             */
        }
        if (shape === 'default') {
            if (size === 'large') {
                baseStyles.push(a.rounded_full, {
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    gap: 6,
                });
            }
            else if (size === 'small') {
                baseStyles.push(a.rounded_full, {
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    gap: 5,
                });
            }
            else if (size === 'tiny') {
                baseStyles.push(a.rounded_full, {
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    gap: 3,
                });
            }
        }
        else if (shape === 'rectangular') {
            if (size === 'large') {
                baseStyles.push({
                    paddingVertical: 12,
                    paddingHorizontal: 25,
                    borderRadius: 10,
                    gap: 3,
                });
            }
            else if (size === 'small') {
                baseStyles.push({
                    paddingVertical: 8,
                    paddingHorizontal: 13,
                    borderRadius: 8,
                    gap: 3,
                });
            }
            else if (size === 'tiny') {
                baseStyles.push({
                    paddingVertical: 5,
                    paddingHorizontal: 9,
                    borderRadius: 6,
                    gap: 2,
                });
            }
        }
        else if (shape === 'round' || shape === 'square') {
            /*
             * These sizes match the actual rendered size on screen, based on
             * Chrome's web inspector
             */
            if (size === 'large') {
                if (shape === 'round') {
                    baseStyles.push({ height: 44, width: 44 });
                }
                else {
                    baseStyles.push({ height: 44, width: 44 });
                }
            }
            else if (size === 'small') {
                if (shape === 'round') {
                    baseStyles.push({ height: 33, width: 33 });
                }
                else {
                    baseStyles.push({ height: 33, width: 33 });
                }
            }
            else if (size === 'tiny') {
                if (shape === 'round') {
                    baseStyles.push({ height: 25, width: 25 });
                }
                else {
                    baseStyles.push({ height: 25, width: 25 });
                }
            }
            if (shape === 'round') {
                baseStyles.push(a.rounded_full);
            }
            else if (shape === 'square') {
                if (size === 'tiny') {
                    baseStyles.push({
                        borderRadius: 6,
                    });
                }
                else {
                    baseStyles.push(a.rounded_sm);
                }
            }
        }
        return {
            baseStyles: baseStyles,
            hoverStyles: hoverStyles,
        };
    }, [t, variant, color, size, shape, disabled]), baseStyles = _f.baseStyles, hoverStyles = _f.hoverStyles;
    var context = React.useMemo(function () { return (__assign(__assign({}, state), { variant: variant, color: color, size: size, shape: shape, disabled: disabled || false })); }, [state, variant, color, size, shape, disabled]);
    return (_jsx(PressableComponent, __assign({ role: "button", accessibilityHint: undefined }, rest, { 
        // @ts-ignore - this will always be a pressable
        ref: ref, "aria-label": label, "aria-pressed": state.pressed, accessibilityLabel: label, disabled: disabled || false, accessibilityState: {
            disabled: disabled || false,
        }, style: __spreadArray([
            a.flex_row,
            a.align_center,
            a.justify_center,
            a.curve_continuous,
            baseStyles,
            style
        ], (state.hovered || state.pressed
            ? [hoverStyles, hoverStyleProp]
            : []), true), onPressIn: onPressIn, onPressOut: onPressOut, onHoverIn: onHoverIn, onHoverOut: onHoverOut, onFocus: onFocus, onBlur: onBlur, children: _jsx(Context.Provider, { value: context, children: typeof children === 'function' ? children(context) : children }) })));
});
Button.displayName = 'Button';
export function useSharedButtonTextStyles() {
    var t = useTheme();
    var _a = useButtonContext(), color = _a.color, variant = _a.variant, disabled = _a.disabled, size = _a.size;
    return React.useMemo(function () {
        var baseStyles = [];
        /*
         * This is the happy path for new button styles, following the
         * deprecation of `variant` prop. This redundant `variant` check is here
         * just to make this handling easier to understand.
         */
        if (variant === 'solid') {
            if (color === 'primary') {
                if (!disabled) {
                    baseStyles.push({ color: t.palette.white });
                }
                else {
                    baseStyles.push({
                        color: select(t.name, {
                            light: t.palette.white,
                            dim: t.atoms.text_inverted.color,
                            dark: t.atoms.text_inverted.color,
                        }),
                    });
                }
            }
            else if (color === 'secondary') {
                if (!disabled) {
                    baseStyles.push(t.atoms.text_contrast_medium);
                }
                else {
                    baseStyles.push({
                        color: t.palette.contrast_300,
                    });
                }
            }
            else if (color === 'secondary_inverted') {
                if (!disabled) {
                    baseStyles.push(t.atoms.text_inverted);
                }
                else {
                    baseStyles.push({
                        color: t.palette.contrast_300,
                    });
                }
            }
            else if (color === 'negative') {
                if (!disabled) {
                    baseStyles.push({ color: t.palette.white });
                }
                else {
                    baseStyles.push({ color: t.palette.negative_300 });
                }
            }
            else if (color === 'primary_subtle') {
                if (!disabled) {
                    baseStyles.push({
                        color: t.palette.primary_600,
                    });
                }
                else {
                    baseStyles.push({
                        color: t.palette.primary_200,
                    });
                }
            }
            else if (color === 'negative_subtle') {
                if (!disabled) {
                    baseStyles.push({
                        color: t.palette.negative_600,
                    });
                }
                else {
                    baseStyles.push({
                        color: t.palette.negative_200,
                    });
                }
            }
        }
        else {
            /*
             * BEGIN DEPRECATED STYLES
             */
            if (color === 'primary') {
                if (variant === 'outline') {
                    if (!disabled) {
                        baseStyles.push({
                            color: t.palette.primary_600,
                        });
                    }
                    else {
                        baseStyles.push({ color: t.palette.primary_600, opacity: 0.5 });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push({ color: t.palette.primary_600 });
                    }
                    else {
                        baseStyles.push({ color: t.palette.primary_600, opacity: 0.5 });
                    }
                }
            }
            else if (color === 'secondary') {
                if (variant === 'outline') {
                    if (!disabled) {
                        baseStyles.push({
                            color: t.palette.contrast_600,
                        });
                    }
                    else {
                        baseStyles.push({
                            color: t.palette.contrast_300,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push({
                            color: t.palette.contrast_600,
                        });
                    }
                    else {
                        baseStyles.push({
                            color: t.palette.contrast_300,
                        });
                    }
                }
            }
            else if (color === 'secondary_inverted') {
                if (variant === 'outline') {
                    if (!disabled) {
                        baseStyles.push({
                            color: t.palette.contrast_600,
                        });
                    }
                    else {
                        baseStyles.push({
                            color: t.palette.contrast_300,
                        });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push({
                            color: t.palette.contrast_600,
                        });
                    }
                    else {
                        baseStyles.push({
                            color: t.palette.contrast_300,
                        });
                    }
                }
            }
            else if (color === 'negative') {
                if (variant === 'outline') {
                    if (!disabled) {
                        baseStyles.push({ color: t.palette.negative_400 });
                    }
                    else {
                        baseStyles.push({ color: t.palette.negative_400, opacity: 0.5 });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push({ color: t.palette.negative_400 });
                    }
                    else {
                        baseStyles.push({ color: t.palette.negative_400, opacity: 0.5 });
                    }
                }
            }
            else if (color === 'negative_subtle') {
                if (variant === 'outline') {
                    if (!disabled) {
                        baseStyles.push({ color: t.palette.negative_400 });
                    }
                    else {
                        baseStyles.push({ color: t.palette.negative_400, opacity: 0.5 });
                    }
                }
                else if (variant === 'ghost') {
                    if (!disabled) {
                        baseStyles.push({ color: t.palette.negative_400 });
                    }
                    else {
                        baseStyles.push({ color: t.palette.negative_400, opacity: 0.5 });
                    }
                }
            }
            /*
             * END DEPRECATED STYLES
             */
        }
        if (size === 'large') {
            baseStyles.push(a.text_md, a.leading_snug, a.font_medium);
        }
        else if (size === 'small') {
            baseStyles.push(a.text_sm, a.leading_snug, a.font_medium);
        }
        else if (size === 'tiny') {
            baseStyles.push(a.text_xs, a.leading_snug, a.font_semi_bold);
        }
        return flatten(baseStyles);
    }, [t, variant, color, size, disabled]);
}
export function ButtonText(_a) {
    var children = _a.children, style = _a.style, rest = __rest(_a, ["children", "style"]);
    var textStyles = useSharedButtonTextStyles();
    return (_jsx(Text, __assign({}, rest, { style: [a.text_center, textStyles, style], children: children })));
}
export function ButtonIcon(_a) {
    var Comp = _a.icon, size = _a.size;
    var _b = useButtonContext(), buttonSize = _b.size, buttonShape = _b.shape;
    var textStyles = useSharedButtonTextStyles();
    var _c = React.useMemo(function () {
        /**
         * Pre-set icon sizes for different button sizes
         */
        var iconSizeShorthand = size !== null && size !== void 0 ? size : ({
            large: 'md',
            small: 'sm',
            tiny: 'xs',
        }[buttonSize || 'small'] || 'sm');
        /*
         * Copied here from icons/common.tsx so we can tweak if we need to, but
         * also so that we can calculate transforms.
         */
        var iconSize = {
            xs: 12,
            sm: 16,
            md: 18,
            lg: 24,
            xl: 28,
            '2xs': 8,
            '2xl': 32,
            '3xl': 40,
        }[iconSizeShorthand];
        /*
         * Goal here is to match rendered text size so that different size icons
         * don't increase button size
         */
        var iconContainerSize = {
            large: 20,
            small: 17,
            tiny: 15,
        }[buttonSize || 'small'];
        /*
         * The icon needs to be closer to the edge of the button than the text. Therefore
         * we make the gap slightly too large, and then pull in the sides using negative margins.
         */
        var iconNegativeMargin = 0;
        if (buttonShape === 'default') {
            iconNegativeMargin = {
                large: -2,
                small: -2,
                tiny: -1,
            }[buttonSize || 'small'];
        }
        return {
            iconSize: iconSize,
            iconContainerSize: iconContainerSize,
            iconNegativeMargin: iconNegativeMargin,
        };
    }, [buttonSize, buttonShape, size]), iconSize = _c.iconSize, iconContainerSize = _c.iconContainerSize, iconNegativeMargin = _c.iconNegativeMargin;
    return (_jsx(View, { style: [
            a.z_20,
            {
                width: size === '2xs' ? 10 : iconContainerSize,
                height: iconContainerSize,
                marginLeft: iconNegativeMargin,
                marginRight: iconNegativeMargin,
            },
        ], children: _jsx(View, { style: [
                a.absolute,
                {
                    width: iconSize,
                    height: iconSize,
                    top: '50%',
                    left: '50%',
                    transform: [
                        {
                            translateX: (iconSize / 2) * -1,
                        },
                        {
                            translateY: (iconSize / 2) * -1,
                        },
                    ],
                },
            ], children: _jsx(Comp, { width: iconSize, style: [
                    {
                        color: textStyles.color,
                        pointerEvents: 'none',
                    },
                ] }) }) }));
}
export function StackedButton(_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (_jsx(Button, __assign({}, props, { size: "tiny", style: [
            a.flex_col,
            {
                height: 72,
                paddingHorizontal: 16,
                borderRadius: 20,
                gap: 4,
            },
            props.style,
        ], children: _jsx(StackedButtonInnerText, { icon: props.icon, children: children }) })));
}
function StackedButtonInnerText(_a) {
    var children = _a.children, Icon = _a.icon;
    var textStyles = useSharedButtonTextStyles();
    return (_jsxs(_Fragment, { children: [_jsx(Icon, { width: 24, fill: textStyles.color }), _jsx(ButtonText, { children: children })] }));
}
