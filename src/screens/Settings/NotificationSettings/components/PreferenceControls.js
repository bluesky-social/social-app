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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNotificationSettingsUpdateMutation } from '#/state/queries/notifications/settings';
import { atoms as a, platform, useTheme } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { Divider } from '../../components/SettingsList';
export function PreferenceControls(_a) {
    var name = _a.name, syncOthers = _a.syncOthers, preference = _a.preference, _b = _a.allowDisableInApp, allowDisableInApp = _b === void 0 ? true : _b;
    if (!preference)
        return (_jsx(View, { style: [a.w_full, a.pt_5xl, a.align_center], children: _jsx(Loader, { size: "xl" }) }));
    return (_jsx(Inner, { name: name, syncOthers: syncOthers, preference: preference, allowDisableInApp: allowDisableInApp }));
}
export function Inner(_a) {
    var name = _a.name, _b = _a.syncOthers, syncOthers = _b === void 0 ? [] : _b, preference = _a.preference, allowDisableInApp = _a.allowDisableInApp;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var mutate = useNotificationSettingsUpdateMutation().mutate;
    var channels = useMemo(function () {
        var arr = [];
        if (preference.list)
            arr.push('list');
        if (preference.push)
            arr.push('push');
        return arr;
    }, [preference]);
    var onChangeChannels = function (change) {
        var _a;
        var newPreference = __assign(__assign({}, preference), { list: change.includes('list'), push: change.includes('push') });
        ax.metric('activityPreference:changeChannels', {
            name: name,
            push: newPreference.push,
            list: newPreference.list,
        });
        mutate(__assign((_a = {}, _a[name] = newPreference, _a), Object.fromEntries(syncOthers.map(function (key) { return [key, newPreference]; }))));
    };
    var onChangeFilter = function (_a) {
        var _b;
        var change = _a[0];
        if (change !== 'all' && change !== 'follows')
            throw new Error('Invalid filter');
        var newPreference = __assign(__assign({}, preference), { include: change });
        ax.metric('activityPreference:changeFilter', { name: name, value: change });
        mutate(__assign((_b = {}, _b[name] = newPreference, _b), Object.fromEntries(syncOthers.map(function (key) { return [key, newPreference]; }))));
    };
    return (_jsxs(View, { style: [a.px_xl, a.pt_md, a.gap_sm], children: [_jsx(Toggle.Group, { type: "checkbox", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select your preferred notification channels"], ["Select your preferred notification channels"])))), values: channels, onChange: onChangeChannels, children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Toggle.Item, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Receive push notifications"], ["Receive push notifications"])))), name: "push", style: [
                                a.py_xs,
                                platform({
                                    native: [a.justify_between],
                                    web: [a.flex_row_reverse, a.gap_sm],
                                }),
                            ], children: [_jsx(Toggle.LabelText, { style: [t.atoms.text, a.font_normal, a.text_md, a.flex_1], children: _jsx(Trans, { children: "Push notifications" }) }), _jsx(Toggle.Platform, {})] }), allowDisableInApp && (_jsxs(Toggle.Item, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Receive in-app notifications"], ["Receive in-app notifications"])))), name: "list", style: [
                                a.py_xs,
                                platform({
                                    native: [a.justify_between],
                                    web: [a.flex_row_reverse, a.gap_sm],
                                }),
                            ], children: [_jsx(Toggle.LabelText, { style: [t.atoms.text, a.font_normal, a.text_md, a.flex_1], children: _jsx(Trans, { children: "In-app notifications" }) }), _jsx(Toggle.Platform, {})] }))] }) }), 'include' in preference && (_jsxs(_Fragment, { children: [_jsx(Divider, {}), _jsx(Text, { style: [a.font_semi_bold, a.text_md], children: _jsx(Trans, { children: "From" }) }), _jsx(Toggle.Group, { type: "radio", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Filter who you receive notifications from"], ["Filter who you receive notifications from"])))), values: [preference.include], onChange: onChangeFilter, disabled: channels.length === 0, children: _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Toggle.Item, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Everyone"], ["Everyone"])))), name: "all", style: [a.flex_row, a.py_xs, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [
                                                channels.length > 0 && t.atoms.text,
                                                a.font_normal,
                                                a.text_md,
                                            ], children: _jsx(Trans, { children: "Everyone" }) })] }), _jsxs(Toggle.Item, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["People I follow"], ["People I follow"])))), name: "follows", style: [a.flex_row, a.py_xs, a.gap_sm], children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { style: [
                                                channels.length > 0 && t.atoms.text,
                                                a.font_normal,
                                                a.text_md,
                                            ], children: _jsx(Trans, { children: "People I follow" }) })] })] }) })] }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
