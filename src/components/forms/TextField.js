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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View, } from 'react-native';
import { HITSLOP_20 } from '#/lib/constants';
import { mergeRefs } from '#/lib/merge-refs';
import { android, applyFonts, atoms as a, platform, tokens, useAlf, useTheme, web, } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text } from '#/components/Typography';
var Context = createContext({
    inputRef: null,
    isInvalid: false,
    hovered: false,
    onHoverIn: function () { },
    onHoverOut: function () { },
    focused: false,
    onFocus: function () { },
    onBlur: function () { },
});
Context.displayName = 'TextFieldContext';
export function Root(_a) {
    var children = _a.children, _b = _a.isInvalid, isInvalid = _b === void 0 ? false : _b, style = _a.style;
    var inputRef = useRef(null);
    var _c = useInteractionState(), hovered = _c.state, onHoverIn = _c.onIn, onHoverOut = _c.onOut;
    var _d = useInteractionState(), focused = _d.state, onFocus = _d.onIn, onBlur = _d.onOut;
    var context = useMemo(function () { return ({
        inputRef: inputRef,
        hovered: hovered,
        onHoverIn: onHoverIn,
        onHoverOut: onHoverOut,
        focused: focused,
        onFocus: onFocus,
        onBlur: onBlur,
        isInvalid: isInvalid,
    }); }, [
        inputRef,
        hovered,
        onHoverIn,
        onHoverOut,
        focused,
        onFocus,
        onBlur,
        isInvalid,
    ]);
    return (_jsx(Context.Provider, { value: context, children: _jsx(View, __assign({ style: [
                a.flex_row,
                a.align_center,
                a.relative,
                a.w_full,
                a.px_md,
                style,
            ] }, web({
            onClick: function () { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); },
            onMouseOver: onHoverIn,
            onMouseOut: onHoverOut,
        }), { children: children })) }));
}
export function useSharedInputStyles() {
    var t = useTheme();
    return useMemo(function () {
        var hover = [
            {
                borderColor: t.palette.contrast_100,
            },
        ];
        var focus = [
            {
                backgroundColor: t.palette.contrast_50,
                borderColor: t.palette.primary_500,
            },
        ];
        var error = [
            {
                backgroundColor: t.palette.negative_25,
                borderColor: t.palette.negative_300,
            },
        ];
        var errorHover = [
            {
                backgroundColor: t.palette.negative_25,
                borderColor: t.palette.negative_500,
            },
        ];
        return {
            chromeHover: StyleSheet.flatten(hover),
            chromeFocus: StyleSheet.flatten(focus),
            chromeError: StyleSheet.flatten(error),
            chromeErrorHover: StyleSheet.flatten(errorHover),
        };
    }, [t]);
}
export function createInput(Component) {
    return function Input(_a) {
        var label = _a.label, placeholder = _a.placeholder, value = _a.value, onChangeText = _a.onChangeText, onFocus = _a.onFocus, onBlur = _a.onBlur, isInvalid = _a.isInvalid, inputRef = _a.inputRef, style = _a.style, rest = __rest(_a, ["label", "placeholder", "value", "onChangeText", "onFocus", "onBlur", "isInvalid", "inputRef", "style"]);
        var t = useTheme();
        var fonts = useAlf().fonts;
        var ctx = useContext(Context);
        var withinRoot = Boolean(ctx.inputRef);
        var _b = useSharedInputStyles(), chromeHover = _b.chromeHover, chromeFocus = _b.chromeFocus, chromeError = _b.chromeError, chromeErrorHover = _b.chromeErrorHover;
        if (!withinRoot) {
            return (_jsx(Root, { isInvalid: isInvalid, children: _jsx(Input, __assign({ label: label, placeholder: placeholder, value: value, onChangeText: onChangeText, isInvalid: isInvalid }, rest)) }));
        }
        var refs = mergeRefs([ctx.inputRef, inputRef].filter(Boolean));
        var flattened = StyleSheet.flatten([
            a.relative,
            a.z_20,
            a.flex_1,
            a.text_md,
            t.atoms.text,
            a.px_xs,
            {
                // paddingVertical doesn't work w/multiline - esb
                lineHeight: a.text_md.fontSize * 1.2,
                textAlignVertical: rest.multiline ? 'top' : undefined,
                minHeight: rest.multiline ? 80 : undefined,
                minWidth: 0,
                paddingTop: 13,
                paddingBottom: 13,
            },
            android({
                paddingTop: 8,
                paddingBottom: 9,
            }),
            /*
             * Margins are needed here to avoid autofill background overlapping the
             * top and bottom borders - esb
             */
            web({
                paddingTop: 11,
                paddingBottom: 11,
                marginTop: 2,
                marginBottom: 2,
            }),
            style,
        ]);
        applyFonts(flattened, fonts.family);
        // should always be defined on `typography`
        // @ts-ignore
        if (flattened.fontSize) {
            // @ts-ignore
            flattened.fontSize = Math.round(
            // @ts-ignore
            flattened.fontSize * fonts.scaleMultiplier);
        }
        return (_jsxs(_Fragment, { children: [_jsx(Component, __assign({ accessibilityHint: undefined, hitSlop: HITSLOP_20 }, rest, { accessibilityLabel: label, ref: refs, value: value, onChangeText: onChangeText, onFocus: function (e) {
                        ctx.onFocus();
                        onFocus === null || onFocus === void 0 ? void 0 : onFocus(e);
                    }, onBlur: function (e) {
                        ctx.onBlur();
                        onBlur === null || onBlur === void 0 ? void 0 : onBlur(e);
                    }, placeholder: placeholder === null ? undefined : placeholder || label, placeholderTextColor: t.palette.contrast_500, keyboardAppearance: t.name === 'light' ? 'light' : 'dark', style: flattened })), _jsx(View, { style: [
                        a.z_10,
                        a.absolute,
                        a.inset_0,
                        { borderRadius: 10 },
                        t.atoms.bg_contrast_50,
                        { borderColor: 'transparent', borderWidth: 2 },
                        ctx.hovered ? chromeHover : {},
                        ctx.focused ? chromeFocus : {},
                        ctx.isInvalid || isInvalid ? chromeError : {},
                        (ctx.isInvalid || isInvalid) && (ctx.hovered || ctx.focused)
                            ? chromeErrorHover
                            : {},
                    ] })] }));
    };
}
export var Input = createInput(TextInput);
export function LabelText(_a) {
    var nativeID = _a.nativeID, children = _a.children;
    var t = useTheme();
    return (_jsx(Text, { nativeID: nativeID, style: [a.text_sm, a.font_medium, t.atoms.text_contrast_medium, a.mb_sm], children: children }));
}
export function Icon(_a) {
    var Comp = _a.icon;
    var t = useTheme();
    var ctx = useContext(Context);
    var _b = useMemo(function () {
        var hover = [
            {
                color: t.palette.contrast_800,
            },
        ];
        var focus = [
            {
                color: t.palette.primary_500,
            },
        ];
        var errorHover = [
            {
                color: t.palette.negative_500,
            },
        ];
        var errorFocus = [
            {
                color: t.palette.negative_500,
            },
        ];
        return {
            hover: hover,
            focus: focus,
            errorHover: errorHover,
            errorFocus: errorFocus,
        };
    }, [t]), hover = _b.hover, focus = _b.focus, errorHover = _b.errorHover, errorFocus = _b.errorFocus;
    return (_jsx(View, { style: [a.z_20, a.pr_xs], children: _jsx(Comp, { size: "md", style: [
                { color: t.palette.contrast_500, pointerEvents: 'none', flexShrink: 0 },
                ctx.hovered ? hover : {},
                ctx.focused ? focus : {},
                ctx.isInvalid && ctx.hovered ? errorHover : {},
                ctx.isInvalid && ctx.focused ? errorFocus : {},
            ] }) }));
}
export function SuffixText(_a) {
    var children = _a.children, label = _a.label, accessibilityHint = _a.accessibilityHint, style = _a.style;
    var t = useTheme();
    var ctx = useContext(Context);
    return (_jsx(Text, { accessibilityLabel: label, accessibilityHint: accessibilityHint, numberOfLines: 1, style: [
            a.z_20,
            a.pr_sm,
            a.text_md,
            t.atoms.text_contrast_medium,
            a.pointer_events_none,
            web([{ marginTop: -2 }, a.leading_snug]),
            (ctx.hovered || ctx.focused) && { color: t.palette.contrast_800 },
            style,
        ], children: children }));
}
export function GhostText(_a) {
    var children = _a.children, value = _a.value;
    var t = useTheme();
    // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
    return (_jsx(View, { style: [
            a.pointer_events_none,
            a.absolute,
            a.z_10,
            {
                paddingLeft: platform({
                    native: 
                    // input padding
                    tokens.space.md +
                        // icon
                        tokens.space.xl +
                        // icon padding
                        tokens.space.xs +
                        // text input padding
                        tokens.space.xs,
                    web: 
                    // icon
                    tokens.space.xl +
                        // icon padding
                        tokens.space.xs +
                        // text input padding
                        tokens.space.xs,
                }),
            },
            web(a.pr_md),
            a.overflow_hidden,
            a.max_w_full,
        ], "aria-hidden": true, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", children: _jsxs(Text, { style: [
                { color: 'transparent' },
                a.text_md,
                { lineHeight: a.text_md.fontSize * 1.1875 },
                a.w_full,
            ], numberOfLines: 1, children: [children, _jsx(Text, { style: [
                        t.atoms.text_contrast_low,
                        a.text_md,
                        { lineHeight: a.text_md.fontSize * 1.1875 },
                    ], children: value })] }) }));
}
