import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import EventEmitter from 'eventemitter3';
var Context = createContext({
    events: new EventEmitter(),
    register: function () { },
    unregister: function () { },
});
Context.displayName = 'GlobalGestureEventsContext';
export function GlobalGestureEventsProvider(_a) {
    var children = _a.children, style = _a.style;
    var refCount = useRef(0);
    var events = useMemo(function () { return new EventEmitter(); }, []);
    var _b = useState(false), enabled = _b[0], setEnabled = _b[1];
    var ctx = useMemo(function () { return ({
        events: events,
        register: function () {
            refCount.current += 1;
            if (refCount.current === 1) {
                setEnabled(true);
            }
        },
        unregister: function () {
            refCount.current -= 1;
            if (refCount.current === 0) {
                setEnabled(false);
            }
        },
    }); }, [events, setEnabled]);
    var gesture = Gesture.Pan()
        .runOnJS(true)
        .enabled(enabled)
        .simultaneousWithExternalGesture()
        .onBegin(function (e) {
        events.emit('begin', e);
    })
        .onUpdate(function (e) {
        events.emit('update', e);
    })
        .onEnd(function (e) {
        events.emit('end', e);
    })
        .onFinalize(function (e) {
        events.emit('finalize', e);
    });
    return (_jsx(Context.Provider, { value: ctx, children: _jsx(GestureDetector, { gesture: gesture, children: _jsx(View, { collapsable: false, style: style, children: children }) }) }));
}
export function useGlobalGestureEvents() {
    return useContext(Context);
}
