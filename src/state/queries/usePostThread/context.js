import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
var PostThreadContext = createContext(undefined);
/**
 * Use the current {@link PostThreadContext}, if one is available. If not,
 * returns `undefined`.
 */
export function usePostThreadContext() {
    return useContext(PostThreadContext);
}
export function PostThreadContextProvider(_a) {
    var children = _a.children, context = _a.context;
    return (_jsx(PostThreadContext.Provider, { value: context, children: children }));
}
