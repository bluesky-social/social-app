import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var CurrentConvoIdContext = React.createContext({
    currentConvoId: undefined,
    setCurrentConvoId: function () { },
});
CurrentConvoIdContext.displayName = 'CurrentConvoIdContext';
export function useCurrentConvoId() {
    var ctx = React.useContext(CurrentConvoIdContext);
    if (!ctx) {
        throw new Error('useCurrentConvoId must be used within a CurrentConvoIdProvider');
    }
    return ctx;
}
export function CurrentConvoIdProvider(_a) {
    var children = _a.children;
    var _b = React.useState(), currentConvoId = _b[0], setCurrentConvoId = _b[1];
    var ctx = React.useMemo(function () { return ({ currentConvoId: currentConvoId, setCurrentConvoId: setCurrentConvoId }); }, [currentConvoId]);
    return (_jsx(CurrentConvoIdContext.Provider, { value: ctx, children: children }));
}
