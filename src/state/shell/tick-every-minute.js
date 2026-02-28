import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var stateContext = React.createContext(0);
stateContext.displayName = 'TickEveryMinuteContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(Date.now()), tick = _b[0], setTick = _b[1];
    React.useEffect(function () {
        var i = setInterval(function () {
            setTick(Date.now());
        }, 60000);
        return function () { return clearInterval(i); };
    }, []);
    return _jsx(stateContext.Provider, { value: tick, children: children });
}
export function useTickEveryMinute() {
    return React.useContext(stateContext);
}
