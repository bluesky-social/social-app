import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Provider as GlobalDialogsProvider } from '#/components/dialogs/Context';
import { IS_WEB } from '#/env';
import { BottomSheetNativeComponent } from '../../../modules/bottom-sheet';
var DialogContext = React.createContext({});
DialogContext.displayName = 'DialogContext';
var DialogControlContext = React.createContext({});
DialogControlContext.displayName = 'DialogControlContext';
/**
 * The number of dialogs that are fully expanded. This is used to determine the background color of the status bar
 * on iOS.
 */
var DialogFullyExpandedCountContext = React.createContext(0);
DialogFullyExpandedCountContext.displayName = 'DialogFullyExpandedCountContext';
export function useDialogStateContext() {
    return React.useContext(DialogContext);
}
export function useDialogStateControlContext() {
    return React.useContext(DialogControlContext);
}
/** The number of dialogs that are fully expanded */
export function useDialogFullyExpandedCountContext() {
    return React.useContext(DialogFullyExpandedCountContext);
}
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(0), fullyExpandedCount = _b[0], setFullyExpandedCount = _b[1];
    var activeDialogs = React.useRef(new Map());
    var openDialogs = React.useRef(new Set());
    var closeAllDialogs = React.useCallback(function () {
        if (IS_WEB) {
            openDialogs.current.forEach(function (id) {
                var dialog = activeDialogs.current.get(id);
                if (dialog)
                    dialog.current.close();
            });
            return openDialogs.current.size > 0;
        }
        else {
            BottomSheetNativeComponent.dismissAll();
            return false;
        }
    }, []);
    var setDialogIsOpen = React.useCallback(function (id, isOpen) {
        if (isOpen) {
            openDialogs.current.add(id);
        }
        else {
            openDialogs.current.delete(id);
        }
    }, []);
    var context = React.useMemo(function () { return ({
        activeDialogs: activeDialogs,
        openDialogs: openDialogs,
    }); }, [activeDialogs, openDialogs]);
    var controls = React.useMemo(function () { return ({
        closeAllDialogs: closeAllDialogs,
        setDialogIsOpen: setDialogIsOpen,
        setFullyExpandedCount: setFullyExpandedCount,
    }); }, [closeAllDialogs, setDialogIsOpen, setFullyExpandedCount]);
    return (_jsx(DialogContext.Provider, { value: context, children: _jsx(DialogControlContext.Provider, { value: controls, children: _jsx(DialogFullyExpandedCountContext.Provider, { value: fullyExpandedCount, children: _jsx(GlobalDialogsProvider, { children: children }) }) }) }));
}
Provider.displayName = 'DialogsProvider';
