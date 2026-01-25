import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
var ScrollContext = createContext({
    onBeginDrag: undefined,
    onEndDrag: undefined,
    onScroll: undefined,
    onMomentumEnd: undefined,
});
ScrollContext.displayName = 'ScrollContext';
export function useScrollHandlers() {
    return useContext(ScrollContext);
}
// Note: this completely *overrides* the parent handlers.
// It's up to you to compose them with the parent ones via useScrollHandlers() if needed.
export function ScrollProvider(_a) {
    var children = _a.children, onBeginDrag = _a.onBeginDrag, onEndDrag = _a.onEndDrag, onScroll = _a.onScroll, onMomentumEnd = _a.onMomentumEnd;
    var handlers = useMemo(function () { return ({
        onBeginDrag: onBeginDrag,
        onEndDrag: onEndDrag,
        onScroll: onScroll,
        onMomentumEnd: onMomentumEnd,
    }); }, [onBeginDrag, onEndDrag, onScroll, onMomentumEnd]);
    return (_jsx(ScrollContext.Provider, { value: handlers, children: children }));
}
