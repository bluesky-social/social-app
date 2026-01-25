import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/core';
if ('scrollRestoration' in history) {
    // Tell the brower not to mess with the scroll.
    // We're doing that manually below.
    history.scrollRestoration = 'manual';
}
function createInitialScrollState() {
    return {
        scrollYs: new Map(),
        focusedKey: null,
    };
}
export function useWebScrollRestoration() {
    var state = useState(createInitialScrollState)[0];
    var navigation = useNavigation();
    useEffect(function () {
        function onDispatch() {
            if (state.focusedKey) {
                // Remember where we were for later.
                state.scrollYs.set(state.focusedKey, window.scrollY);
                // TODO: Strictly speaking, this is a leak. We never clean up.
                // This is because I'm not sure when it's appropriate to clean it up.
                // It doesn't seem like popstate is enough because it can still Forward-Back again.
                // Maybe we should use sessionStorage. Or check what Next.js is doing?
            }
        }
        // We want to intercept any push/pop/replace *before* the re-render.
        // There is no official way to do this yet, but this works okay for now.
        // https://twitter.com/satya164/status/1737301243519725803
        navigation.addListener('__unsafe_action__', onDispatch);
        return function () {
            navigation.removeListener('__unsafe_action__', onDispatch);
        };
    }, [state, navigation]);
    var screenListeners = useMemo(function () { return ({
        focus: function (e) {
            var _a, _b;
            var scrollY = (_a = state.scrollYs.get(e.target)) !== null && _a !== void 0 ? _a : 0;
            window.scrollTo(0, scrollY);
            state.focusedKey = (_b = e.target) !== null && _b !== void 0 ? _b : null;
        },
    }); }, [state]);
    return screenListeners;
}
