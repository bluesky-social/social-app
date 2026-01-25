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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cloneElement, Fragment, isValidElement, useMemo } from 'react';
import { Pressable, View, } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import flattenReactChildren from 'react-keyed-flatten-children';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Context, ItemContext, useMenuContext, useMenuItemContext, } from '#/components/Menu/context';
import { Text } from '#/components/Typography';
import { IS_ANDROID, IS_IOS, IS_NATIVE } from '#/env';
export { useDialogControl as useMenuControl, } from '#/components/Dialog';
export { useMenuContext };
export function Root(_a) {
    var children = _a.children, control = _a.control;
    var defaultControl = Dialog.useDialogControl();
    var context = useMemo(function () { return ({
        control: control || defaultControl,
    }); }, [control, defaultControl]);
    return _jsx(Context.Provider, { value: context, children: children });
}
export function Trigger(_a) {
    var children = _a.children, label = _a.label, _b = _a.role, role = _b === void 0 ? 'button' : _b, hint = _a.hint;
    var context = useMenuContext();
    var _c = useInteractionState(), focused = _c.state, onFocus = _c.onIn, onBlur = _c.onOut;
    var _d = useInteractionState(), pressed = _d.state, onPressIn = _d.onIn, onPressOut = _d.onOut;
    return children({
        IS_NATIVE: true,
        control: context.control,
        state: {
            hovered: false,
            focused: focused,
            pressed: pressed,
        },
        props: {
            ref: null,
            onPress: context.control.open,
            onFocus: onFocus,
            onBlur: onBlur,
            onPressIn: onPressIn,
            onPressOut: onPressOut,
            accessibilityHint: hint,
            accessibilityLabel: label,
            accessibilityRole: role,
        },
    });
}
export function Outer(_a) {
    var children = _a.children, showCancel = _a.showCancel;
    var context = useMenuContext();
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: context.control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(Context.Provider, { value: context, children: _jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Menu"], ["Menu"])))), children: _jsxs(View, { style: [a.gap_lg], children: [children, IS_NATIVE && showCancel && _jsx(Cancel, {})] }) }) })] }));
}
export function Item(_a) {
    var _this = this;
    var children = _a.children, label = _a.label, style = _a.style, onPress = _a.onPress, rest = __rest(_a, ["children", "label", "style", "onPress"]);
    var t = useTheme();
    var context = useMenuContext();
    var _b = useInteractionState(), focused = _b.state, onFocus = _b.onIn, onBlur = _b.onOut;
    var _c = useInteractionState(), pressed = _c.state, onPressIn = _c.onIn, onPressOut = _c.onOut;
    return (_jsx(Pressable, __assign({}, rest, { accessibilityHint: "", accessibilityLabel: label, onFocus: onFocus, onBlur: onBlur, onPress: function (e) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (IS_ANDROID) {
                    /**
                     * Below fix for iOS doesn't work for Android, this does.
                     */
                    onPress === null || onPress === void 0 ? void 0 : onPress(e);
                    context.control.close();
                }
                else if (IS_IOS) {
                    /**
                     * Fixes a subtle bug on iOS
                     * {@link https://github.com/bluesky-social/social-app/pull/5849/files#diff-de516ef5e7bd9840cd639213301df38cf03acfcad5bda85a1d63efd249ba79deL124-L127}
                     */
                    context.control.close(function () {
                        onPress === null || onPress === void 0 ? void 0 : onPress(e);
                    });
                }
                return [2 /*return*/];
            });
        }); }, onPressIn: function (e) {
            var _a;
            onPressIn();
            (_a = rest.onPressIn) === null || _a === void 0 ? void 0 : _a.call(rest, e);
        }, onPressOut: function (e) {
            var _a;
            onPressOut();
            (_a = rest.onPressOut) === null || _a === void 0 ? void 0 : _a.call(rest, e);
        }, style: [
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.px_md,
            a.rounded_md,
            a.overflow_hidden,
            a.border,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
            { minHeight: 44, paddingVertical: 10 },
            style,
            (focused || pressed) && !rest.disabled && [t.atoms.bg_contrast_50],
        ], children: _jsx(ItemContext.Provider, { value: { disabled: Boolean(rest.disabled) }, children: children }) })));
}
export function ItemText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    var disabled = useMenuItemContext().disabled;
    return (_jsx(Text, { numberOfLines: 1, ellipsizeMode: "middle", style: [
            a.flex_1,
            a.text_md,
            a.font_semi_bold,
            t.atoms.text_contrast_high,
            style,
            disabled && t.atoms.text_contrast_low,
        ], children: children }));
}
export function ItemIcon(_a) {
    var Comp = _a.icon, fill = _a.fill;
    var t = useTheme();
    var disabled = useMenuItemContext().disabled;
    return (_jsx(Comp, { size: "lg", fill: fill
            ? fill({ disabled: disabled })
            : disabled
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
                selected
                    ? {
                        backgroundColor: t.palette.primary_500,
                    }
                    : {},
            ] })) : null }));
}
/**
 * NATIVE ONLY - for adding non-pressable items to the menu
 *
 * @platform ios, android
 */
export function ContainerItem(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.px_md,
            a.rounded_md,
            a.border,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
            { paddingVertical: 10 },
            style,
        ], children: children }));
}
export function LabelText(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(Text, { style: [
            a.font_semi_bold,
            t.atoms.text_contrast_medium,
            { marginBottom: -8 },
            style,
        ], children: children }));
}
export function Group(_a) {
    var children = _a.children, style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_md,
            a.overflow_hidden,
            a.border,
            t.atoms.border_contrast_low,
            style,
        ], children: flattenReactChildren(children).map(function (child, i) {
            return isValidElement(child) &&
                (child.type === Item || child.type === ContainerItem) ? (_jsxs(Fragment, { children: [i > 0 ? (_jsx(View, { style: [a.border_b, t.atoms.border_contrast_low] })) : null, cloneElement(child, {
                        // @ts-expect-error cloneElement is not aware of the types
                        style: {
                            borderRadius: 0,
                            borderWidth: 0,
                        },
                    })] }, i)) : null;
        }) }));
}
function Cancel() {
    var _ = useLingui()._;
    var context = useMenuContext();
    return (_jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close this dialog"], ["Close this dialog"])))), size: "small", variant: "ghost", color: "secondary", onPress: function () { return context.control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }));
}
export function Divider() {
    return null;
}
var templateObject_1, templateObject_2;
