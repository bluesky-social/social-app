var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_10 } from '#/lib/constants';
import { Button, ButtonIcon } from '#/components/Button';
import { SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider } from '#/components/icons/SettingsSlider';
import * as Menu from '#/components/Menu';
import { useAnalytics } from '#/analytics';
export function HeaderDropdown(_a) {
    var sort = _a.sort, view = _a.view, setSort = _a.setSort, setView = _a.setView;
    var ax = useAnalytics();
    var _ = useLingui()._;
    return (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Thread options"], ["Thread options"])))), children: function (_a) {
                    var _b = _a.props, onPress = _b.onPress, props = __rest(_b, ["onPress"]);
                    return (_jsx(Button, __assign({ label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Thread options"], ["Thread options"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", hitSlop: HITSLOP_10, onPress: function () {
                            ax.metric('thread:click:headerMenuOpen', {});
                            onPress();
                        } }, props, { children: _jsx(ButtonIcon, { icon: SettingsSlider, size: "md" }) })));
                } }), _jsxs(Menu.Outer, { children: [_jsx(Menu.LabelText, { children: _jsx(Trans, { children: "Show replies as" }) }), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Linear"], ["Linear"])))), onPress: function () {
                                    setView('linear');
                                }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Linear" }) }), _jsx(Menu.ItemRadio, { selected: view === 'linear' })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Threaded"], ["Threaded"])))), onPress: function () {
                                    setView('tree');
                                }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Threaded" }) }), _jsx(Menu.ItemRadio, { selected: view === 'tree' })] })] }), _jsx(Menu.Divider, {}), _jsx(Menu.LabelText, { children: _jsx(Trans, { children: "Reply sorting" }) }), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Top replies first"], ["Top replies first"])))), onPress: function () {
                                    setSort('top');
                                }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Top replies first" }) }), _jsx(Menu.ItemRadio, { selected: sort === 'top' })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Oldest replies first"], ["Oldest replies first"])))), onPress: function () {
                                    setSort('oldest');
                                }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Oldest replies first" }) }), _jsx(Menu.ItemRadio, { selected: sort === 'oldest' })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Newest replies first"], ["Newest replies first"])))), onPress: function () {
                                    setSort('newest');
                                }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Newest replies first" }) }), _jsx(Menu.ItemRadio, { selected: sort === 'newest' })] })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
