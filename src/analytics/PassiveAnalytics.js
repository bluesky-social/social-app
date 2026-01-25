import { useEffect, useRef } from 'react';
import { getCurrentState, onAppStateChange } from '#/lib/appState';
import { useAnalytics } from '#/analytics';
/**
 * Tracks passive analytics like app foreground/background time.
 */
export function PassiveAnalytics() {
    var ax = useAnalytics();
    var lastActive = useRef(getCurrentState() === 'active' ? performance.now() : null);
    useEffect(function () {
        var sub = onAppStateChange(function (state) {
            if (state === 'active') {
                lastActive.current = performance.now();
                ax.metric('state:foreground', {});
            }
            else if (lastActive.current !== null) {
                ax.metric('state:background', {
                    secondsActive: Math.round((performance.now() - lastActive.current) / 1e3),
                });
            }
        });
        return function () { return sub.remove(); };
    }, [ax]);
    return null;
}
