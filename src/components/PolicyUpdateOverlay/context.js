import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState, } from 'react';
import { useSession } from '#/state/session';
import { POLICY_UPDATE_IS_ENABLED } from '#/components/PolicyUpdateOverlay/config';
import { Provider as PortalProvider } from '#/components/PolicyUpdateOverlay/Portal';
import { usePolicyUpdateState, } from '#/components/PolicyUpdateOverlay/usePolicyUpdateState';
import { ENV } from '#/env';
var Context = createContext({
    state: {
        completed: true,
        complete: function () { },
    },
    /**
     * Although our data will be ready to go when the app shell mounts, we don't
     * want to show the overlay until we actually render it, which happens after
     * sigin/signup/onboarding in `createNativeStackNavigatorWithAuth`.
     */
    setIsReadyToShowOverlay: function () { },
});
Context.displayName = 'PolicyUpdateOverlayContext';
export function usePolicyUpdateContext() {
    var context = useContext(Context);
    if (!context) {
        throw new Error('usePolicyUpdateContext must be used within a PolicyUpdateProvider');
    }
    return context;
}
export function Provider(_a) {
    var children = _a.children;
    var hasSession = useSession().hasSession;
    var _b = useState(false), isReadyToShowOverlay = _b[0], setIsReadyToShowOverlay = _b[1];
    var state = usePolicyUpdateState({
        enabled: 
        // if the feature is enabled
        POLICY_UPDATE_IS_ENABLED &&
            // once shell has rendered
            isReadyToShowOverlay &&
            // only once logged in
            hasSession &&
            // only enabled in non-test environments
            ENV !== 'e2e',
    });
    var ctx = useMemo(function () { return ({
        state: state,
        setIsReadyToShowOverlay: function () {
            if (isReadyToShowOverlay)
                return;
            setIsReadyToShowOverlay(true);
        },
    }); }, [state, isReadyToShowOverlay, setIsReadyToShowOverlay]);
    return (_jsx(PortalProvider, { children: _jsx(Context.Provider, { value: ctx, children: children }) }));
}
