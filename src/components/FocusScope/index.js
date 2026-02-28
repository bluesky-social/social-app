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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, Text, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useA11y } from '#/state/a11y';
/**
 * Conditionally wraps children in a `FocusTrap` component based on whether
 * screen reader support is enabled. THIS SHOULD BE USED SPARINGLY, only when
 * no better option is available.
 */
export function FocusScope(_a) {
    var children = _a.children;
    var screenReaderEnabled = useA11y().screenReaderEnabled;
    return screenReaderEnabled ? _jsx(FocusTrap, { children: children }) : children;
}
/**
 * `FocusTrap` is intended as a last-ditch effort to ensure that users keep
 * focus within a certain section of the app, like an overlay.
 *
 * It works by placing "guards" at the start and end of the active content.
 * Then when the user reaches either of those guards, it will announce that
 * they have reached the start or end of the content and tell them how to
 * remain within the active content section.
 */
function FocusTrap(_a) {
    var children = _a.children;
    var _ = useLingui()._;
    var child = useRef(null);
    /*
     * Here we add a ref to the first child of this component. This currently
     * overrides any ref already on that first child, so we throw an error here
     * to prevent us from ever accidentally doing this.
     */
    var decoratedChildren = useMemo(function () {
        return Children.toArray(children).map(function (node, i) {
            if (i === 0 && isValidElement(node)) {
                var n = node;
                if (n.props.ref !== undefined) {
                    throw new Error('FocusScope needs to override the ref on its first child.');
                }
                return cloneElement(n, __assign(__assign({}, n.props), { ref: child }));
            }
            return node;
        });
    }, [children]);
    var focusNode = useCallback(function (ref) {
        if (!ref)
            return;
        var node = findNodeHandle(ref);
        if (node) {
            AccessibilityInfo.setAccessibilityFocus(node);
        }
    }, []);
    useEffect(function () {
        setTimeout(function () {
            focusNode(child.current);
        }, 1e3);
    }, [focusNode]);
    return (_jsxs(_Fragment, { children: [_jsx(Pressable, { accessible: true, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You've reached the start of the active content."], ["You've reached the start of the active content."])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please go back, or activate this element to return to the start of the active content."], ["Please go back, or activate this element to return to the start of the active content."])))), accessibilityActions: [{ name: 'activate', label: 'activate' }], onAccessibilityAction: function (event) {
                    switch (event.nativeEvent.actionName) {
                        case 'activate': {
                            focusNode(child.current);
                        }
                    }
                }, children: _jsx(Noop, {}) }), _jsx(View
            /**
             * This property traps focus effectively on iOS, but not on Android.
             */
            , { 
                /**
                 * This property traps focus effectively on iOS, but not on Android.
                 */
                accessibilityViewIsModal: true, children: decoratedChildren }), _jsx(Pressable, { accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You've reached the end of the active content."], ["You've reached the end of the active content."])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Please go back, or activate this element to return to the start of the active content."], ["Please go back, or activate this element to return to the start of the active content."])))), accessibilityActions: [{ name: 'activate', label: 'activate' }], onAccessibilityAction: function (event) {
                    switch (event.nativeEvent.actionName) {
                        case 'activate': {
                            focusNode(child.current);
                        }
                    }
                }, children: _jsx(Noop, {}) })] }));
}
function Noop() {
    return (_jsx(Text, { accessible: false, style: {
            height: 1,
            opacity: 0,
        }, children: ' ' }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
