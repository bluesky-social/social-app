import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var MessageContext = React.createContext(false);
MessageContext.displayName = 'MessageContext';
export function MessageContextProvider(_a) {
    var children = _a.children;
    return (_jsx(MessageContext.Provider, { value: true, children: children }));
}
export function useIsWithinMessage() {
    return React.useContext(MessageContext);
}
