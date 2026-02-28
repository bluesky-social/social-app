import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState, } from 'react';
import { useWindowDimensions } from 'react-native';
import { IS_NATIVE, IS_WEB } from '#/env';
var Context = React.createContext(null);
Context.displayName = 'ActiveVideoWebContext';
export function Provider(_a) {
    var children = _a.children;
    if (!IS_WEB) {
        throw new Error('ActiveVideoWebContext may only be used on web.');
    }
    var _b = useState(null), activeViewId = _b[0], setActiveViewId = _b[1];
    var activeViewLocationRef = useRef(Infinity);
    var windowHeight = useWindowDimensions().height;
    // minimising re-renders by using refs
    var manuallySetRef = useRef(false);
    var activeViewIdRef = useRef(activeViewId);
    useEffect(function () {
        activeViewIdRef.current = activeViewId;
    }, [activeViewId]);
    var setActiveView = useCallback(function (viewId) {
        setActiveViewId(viewId);
        manuallySetRef.current = true;
        // we don't know the exact position, but it's definitely on screen
        // so just guess that it's in the middle. Any value is fine
        // so long as it's not offscreen
        activeViewLocationRef.current = windowHeight / 2;
    }, [windowHeight]);
    var sendViewPosition = useCallback(function (viewId, y) {
        if (IS_NATIVE)
            return;
        if (viewId === activeViewIdRef.current) {
            activeViewLocationRef.current = y;
        }
        else {
            if (distanceToIdealPosition(y) <
                distanceToIdealPosition(activeViewLocationRef.current)) {
                // if the old view was manually set, only usurp if the old view is offscreen
                if (manuallySetRef.current &&
                    withinViewport(activeViewLocationRef.current)) {
                    return;
                }
                setActiveViewId(viewId);
                activeViewLocationRef.current = y;
                manuallySetRef.current = false;
            }
        }
        function distanceToIdealPosition(yPos) {
            return Math.abs(yPos - windowHeight / 2.5);
        }
        function withinViewport(yPos) {
            return yPos > 0 && yPos < windowHeight;
        }
    }, [windowHeight]);
    var value = useMemo(function () { return ({
        activeViewId: activeViewId,
        setActiveView: setActiveView,
        sendViewPosition: sendViewPosition,
    }); }, [activeViewId, setActiveView, sendViewPosition]);
    return _jsx(Context.Provider, { value: value, children: children });
}
export function useActiveVideoWeb() {
    var context = React.useContext(Context);
    if (!context) {
        throw new Error('useActiveVideoWeb must be used within a ActiveVideoWebProvider');
    }
    var activeViewId = context.activeViewId, setActiveView = context.setActiveView, sendViewPosition = context.sendViewPosition;
    var id = useId();
    return {
        active: activeViewId === id,
        setActive: function () {
            setActiveView(id);
        },
        currentActiveView: activeViewId,
        sendPosition: function (y) { return sendViewPosition(id, y); },
    };
}
