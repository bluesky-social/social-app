import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { View } from 'react-native';
import { atoms as a } from '#/alf';
import { FullWindowOverlay } from '#/components/FullWindowOverlay';
import { usePolicyUpdateContext } from '#/components/PolicyUpdateOverlay/context';
import { Portal } from '#/components/PolicyUpdateOverlay/Portal';
import { Content } from '#/components/PolicyUpdateOverlay/updates/202508';
import { IS_IOS } from '#/env';
export { Provider } from '#/components/PolicyUpdateOverlay/context';
export { usePolicyUpdateContext } from '#/components/PolicyUpdateOverlay/context';
export { Outlet } from '#/components/PolicyUpdateOverlay/Portal';
export function PolicyUpdateOverlay() {
    var _a = usePolicyUpdateContext(), state = _a.state, setIsReadyToShowOverlay = _a.setIsReadyToShowOverlay;
    useEffect(function () {
        /**
         * Tell the context that we are ready to show the overlay.
         */
        setIsReadyToShowOverlay();
    }, [setIsReadyToShowOverlay]);
    /*
     * See `window.clearNux` example in `/state/queries/nuxs` for a way to clear
     * NUX state for local testing and debugging.
     */
    if (state.completed)
        return null;
    return (_jsx(Portal, { children: _jsx(FullWindowOverlay, { children: _jsx(View, { style: [
                    a.fixed,
                    a.inset_0,
                    // setting a zIndex when using FullWindowOverlay on iOS
                    // means the taps pass straight through to the underlying content (???)
                    // so don't set it on iOS. FullWindowOverlay already does the job.
                    !IS_IOS && { zIndex: 9999 },
                ], children: _jsx(Content, { state: state }) }) }) }));
}
