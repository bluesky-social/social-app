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
import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, } from 'react-native';
import { useColorSchemeStyle } from '#/lib/hooks/useColorSchemeStyle';
import { usePalette } from '#/lib/hooks/usePalette';
import { clamp } from '#/lib/numbers';
import { colors, s } from '#/lib/styles';
import { IS_ANDROID } from '#/env';
import { Text } from './text/Text';
import { FlatList_INTERNAL } from './Views';
var HEADER_ITEM = { _reactKey: '__header__' };
var SELECTOR_ITEM = { _reactKey: '__selector__' };
var STICKY_HEADER_INDICES = [1];
export var ViewSelector = React.forwardRef(function ViewSelectorImpl(_a, ref) {
    var sections = _a.sections, items = _a.items, refreshing = _a.refreshing, renderHeader = _a.renderHeader, renderItem = _a.renderItem, ListFooterComponent = _a.ListFooterComponent, onSelectView = _a.onSelectView, onScroll = _a.onScroll, onRefresh = _a.onRefresh, onEndReached = _a.onEndReached;
    var pal = usePalette('default');
    var _b = useState(0), selectedIndex = _b[0], setSelectedIndex = _b[1];
    var flatListRef = React.useRef(null);
    // events
    // =
    var keyExtractor = React.useCallback(function (item) { return item._reactKey; }, []);
    var onPressSelection = React.useCallback(function (index) { return setSelectedIndex(clamp(index, 0, sections.length)); }, [setSelectedIndex, sections]);
    useEffect(function () {
        onSelectView === null || onSelectView === void 0 ? void 0 : onSelectView(selectedIndex);
    }, [selectedIndex, onSelectView]);
    React.useImperativeHandle(ref, function () { return ({
        scrollToTop: function () {
            var _a;
            (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0 });
        },
    }); });
    // rendering
    // =
    var renderItemInternal = React.useCallback(function (_a) {
        var item = _a.item;
        if (item === HEADER_ITEM) {
            if (renderHeader) {
                return renderHeader();
            }
            return _jsx(View, {});
        }
        else if (item === SELECTOR_ITEM) {
            return (_jsx(Selector, { items: sections, selectedIndex: selectedIndex, onSelect: onPressSelection }));
        }
        else {
            return renderItem(item);
        }
    }, [sections, selectedIndex, onPressSelection, renderHeader, renderItem]);
    var data = React.useMemo(function () { return __spreadArray([HEADER_ITEM, SELECTOR_ITEM], items, true); }, [items]);
    return (_jsx(FlatList_INTERNAL
    // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
    , { 
        // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
        ref: flatListRef, data: data, keyExtractor: keyExtractor, renderItem: renderItemInternal, ListFooterComponent: ListFooterComponent, 
        // NOTE sticky header disabled on android due to major performance issues -prf
        stickyHeaderIndices: IS_ANDROID ? undefined : STICKY_HEADER_INDICES, onScroll: onScroll, onEndReached: onEndReached, refreshControl: _jsx(RefreshControl, { refreshing: refreshing, onRefresh: onRefresh, tintColor: pal.colors.text }), onEndReachedThreshold: 0.6, contentContainerStyle: s.contentContainer, removeClippedSubviews: true, scrollIndicatorInsets: { right: 1 } }));
});
export function Selector(_a) {
    var selectedIndex = _a.selectedIndex, items = _a.items, onSelect = _a.onSelect;
    var pal = usePalette('default');
    var borderColor = useColorSchemeStyle({ borderColor: colors.black }, { borderColor: colors.white });
    var onPressItem = function (index) {
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(index);
    };
    return (_jsx(View, { style: {
            width: '100%',
            backgroundColor: pal.colors.background,
        }, children: _jsx(ScrollView, { testID: "selector", horizontal: true, showsHorizontalScrollIndicator: false, children: _jsx(View, { style: [pal.view, styles.outer], children: items.map(function (item, i) {
                    var selected = i === selectedIndex;
                    return (_jsx(Pressable, { testID: "selector-".concat(i), onPress: function () { return onPressItem(i); }, accessibilityLabel: item, accessibilityHint: "Selects ".concat(item), children: _jsx(View, { style: [
                                styles.item,
                                selected && styles.itemSelected,
                                borderColor,
                            ], children: _jsx(Text, { style: selected
                                    ? [styles.labelSelected, pal.text]
                                    : [styles.label, pal.textLight], children: item }) }) }, item));
                }) }) }) }));
}
var styles = StyleSheet.create({
    outer: {
        flexDirection: 'row',
        paddingHorizontal: 14,
    },
    item: {
        marginRight: 14,
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: 12,
    },
    itemSelected: {
        borderBottomWidth: 3,
    },
    label: {
        fontWeight: '600',
    },
    labelSelected: {
        fontWeight: '600',
    },
    underline: {
        position: 'absolute',
        height: 4,
        bottom: 0,
    },
});
