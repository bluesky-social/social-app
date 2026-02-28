import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { List } from '#/view/com/util/List';
import { atoms as a, useTheme } from '#/alf';
import * as FeedCard from '#/components/FeedCard';
import { IS_NATIVE, IS_WEB } from '#/env';
function keyExtractor(item) {
    return item.uri;
}
export var FeedsList = React.forwardRef(function FeedsListImpl(_a, ref) {
    var feeds = _a.feeds, headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
    var initialHeaderHeight = React.useState(headerHeight)[0];
    var bottomBarOffset = useBottomBarOffset(20);
    var t = useTheme();
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
    }, [scrollElRef, headerHeight]);
    React.useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    var renderItem = function (_a) {
        var item = _a.item, index = _a.index;
        return (_jsx(View, { style: [
                a.p_lg,
                (IS_WEB || index !== 0) && a.border_t,
                t.atoms.border_contrast_low,
            ], children: _jsx(FeedCard.Default, { view: item }) }));
    };
    return (_jsx(List, { data: feeds, renderItem: renderItem, keyExtractor: keyExtractor, ref: scrollElRef, headerOffset: headerHeight, ListFooterComponent: _jsx(View, { style: [{ height: initialHeaderHeight + bottomBarOffset }] }), showsVerticalScrollIndicator: false, desktopFixedHeight: true }));
});
