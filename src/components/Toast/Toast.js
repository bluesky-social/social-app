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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { atoms as a, select, useAlf, useTheme } from '#/alf';
import { Button, } from '#/components/Button';
import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheck } from '#/components/icons/CircleCheck';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon } from '#/components/icons/CircleInfo';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { dismiss } from '#/components/Toast/sonner';
import { Text as BaseText } from '#/components/Typography';
export var ICONS = {
    default: CircleCheck,
    success: CircleCheck,
    error: ErrorIcon,
    warning: WarningIcon,
    info: CircleInfo,
};
var ToastConfigContext = createContext({
    id: '',
    type: 'default',
});
ToastConfigContext.displayName = 'ToastConfigContext';
export function ToastConfigProvider(_a) {
    var children = _a.children, id = _a.id, type = _a.type;
    return (_jsx(ToastConfigContext.Provider, { value: useMemo(function () { return ({ id: id, type: type }); }, [id, type]), children: children }));
}
export function Outer(_a) {
    var children = _a.children;
    var t = useTheme();
    var type = useContext(ToastConfigContext).type;
    var styles = useToastStyles({ type: type });
    return (_jsx(View, { style: [
            a.flex_1,
            a.p_lg,
            a.rounded_md,
            a.border,
            a.flex_row,
            a.gap_sm,
            t.atoms.shadow_sm,
            {
                paddingVertical: 14, // 16 seems too big
                backgroundColor: styles.backgroundColor,
                borderColor: styles.borderColor,
            },
        ], children: children }));
}
export function Icon(_a) {
    var icon = _a.icon;
    var type = useContext(ToastConfigContext).type;
    var styles = useToastStyles({ type: type });
    var IconComponent = icon || ICONS[type];
    return _jsx(IconComponent, { size: "md", fill: styles.iconColor });
}
export function Text(_a) {
    var children = _a.children;
    var type = useContext(ToastConfigContext).type;
    var textColor = useToastStyles({ type: type }).textColor;
    var fontScaleCompensation = useToastFontScaleCompensation().fontScaleCompensation;
    return (_jsx(View, { style: [
            a.flex_1,
            a.pr_lg,
            {
                top: fontScaleCompensation,
            },
        ], children: _jsx(BaseText, { selectable: false, style: [
                a.text_md,
                a.font_medium,
                a.leading_snug,
                a.pointer_events_none,
                {
                    color: textColor,
                },
            ], children: children }) }));
}
export function Action(props) {
    var t = useTheme();
    var fontScaleCompensation = useToastFontScaleCompensation().fontScaleCompensation;
    var type = useContext(ToastConfigContext).type;
    var id = useContext(ToastConfigContext).id;
    var styles = useMemo(function () {
        var base = {
            base: {
                textColor: t.palette.contrast_600,
                backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
            },
            interacted: {
                textColor: t.atoms.text.color,
                backgroundColor: t.atoms.bg_contrast_50.backgroundColor,
            },
        };
        return {
            default: base,
            success: {
                base: {
                    textColor: select(t.name, {
                        light: t.palette.primary_800,
                        dim: t.palette.primary_900,
                        dark: t.palette.primary_900,
                    }),
                    backgroundColor: t.palette.primary_25,
                },
                interacted: {
                    textColor: select(t.name, {
                        light: t.palette.primary_900,
                        dim: t.palette.primary_975,
                        dark: t.palette.primary_975,
                    }),
                    backgroundColor: t.palette.primary_50,
                },
            },
            error: {
                base: {
                    textColor: select(t.name, {
                        light: t.palette.negative_700,
                        dim: t.palette.negative_900,
                        dark: t.palette.negative_900,
                    }),
                    backgroundColor: t.palette.negative_25,
                },
                interacted: {
                    textColor: select(t.name, {
                        light: t.palette.negative_900,
                        dim: t.palette.negative_975,
                        dark: t.palette.negative_975,
                    }),
                    backgroundColor: t.palette.negative_50,
                },
            },
            warning: base,
            info: base,
        }[type];
    }, [t, type]);
    var onPress = function (e) {
        var _a;
        console.log('Toast Action pressed, dismissing toast', id);
        dismiss(id);
        (_a = props.onPress) === null || _a === void 0 ? void 0 : _a.call(props, e);
    };
    return (_jsx(View, { style: { top: fontScaleCompensation }, children: _jsx(Button, __assign({}, props, { onPress: onPress, children: function (s) {
                var interacted = s.pressed || s.hovered || s.focused;
                return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                a.absolute,
                                a.curve_continuous,
                                {
                                    // tiny button styles
                                    top: -5,
                                    bottom: -5,
                                    left: -9,
                                    right: -9,
                                    borderRadius: 6,
                                    backgroundColor: interacted
                                        ? styles.interacted.backgroundColor
                                        : styles.base.backgroundColor,
                                },
                            ] }), _jsx(BaseText, { style: [
                                a.text_md,
                                a.font_medium,
                                a.leading_snug,
                                {
                                    color: interacted
                                        ? styles.interacted.textColor
                                        : styles.base.textColor,
                                },
                            ], children: props.children })] }));
            } })) }));
}
/**
 * Vibes-based number, provides t `top` value to wrap the text to compensate
 * for different type sizes and keep the first line of text aligned with the
 * icon. - esb
 */
function useToastFontScaleCompensation() {
    var fonts = useAlf().fonts;
    var fontScaleCompensation = useMemo(function () { return parseInt(fonts.scale) * -1 * 0.65; }, [fonts.scale]);
    return useMemo(function () { return ({
        fontScaleCompensation: fontScaleCompensation,
    }); }, [fontScaleCompensation]);
}
function useToastStyles(_a) {
    var type = _a.type;
    var t = useTheme();
    return useMemo(function () {
        return {
            default: {
                backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                borderColor: t.atoms.border_contrast_low.borderColor,
                iconColor: t.atoms.text.color,
                textColor: t.atoms.text.color,
            },
            success: {
                backgroundColor: t.palette.primary_25,
                borderColor: select(t.name, {
                    light: t.palette.primary_300,
                    dim: t.palette.primary_200,
                    dark: t.palette.primary_100,
                }),
                iconColor: select(t.name, {
                    light: t.palette.primary_600,
                    dim: t.palette.primary_700,
                    dark: t.palette.primary_700,
                }),
                textColor: select(t.name, {
                    light: t.palette.primary_600,
                    dim: t.palette.primary_700,
                    dark: t.palette.primary_700,
                }),
            },
            error: {
                backgroundColor: t.palette.negative_25,
                borderColor: select(t.name, {
                    light: t.palette.negative_200,
                    dim: t.palette.negative_200,
                    dark: t.palette.negative_100,
                }),
                iconColor: select(t.name, {
                    light: t.palette.negative_700,
                    dim: t.palette.negative_900,
                    dark: t.palette.negative_900,
                }),
                textColor: select(t.name, {
                    light: t.palette.negative_700,
                    dim: t.palette.negative_900,
                    dark: t.palette.negative_900,
                }),
            },
            warning: {
                backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                borderColor: t.atoms.border_contrast_low.borderColor,
                iconColor: t.atoms.text.color,
                textColor: t.atoms.text.color,
            },
            info: {
                backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
                borderColor: t.atoms.border_contrast_low.borderColor,
                iconColor: t.atoms.text.color,
                textColor: t.atoms.text.color,
            },
        }[type];
    }, [t, type]);
}
