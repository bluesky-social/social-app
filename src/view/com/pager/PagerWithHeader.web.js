import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { Pager, } from '#/view/com/pager/Pager';
import { atoms as a, web } from '#/alf';
import * as Layout from '#/components/Layout';
import { TabBar } from './TabBar';
export var PagerWithHeader = React.forwardRef(function PageWithHeaderImpl(_a, ref) {
    var children = _a.children, testID = _a.testID, items = _a.items, isHeaderReady = _a.isHeaderReady, renderHeader = _a.renderHeader, initialPage = _a.initialPage, onPageSelected = _a.onPageSelected, onCurrentPageSelected = _a.onCurrentPageSelected;
    var _b = React.useState(0), currentPage = _b[0], setCurrentPage = _b[1];
    var renderTabBar = React.useCallback(function (props) {
        return (_jsx(PagerTabBar, { items: items, renderHeader: renderHeader, isHeaderReady: isHeaderReady, currentPage: currentPage, onCurrentPageSelected: onCurrentPageSelected, onSelect: props.onSelect, tabBarAnchor: props.tabBarAnchor, testID: testID }));
    }, [
        items,
        isHeaderReady,
        renderHeader,
        currentPage,
        onCurrentPageSelected,
        testID,
    ]);
    var onPageSelectedInner = React.useCallback(function (index) {
        setCurrentPage(index);
        onPageSelected === null || onPageSelected === void 0 ? void 0 : onPageSelected(index);
    }, [onPageSelected, setCurrentPage]);
    return (_jsx(Pager, { ref: ref, testID: testID, initialPage: initialPage, onPageSelected: onPageSelectedInner, renderTabBar: renderTabBar, children: toArray(children)
            .filter(Boolean)
            .map(function (child, i) {
            var isReady = isHeaderReady;
            return (_jsx(View, { collapsable: false, style: {
                    display: isReady ? undefined : 'none',
                }, children: _jsx(PagerItem, { isFocused: i === currentPage, renderTab: child }) }, i));
        }) }));
});
var PagerTabBar = function (_a) {
    var currentPage = _a.currentPage, items = _a.items, isHeaderReady = _a.isHeaderReady, testID = _a.testID, renderHeader = _a.renderHeader, onCurrentPageSelected = _a.onCurrentPageSelected, onSelect = _a.onSelect, tabBarAnchor = _a.tabBarAnchor;
    return (_jsxs(_Fragment, { children: [_jsx(Layout.Center, { children: renderHeader === null || renderHeader === void 0 ? void 0 : renderHeader({ setMinimumHeight: noop }) }), tabBarAnchor, _jsx(Layout.Center, { style: [
                    a.z_10,
                    web([
                        a.sticky,
                        {
                            top: 0,
                            display: isHeaderReady ? undefined : 'none',
                        },
                    ]),
                ], children: _jsx(TabBar, { testID: testID, items: items, selectedPage: currentPage, onSelect: onSelect, onPressSelected: onCurrentPageSelected, dragProgress: undefined /* native-only */, dragState: undefined /* native-only */ }) })] }));
};
PagerTabBar = React.memo(PagerTabBar);
function PagerItem(_a) {
    var isFocused = _a.isFocused, renderTab = _a.renderTab;
    var scrollElRef = useAnimatedRef();
    if (renderTab == null) {
        return null;
    }
    return renderTab({
        headerHeight: 0,
        isFocused: isFocused,
        scrollElRef: scrollElRef,
    });
}
function toArray(v) {
    if (Array.isArray(v)) {
        return v;
    }
    return [v];
}
function noop() { }
