import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
import { IS_WEB } from '#/env';
var stateContext = React.createContext(persisted.defaults.kawaii);
stateContext.displayName = 'KawaiiStateContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(persisted.get('kawaii')), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (kawaii) {
        setState(kawaii);
        persisted.write('kawaii', kawaii);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('kawaii', function (nextKawaii) {
            setState(nextKawaii);
        });
    }, [setStateWrapped]);
    React.useEffect(function () {
        // dumb and stupid but it's web only so just refresh the page if you want to change it
        if (IS_WEB) {
            var kawaii = new URLSearchParams(window.location.search).get('kawaii');
            switch (kawaii) {
                case 'true':
                    setStateWrapped(true);
                    break;
                case 'false':
                    setStateWrapped(false);
                    break;
            }
        }
    }, [setStateWrapped]);
    return _jsx(stateContext.Provider, { value: state, children: children });
}
export function useKawaiiMode() {
    return React.useContext(stateContext);
}
