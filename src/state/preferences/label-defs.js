import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useLabelDefinitionsQuery } from '../queries/preferences';
var stateContext = React.createContext({
    labelDefs: {},
    labelers: [],
});
stateContext.displayName = 'LabelDefsStateContext';
export function Provider(_a) {
    var children = _a.children;
    var state = useLabelDefinitionsQuery();
    return _jsx(stateContext.Provider, { value: state, children: children });
}
export function useLabelDefinitions() {
    return React.useContext(stateContext);
}
