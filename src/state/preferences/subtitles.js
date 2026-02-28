import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
var stateContext = React.createContext(Boolean(persisted.defaults.subtitlesEnabled));
stateContext.displayName = 'SubtitlesStateContext';
var setContext = React.createContext(function (_) { });
setContext.displayName = 'SubtitlesSetContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(Boolean(persisted.get('subtitlesEnabled'))), state = _b[0], setState = _b[1];
    var setStateWrapped = React.useCallback(function (subtitlesEnabled) {
        setState(Boolean(subtitlesEnabled));
        persisted.write('subtitlesEnabled', subtitlesEnabled);
    }, [setState]);
    React.useEffect(function () {
        return persisted.onUpdate('subtitlesEnabled', function (nextSubtitlesEnabled) {
            setState(Boolean(nextSubtitlesEnabled));
        });
    }, [setStateWrapped]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(setContext.Provider, { value: setStateWrapped, children: children }) }));
}
export var useSubtitlesEnabled = function () { return React.useContext(stateContext); };
export var useSetSubtitlesEnabled = function () { return React.useContext(setContext); };
