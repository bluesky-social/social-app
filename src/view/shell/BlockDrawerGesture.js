import { jsx as _jsx } from "react/jsx-runtime";
import { useContext } from 'react';
import { DrawerGestureContext } from 'react-native-drawer-layout';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
export function BlockDrawerGesture(_a) {
    var _b;
    var children = _a.children;
    var drawerGesture = (_b = useContext(DrawerGestureContext)) !== null && _b !== void 0 ? _b : Gesture.Native(); // noop for web
    var scrollGesture = Gesture.Native().blocksExternalGesture(drawerGesture);
    return _jsx(GestureDetector, { gesture: scrollGesture, children: children });
}
