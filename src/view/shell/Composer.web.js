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
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DismissableLayer, FocusGuards, FocusScope } from 'radix-ui/internal';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { useA11y } from '#/state/a11y';
import { useModals } from '#/state/modals';
import { useComposerState } from '#/state/shell/composer';
import { EmojiPicker, } from '#/view/com/composer/text-input/web/EmojiPicker';
import { atoms as a, flatten, useBreakpoints, useTheme } from '#/alf';
import { ComposePost, useComposerCancelRef } from '../com/composer/Composer';
var BOTTOM_BAR_HEIGHT = 61;
export function Composer(_a) {
    var state = useComposerState();
    var isActive = !!state;
    // rendering
    // =
    if (!isActive) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx(RemoveScrollBar, {}), _jsx(Inner, { state: state })] }));
}
function Inner(_a) {
    var state = _a.state;
    var ref = useComposerCancelRef();
    var isModalActive = useModals().isModalActive;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    var _b = React.useState({
        isOpen: false,
        pos: { top: 0, left: 0, right: 0, bottom: 0, nextFocusRef: null },
    }), pickerState = _b[0], setPickerState = _b[1];
    var onOpenPicker = React.useCallback(function (pos) {
        if (!pos)
            return;
        setPickerState({
            isOpen: true,
            pos: pos,
        });
    }, []);
    var onClosePicker = React.useCallback(function () {
        setPickerState(function (prev) { return (__assign(__assign({}, prev), { isOpen: false })); });
    }, []);
    FocusGuards.useFocusGuards();
    return (_jsx(FocusScope.FocusScope, { loop: true, trapped: true, asChild: true, children: _jsxs(DismissableLayer.DismissableLayer, { role: "dialog", "aria-modal": true, style: flatten([
                { position: 'fixed' },
                a.inset_0,
                { backgroundColor: '#000c' },
                a.flex,
                a.flex_col,
                a.align_center,
                !reduceMotionEnabled && a.fade_in,
            ]), onFocusOutside: function (evt) { return evt.preventDefault(); }, onInteractOutside: function (evt) { return evt.preventDefault(); }, onDismiss: function () {
                var _a;
                // TEMP: remove when all modals are ALF'd -sfn
                if (!isModalActive) {
                    (_a = ref.current) === null || _a === void 0 ? void 0 : _a.onPressCancel();
                }
            }, children: [_jsx(View, { style: [
                        styles.container,
                        !gtMobile && styles.containerMobile,
                        t.atoms.bg,
                        t.atoms.border_contrast_medium,
                        !reduceMotionEnabled && [
                            a.zoom_fade_in,
                            { animationDelay: 0.1 },
                            { animationFillMode: 'backwards' },
                        ],
                    ], children: _jsx(ComposePost, { cancelRef: ref, replyTo: state.replyTo, quote: state.quote, onPost: state.onPost, onPostSuccess: state.onPostSuccess, mention: state.mention, openEmojiPicker: onOpenPicker, text: state.text, imageUris: state.imageUris, openGallery: state.openGallery }) }), _jsx(EmojiPicker, { state: pickerState, close: onClosePicker })] }) }));
}
var styles = StyleSheet.create({
    container: {
        marginTop: 50,
        maxWidth: 600,
        width: '100%',
        paddingVertical: 0,
        borderRadius: 8,
        marginBottom: 0,
        borderWidth: 1,
        // @ts-expect-error web only
        maxHeight: 'calc(100% - (40px * 2))',
        overflow: 'hidden',
    },
    containerMobile: {
        borderRadius: 0,
        marginBottom: BOTTOM_BAR_HEIGHT,
        // @ts-expect-error web only
        maxHeight: "calc(100% - ".concat(BOTTOM_BAR_HEIGHT, "px)"),
    },
});
