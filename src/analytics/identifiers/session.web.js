import { useEffect, useState } from 'react';
import uuid from 'react-native-uuid';
import { onAppStateChange } from '#/lib/appState';
import { isSessionIdExpired } from '#/analytics/identifiers/util';
var SESSION_ID_KEY = 'bsky_session_id';
var LAST_EVENT_KEY = 'bsky_session_id_last_event_at';
var sessionId = (function () {
    var existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    var lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY);
    var lastEvent = lastEventStr ? Number(lastEventStr) : undefined;
    var id = existing && !isSessionIdExpired(lastEvent) ? existing : uuid.v4();
    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()));
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
                var lastEventStr = window.sessionStorage.getItem(LAST_EVENT_KEY);
                var lastEvent = lastEventStr ? Number(lastEventStr) : undefined;
                if (isSessionIdExpired(lastEvent)) {
                    sessionId = uuid.v4();
                    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
                    setId(sessionId);
                }
            }
            window.sessionStorage.setItem(LAST_EVENT_KEY, String(Date.now()));
        });
        return function () { return sub.remove(); };
    }, []);
    return id;
}
