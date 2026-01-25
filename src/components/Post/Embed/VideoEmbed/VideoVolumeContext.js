import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var Context = React.createContext(null);
Context.displayName = 'VideoVolumeContext';
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useState(true), muted = _b[0], setMuted = _b[1];
    var _c = React.useState(1), volume = _c[0], setVolume = _c[1];
    var value = React.useMemo(function () { return ({
        muted: muted,
        setMuted: setMuted,
        volume: volume,
        setVolume: setVolume,
    }); }, [muted, setMuted, volume, setVolume]);
    return _jsx(Context.Provider, { value: value, children: children });
}
export function useVideoVolumeState() {
    var context = React.useContext(Context);
    if (!context) {
        throw new Error('useVideoVolumeState must be used within a VideoVolumeProvider');
    }
    return [context.volume, context.setVolume];
}
export function useVideoMuteState() {
    var context = React.useContext(Context);
    if (!context) {
        throw new Error('useVideoMuteState must be used within a VideoVolumeProvider');
    }
    return [context.muted, context.setMuted];
}
