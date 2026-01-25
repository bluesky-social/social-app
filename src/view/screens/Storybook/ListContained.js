import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { ScrollProvider } from '#/lib/ScrollContext';
import { List } from '#/view/com/util/List';
import { Button, ButtonText } from '#/components/Button';
import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';
export function ListContained() {
    var _a = React.useState(false), animated = _a[0], setAnimated = _a[1];
    var ref = React.useRef(null);
    var data = React.useMemo(function () {
        return Array.from({ length: 100 }, function (_, i) { return ({
            id: i,
            text: "Message ".concat(i),
        }); });
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(View, { style: { width: '100%', height: 300 }, children: _jsx(ScrollProvider, { onScroll: function (e) {
                        'worklet';
                        console.log(JSON.stringify({
                            contentOffset: e.contentOffset,
                            layoutMeasurement: e.layoutMeasurement,
                            contentSize: e.contentSize,
                        }));
                    }, children: _jsx(List, { data: data, renderItem: function (item) {
                            return (_jsx(View, { style: {
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: 'rgba(0,0,0,0.1)',
                                }, children: _jsx(Text, { children: item.item.text }) }));
                        }, keyExtractor: function (item) { return item.id.toString(); }, disableFullWindowScroll: true, style: { flex: 1 }, onStartReached: function () {
                            console.log('Start Reached');
                        }, onEndReached: function () {
                            console.log('End Reached (threshold of 2)');
                        }, onEndReachedThreshold: 2, ref: ref, disableVirtualization: true }) }) }), _jsx(View, { style: { flexDirection: 'row', gap: 10, alignItems: 'center' }, children: _jsxs(Toggle.Item, { name: "a", label: "Click me", value: animated, onChange: function () { return setAnimated(function (prev) { return !prev; }); }, children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: "Animated Scrolling" })] }) }), _jsx(Button, { variant: "solid", color: "primary", size: "large", label: "Scroll to End", onPress: function () { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ animated: animated, offset: 0 }); }, children: _jsx(ButtonText, { children: "Scroll to Top" }) }), _jsx(Button, { variant: "solid", color: "primary", size: "large", label: "Scroll to End", onPress: function () { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: animated }); }, children: _jsx(ButtonText, { children: "Scroll to End" }) }), _jsx(Button, { variant: "solid", color: "primary", size: "large", label: "Scroll to Offset 100", onPress: function () { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ animated: animated, offset: 500 }); }, children: _jsx(ButtonText, { children: "Scroll to Offset 500" }) })] }));
}
