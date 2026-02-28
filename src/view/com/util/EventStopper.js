import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
/**
 * This utility function captures events and stops
 * them from propagating upwards.
 */
export function EventStopper(_a) {
    var children = _a.children, style = _a.style, _b = _a.onKeyDown, onKeyDown = _b === void 0 ? true : _b;
    var stop = function (e) {
        e.stopPropagation();
    };
    return (_jsx(View, { onStartShouldSetResponder: function (_) { return true; }, onTouchEnd: stop, 
        // @ts-ignore web only -prf
        onClick: stop, onKeyDown: onKeyDown ? stop : undefined, style: style, children: children }));
}
