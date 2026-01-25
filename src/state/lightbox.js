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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { nanoid } from 'nanoid/non-secure';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
var LightboxContext = React.createContext({
    activeLightbox: null,
});
LightboxContext.displayName = 'LightboxContext';
var LightboxControlContext = React.createContext({
    openLightbox: function () { },
    closeLightbox: function () { return false; },
});
LightboxControlContext.displayName = 'LightboxControlContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(null), activeLightbox = _b[0], setActiveLightbox = _b[1];
    var openLightbox = useNonReactiveCallback(function (lightbox) {
        setActiveLightbox(function (prevLightbox) {
            if (prevLightbox) {
                // Ignore duplicate open requests. If it's already open,
                // the user has to explicitly close the previous one first.
                return prevLightbox;
            }
            else {
                return __assign(__assign({}, lightbox), { id: nanoid() });
            }
        });
    });
    var closeLightbox = useNonReactiveCallback(function () {
        var wasActive = !!activeLightbox;
        setActiveLightbox(null);
        return wasActive;
    });
    var state = React.useMemo(function () { return ({
        activeLightbox: activeLightbox,
    }); }, [activeLightbox]);
    var methods = React.useMemo(function () { return ({
        openLightbox: openLightbox,
        closeLightbox: closeLightbox,
    }); }, [openLightbox, closeLightbox]);
    return (_jsx(LightboxContext.Provider, { value: state, children: _jsx(LightboxControlContext.Provider, { value: methods, children: children }) }));
}
export function useLightbox() {
    return React.useContext(LightboxContext);
}
export function useLightboxControls() {
    return React.useContext(LightboxControlContext);
}
