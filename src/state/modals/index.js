var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
var ModalContext = React.createContext({
    isModalActive: false,
    activeModals: [],
});
ModalContext.displayName = 'ModalContext';
var ModalControlContext = React.createContext({
    openModal: function () { },
    closeModal: function () { return false; },
    closeAllModals: function () { return false; },
});
ModalControlContext.displayName = 'ModalControlContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState([]), activeModals = _b[0], setActiveModals = _b[1];
    var openModal = useNonReactiveCallback(function (modal) {
        setActiveModals(function (modals) { return __spreadArray(__spreadArray([], modals, true), [modal], false); });
    });
    var closeModal = useNonReactiveCallback(function () {
        var wasActive = activeModals.length > 0;
        setActiveModals(function (modals) {
            return modals.slice(0, -1);
        });
        return wasActive;
    });
    var closeAllModals = useNonReactiveCallback(function () {
        var wasActive = activeModals.length > 0;
        setActiveModals([]);
        return wasActive;
    });
    var state = React.useMemo(function () { return ({
        isModalActive: activeModals.length > 0,
        activeModals: activeModals,
    }); }, [activeModals]);
    var methods = React.useMemo(function () { return ({
        openModal: openModal,
        closeModal: closeModal,
        closeAllModals: closeAllModals,
    }); }, [openModal, closeModal, closeAllModals]);
    return (_jsx(ModalContext.Provider, { value: state, children: _jsx(ModalControlContext.Provider, { value: methods, children: children }) }));
}
/**
 * @deprecated use the dialog system from `#/components/Dialog.tsx`
 */
export function useModals() {
    return React.useContext(ModalContext);
}
/**
 * @deprecated use the dialog system from `#/components/Dialog.tsx`
 */
export function useModalControls() {
    return React.useContext(ModalControlContext);
}
