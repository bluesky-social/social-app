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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useImperativeHandle } from 'react';
import { FlatList, Pressable, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DismissableLayer, FocusGuards, FocusScope } from 'radix-ui/internal';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { logger } from '#/logger';
import { useA11y } from '#/state/a11y';
import { useDialogStateControlContext } from '#/state/dialogs';
import { atoms as a, flatten, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { Context } from '#/components/Dialog/context';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Portal } from '#/components/Portal';
export { useDialogContext, useDialogControl } from '#/components/Dialog/context';
export * from '#/components/Dialog/shared';
export * from '#/components/Dialog/types';
export * from '#/components/Dialog/utils';
export { Input } from '#/components/forms/TextField';
// 100 minus 10vh of paddingVertical
export var WEB_DIALOG_HEIGHT = '80vh';
var stopPropagation = function (e) { return e.stopPropagation(); };
var preventDefault = function (e) { return e.preventDefault(); };
export function Outer(_a) {
    var _this = this;
    var children = _a.children, control = _a.control, onClose = _a.onClose, webOptions = _a.webOptions;
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var _b = React.useState(false), isOpen = _b[0], setIsOpen = _b[1];
    var setDialogIsOpen = useDialogStateControlContext().setDialogIsOpen;
    var open = React.useCallback(function () {
        setDialogIsOpen(control.id, true);
        setIsOpen(true);
    }, [setIsOpen, setDialogIsOpen, control.id]);
    var close = React.useCallback(function (cb) {
        setDialogIsOpen(control.id, false);
        setIsOpen(false);
        try {
            if (cb && typeof cb === 'function') {
                // This timeout ensures that the callback runs at the same time as it would on native. I.e.
                // console.log('Step 1') -> close(() => console.log('Step 3')) -> console.log('Step 2')
                // This should always output 'Step 1', 'Step 2', 'Step 3', but without the timeout it would output
                // 'Step 1', 'Step 3', 'Step 2'.
                setTimeout(cb);
            }
        }
        catch (e) {
            logger.error("Dialog closeCallback failed", {
                message: e.message,
            });
        }
        onClose === null || onClose === void 0 ? void 0 : onClose();
    }, [control.id, onClose, setDialogIsOpen]);
    var handleBackgroundPress = React.useCallback(function (e) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (webOptions === null || webOptions === void 0 ? void 0 : webOptions.onBackgroundPress) ? webOptions.onBackgroundPress(e) : close();
            return [2 /*return*/];
        });
    }); }, [webOptions, close]);
    useImperativeHandle(control.ref, function () { return ({
        open: open,
        close: close,
    }); }, [close, open]);
    var context = React.useMemo(function () { return ({
        close: close,
        isNativeDialog: false,
        nativeSnapPoint: 0,
        disableDrag: false,
        setDisableDrag: function () { },
        isWithinDialog: true,
    }); }, [close]);
    return (_jsx(_Fragment, { children: isOpen && (_jsx(Portal, { children: _jsxs(Context.Provider, { value: context, children: [_jsx(RemoveScrollBar, {}), _jsx(Pressable, { accessibilityHint: undefined, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close active dialog"], ["Close active dialog"])))), onPress: handleBackgroundPress, children: _jsxs(View, { style: [
                                web(a.fixed),
                                a.inset_0,
                                a.z_10,
                                a.px_xl,
                                (webOptions === null || webOptions === void 0 ? void 0 : webOptions.alignCenter) ? a.justify_center : undefined,
                                a.align_center,
                                {
                                    overflowY: 'auto',
                                    paddingVertical: gtMobile ? '10vh' : a.pt_xl.paddingTop,
                                },
                            ], children: [_jsx(Backdrop, {}), _jsx(View, { style: [
                                        a.w_full,
                                        a.z_20,
                                        a.align_center,
                                        web({ minHeight: '60vh', position: 'static' }),
                                    ], children: children })] }) })] }) })) }));
}
export function Inner(_a) {
    var children = _a.children, style = _a.style, label = _a.label, accessibilityLabelledBy = _a.accessibilityLabelledBy, accessibilityDescribedBy = _a.accessibilityDescribedBy, header = _a.header, contentContainerStyle = _a.contentContainerStyle;
    var t = useTheme();
    var close = React.useContext(Context).close;
    var gtMobile = useBreakpoints().gtMobile;
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    FocusGuards.useFocusGuards();
    return (_jsx(FocusScope.FocusScope, { loop: true, asChild: true, trapped: true, children: _jsx(View, { role: "dialog", "aria-role": "dialog", "aria-label": label, "aria-labelledby": accessibilityLabelledBy, "aria-describedby": accessibilityDescribedBy, 
            // @ts-expect-error web only -prf
            onClick: stopPropagation, onStartShouldSetResponder: function (_) { return true; }, onTouchEnd: stopPropagation, 
            // note: flatten is required for some reason -sfn
            style: flatten([
                a.relative,
                a.rounded_md,
                a.w_full,
                a.border,
                t.atoms.bg,
                {
                    maxWidth: 600,
                    borderColor: t.palette.contrast_200,
                    shadowColor: t.palette.black,
                    shadowOpacity: t.name === 'light' ? 0.1 : 0.4,
                    shadowRadius: 30,
                },
                !reduceMotionEnabled && a.zoom_fade_in,
                style,
            ]), children: _jsxs(DismissableLayer.DismissableLayer, { onInteractOutside: preventDefault, onFocusOutside: preventDefault, onDismiss: close, style: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [header, _jsx(View, { style: [gtMobile ? a.p_2xl : a.p_xl, contentContainerStyle], children: children })] }) }) }));
}
export var ScrollableInner = Inner;
export var InnerFlatList = React.forwardRef(function InnerFlatList(_a, ref) {
    var label = _a.label, style = _a.style, webInnerStyle = _a.webInnerStyle, webInnerContentContainerStyle = _a.webInnerContentContainerStyle, footer = _a.footer, props = __rest(_a, ["label", "style", "webInnerStyle", "webInnerContentContainerStyle", "footer"]);
    var gtMobile = useBreakpoints().gtMobile;
    return (_jsxs(Inner, { label: label, style: [
            a.overflow_hidden,
            a.px_0,
            web({ maxHeight: WEB_DIALOG_HEIGHT }),
            webInnerStyle,
        ], contentContainerStyle: [a.h_full, a.px_0, webInnerContentContainerStyle], children: [_jsx(FlatList, __assign({ ref: ref, style: [a.h_full, gtMobile ? a.px_2xl : a.px_xl, style] }, props)), footer] }));
});
export function FlatListFooter(_a) {
    var children = _a.children, onLayout = _a.onLayout;
    var t = useTheme();
    return (_jsx(View, { onLayout: onLayout, style: [
            a.absolute,
            a.bottom_0,
            a.w_full,
            a.z_10,
            t.atoms.bg,
            a.border_t,
            t.atoms.border_contrast_low,
            a.px_lg,
            a.py_md,
        ], children: children }));
}
export function Close() {
    var _ = useLingui()._;
    var close = React.useContext(Context).close;
    return (_jsx(View, { style: [
            a.absolute,
            a.z_10,
            {
                top: a.pt_md.paddingTop,
                right: a.pr_md.paddingRight,
            },
        ], children: _jsx(Button, { size: "small", variant: "ghost", color: "secondary", shape: "round", onPress: function () { return close(); }, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Close active dialog"], ["Close active dialog"])))), children: _jsx(ButtonIcon, { icon: X, size: "md" }) }) }));
}
export function Handle() {
    return null;
}
export function Backdrop() {
    var t = useTheme();
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    return (_jsx(View, { style: { opacity: 0.8 }, children: _jsx(View, { style: [
                a.fixed,
                a.inset_0,
                { backgroundColor: t.palette.black },
                !reduceMotionEnabled && a.fade_in,
            ] }) }));
}
var templateObject_1, templateObject_2;
