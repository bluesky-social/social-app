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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { atoms as a, useBreakpoints, useTheme, web } from '#/alf';
import { Text } from '#/components/Typography';
import { PressableWithHover } from '../util/PressableWithHover';
import { DraggableScrollView } from './DraggableScrollView';
// How much of the previous/next item we're showing
// to give the user a hint there's more to scroll.
var OFFSCREEN_ITEM_WIDTH = 20;
export function TabBar(_a) {
    var testID = _a.testID, selectedPage = _a.selectedPage, items = _a.items, onSelect = _a.onSelect, onPressSelected = _a.onPressSelected;
    var t = useTheme();
    var scrollElRef = useRef(null);
    var itemRefs = useRef([]);
    var gtMobile = useBreakpoints().gtMobile;
    var styles = gtMobile ? desktopStyles : mobileStyles;
    useEffect(function () {
        var _a, _b, _c;
        // On the web, the primary interaction is tapping.
        // Scrolling under tap feels disorienting so only adjust the scroll offset
        // when tapping on an item out of view--and we adjust by almost an entire page.
        var parent = (_b = (_a = scrollElRef === null || scrollElRef === void 0 ? void 0 : scrollElRef.current) === null || _a === void 0 ? void 0 : _a.getScrollableNode) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (!parent) {
            return;
        }
        var parentRect = parent.getBoundingClientRect();
        if (!parentRect) {
            return;
        }
        var parentLeft = parentRect.left, parentRight = parentRect.right, parentWidth = parentRect.width;
        var child = itemRefs.current[selectedPage];
        if (!child) {
            return;
        }
        var childRect = (_c = child.getBoundingClientRect) === null || _c === void 0 ? void 0 : _c.call(child);
        if (!childRect) {
            return;
        }
        var childLeft = childRect.left, childRight = childRect.right, childWidth = childRect.width;
        var dx = 0;
        if (childRight >= parentRight) {
            dx += childRight - parentRight;
            dx += parentWidth - childWidth - OFFSCREEN_ITEM_WIDTH;
        }
        else if (childLeft <= parentLeft) {
            dx -= parentLeft - childLeft;
            dx -= parentWidth - childWidth - OFFSCREEN_ITEM_WIDTH;
        }
        var x = parent.scrollLeft + dx;
        x = Math.max(0, x);
        x = Math.min(x, parent.scrollWidth - parentWidth);
        if (dx !== 0) {
            parent.scroll({
                left: x,
                behavior: 'smooth',
            });
        }
    }, [scrollElRef, selectedPage, styles]);
    var onPressItem = useCallback(function (index) {
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(index);
        if (index === selectedPage) {
            onPressSelected === null || onPressSelected === void 0 ? void 0 : onPressSelected(index);
        }
    }, [onSelect, selectedPage, onPressSelected]);
    return (_jsxs(View, { testID: testID, style: [t.atoms.bg, styles.outer], accessibilityRole: "tablist", children: [_jsx(DraggableScrollView, { testID: "".concat(testID, "-selector"), horizontal: true, showsHorizontalScrollIndicator: false, ref: scrollElRef, contentContainerStyle: styles.contentContainer, children: items.map(function (item, i) {
                    var selected = i === selectedPage;
                    return (_jsx(PressableWithHover, { testID: "".concat(testID, "-selector-").concat(i), ref: function (node) {
                            itemRefs.current[i] = node;
                        }, style: styles.item, hoverStyle: t.atoms.bg_contrast_25, onPress: function () { return onPressItem(i); }, accessibilityRole: "tab", children: _jsx(View, { style: styles.itemInner, children: _jsxs(Text, { emoji: true, testID: testID ? "".concat(testID, "-").concat(item) : undefined, style: [
                                    styles.itemText,
                                    selected ? t.atoms.text : t.atoms.text_contrast_medium,
                                    a.text_md,
                                    a.font_semi_bold,
                                    { lineHeight: 20 },
                                ], children: [item, _jsx(View, { style: [
                                            styles.itemIndicator,
                                            selected && {
                                                backgroundColor: t.palette.primary_500,
                                            },
                                        ] })] }) }) }, "".concat(item, "-").concat(i)));
                }) }), _jsx(View, { style: [t.atoms.border_contrast_low, styles.outerBottomBorder] })] }));
}
var desktopStyles = StyleSheet.create({
    outer: {
        flexDirection: 'row',
        width: 600,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
    },
    item: {
        flexGrow: 1,
        alignItems: 'stretch',
        paddingTop: 14,
        paddingHorizontal: 14,
        justifyContent: 'center',
    },
    itemInner: __assign({ alignItems: 'center' }, web({ overflowX: 'hidden' })),
    itemText: {
        textAlign: 'center',
        paddingBottom: 10 + 3,
    },
    itemIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 45,
        width: '100%',
    },
    outerBottomBorder: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '100%',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
});
var mobileStyles = StyleSheet.create({
    outer: {
        flexDirection: 'row',
    },
    contentContainer: {
        flexGrow: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: 6,
    },
    item: {
        flexGrow: 1,
        alignItems: 'stretch',
        paddingTop: 10,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    itemInner: __assign({ flexGrow: 1, alignItems: 'center' }, web({ overflowX: 'hidden' })),
    itemText: {
        textAlign: 'center',
        paddingBottom: 10 + 3,
    },
    itemIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 45,
        width: '100%',
    },
    outerBottomBorder: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '100%',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
});
