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
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { usePalette } from '#/lib/hooks/usePalette';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useModalControls, useModals } from '#/state/modals';
import * as UserAddRemoveLists from './UserAddRemoveLists';
export function ModalsContainer() {
    var _a = useModals(), isModalActive = _a.isModalActive, activeModals = _a.activeModals;
    if (!isModalActive) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx(RemoveScrollBar, {}), activeModals.map(function (modal, i) { return (_jsx(Modal, { modal: modal }, "modal-".concat(i))); })] }));
}
function Modal(_a) {
    var modal = _a.modal;
    var isModalActive = useModals().isModalActive;
    var closeModal = useModalControls().closeModal;
    var pal = usePalette('default');
    var isMobile = useWebMediaQueries().isMobile;
    if (!isModalActive) {
        return null;
    }
    var onPressMask = function () {
        closeModal();
    };
    var onInnerPress = function () {
        // TODO: can we use prevent default?
        // do nothing, we just want to stop it from bubbling
    };
    var element;
    if (modal.name === 'user-add-remove-lists') {
        element = _jsx(UserAddRemoveLists.Component, __assign({}, modal));
    }
    else {
        return null;
    }
    return (
    // eslint-disable-next-line react-native-a11y/has-valid-accessibility-descriptors
    _jsx(TouchableWithoutFeedback, { onPress: onPressMask, children: _jsx(Animated.View, { style: styles.mask, entering: FadeIn.duration(150), exiting: FadeOut, children: _jsx(TouchableWithoutFeedback, { onPress: onInnerPress, children: _jsx(View, { style: [
                        styles.container,
                        isMobile && styles.containerMobile,
                        pal.view,
                        pal.border,
                    ], children: element }) }) }) }));
}
var styles = StyleSheet.create({
    mask: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000c',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        width: 600,
        // @ts-ignore web only
        maxWidth: '100vw',
        // @ts-ignore web only
        maxHeight: '90vh',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
    },
    containerMobile: {
        borderRadius: 0,
        paddingHorizontal: 0,
    },
});
