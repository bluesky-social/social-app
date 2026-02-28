var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '#/alf';
import { DotGrid2x3_Stroke2_Corner0_Rounded as GripIcon } from '#/components/icons/DotGrid';
export function SortableList(_a) {
    var data = _a.data, keyExtractor = _a.keyExtractor, renderItem = _a.renderItem, onReorder = _a.onReorder, onDragStart = _a.onDragStart, onDragEnd = _a.onDragEnd, itemHeight = _a.itemHeight;
    var t = useTheme();
    var _b = useState(null), dragState = _b[0], setDragState = _b[1];
    var getNewPosition = function (state) {
        var translationY = state.currentY - state.startY;
        var rawNewPos = Math.round((state.activeIndex * itemHeight + translationY) / itemHeight);
        return Math.max(0, Math.min(rawNewPos, data.length - 1));
    };
    var handlePointerMove = function (e) {
        if (!dragState)
            return;
        e.preventDefault();
        setDragState(function (prev) { return (prev ? __assign(__assign({}, prev), { currentY: e.clientY }) : null); });
    };
    var handlePointerUp = function () {
        if (!dragState)
            return;
        var newPos = getNewPosition(dragState);
        if (newPos !== dragState.activeIndex) {
            var next = __spreadArray([], data, true);
            var moved = next.splice(dragState.activeIndex, 1)[0];
            next.splice(newPos, 0, moved);
            onReorder(next);
        }
        setDragState(null);
        onDragEnd === null || onDragEnd === void 0 ? void 0 : onDragEnd();
    };
    var handlePointerDown = function (e, index) {
        e.preventDefault();
        e.target.setPointerCapture(e.pointerId);
        setDragState({ activeIndex: index, currentY: e.clientY, startY: e.clientY });
        onDragStart === null || onDragStart === void 0 ? void 0 : onDragStart();
    };
    var newPos = dragState ? getNewPosition(dragState) : -1;
    return (_jsx(View, { style: [
            { height: data.length * itemHeight, position: 'relative' },
            t.atoms.bg_contrast_25,
        ], 
        // @ts-expect-error web-only pointer events
        onPointerMove: handlePointerMove, onPointerUp: handlePointerUp, onPointerCancel: handlePointerUp, children: data.map(function (item, index) {
            var isActive = (dragState === null || dragState === void 0 ? void 0 : dragState.activeIndex) === index;
            // Clamp translation so the item stays within list bounds.
            var rawTranslationY = isActive
                ? dragState.currentY - dragState.startY
                : 0;
            var translationY = isActive
                ? Math.max(-index * itemHeight, Math.min(rawTranslationY, (data.length - 1 - index) * itemHeight))
                : 0;
            // Non-dragged items shift to make room for the dragged item.
            var offset = 0;
            if (dragState && !isActive) {
                var orig = dragState.activeIndex;
                if (orig < newPos && index > orig && index <= newPos) {
                    offset = -itemHeight;
                }
                else if (orig > newPos && index < orig && index >= newPos) {
                    offset = itemHeight;
                }
            }
            var dragHandle = (_jsx("div", { onPointerDown: function (e) {
                    return handlePointerDown(e, index);
                }, style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 12,
                    paddingBottom: 12,
                    cursor: isActive ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                }, children: _jsx(GripIcon, { size: "lg", fill: t.atoms.text_contrast_medium.color, style: { pointerEvents: 'none' } }) }));
            return (_jsx(View, { style: [
                    {
                        position: 'absolute',
                        top: index * itemHeight,
                        left: 0,
                        right: 0,
                        height: itemHeight,
                        transform: [{ translateY: isActive ? translationY : offset }],
                        scale: isActive ? 1.03 : 1,
                        zIndex: isActive ? 999 : 0,
                        boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
                        // Animate scale/shadow on pickup, and transform for
                        // non-dragged items shifting into place.
                        transition: isActive
                            ? 'box-shadow 200ms ease, scale 200ms ease'
                            : dragState
                                ? 'transform 200ms ease'
                                : 'none',
                    },
                ], children: renderItem(item, dragHandle) }, keyExtractor(item)));
        }) }));
}
