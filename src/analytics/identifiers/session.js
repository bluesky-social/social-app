import { useEffect, useState } from 'react';
import uuid from 'react-native-uuid';
import { onAppStateChange } from '#/lib/appState';
import { isSessionIdExpired } from '#/analytics/identifiers/util';
import { device } from '#/storage';
var sessionId = (function () {
    var existing = device.get(['nativeSessionId']);
    var lastEvent = device.get(['nativeSessionIdLastEventAt']);
    var id = existing && !isSessionIdExpired(lastEvent) ? existing : uuid.v4();
    device.set(['nativeSessionId'], id);
    device.set(['nativeSessionIdLastEventAt'], Date.now());
    return id;
})();
export function getInitialSessionId() {
    return sessionId;
}
export function useSessionId() {
    var _a = useState(function () { return sessionId; }), id = _a[0], setId = _a[1];
    useEffect(function () {
        var sub = onAppStateChange(function (state) {
            if (state === 'active') {
                var lastEvent = device.get(['nativeSessionIdLastEventAt']);
                if (isSessionIdExpired(lastEvent)) {
                    sessionId = uuid.v4();
                    device.set(['nativeSessionId'], sessionId);
                    setId(sessionId);
                }
            }
            device.set(['nativeSessionIdLastEventAt'], Date.now());
        });
        return function () { return sub.remove(); };
    }, []);
    return id;
}
