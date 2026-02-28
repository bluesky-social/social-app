import { jsx as _jsx } from "react/jsx-runtime";
import React, { useContext } from 'react';
import { IS_NATIVE } from '#/env';
export var PagerHeaderContext = React.createContext(null);
PagerHeaderContext.displayName = 'PagerHeaderContext';
/**
 * Passes information about the scroll position and header height down via
 * context for the pager header to consume.
 *
 * @platform ios, android
 */
export function PagerHeaderProvider(_a) {
    var scrollY = _a.scrollY, headerHeight = _a.headerHeight, children = _a.children;
    var value = React.useMemo(function () { return ({ scrollY: scrollY, headerHeight: headerHeight }); }, [scrollY, headerHeight]);
    return (_jsx(PagerHeaderContext.Provider, { value: value, children: children }));
}
export function usePagerHeaderContext() {
    var ctx = useContext(PagerHeaderContext);
    if (IS_NATIVE) {
        if (!ctx) {
            throw new Error('usePagerHeaderContext must be used within a HeaderProvider');
        }
        return ctx;
    }
    else {
        return null;
    }
}
