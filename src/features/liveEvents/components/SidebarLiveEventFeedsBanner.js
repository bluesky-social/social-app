var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a } from '#/alf';
import { Button } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as CloseIcon } from '#/components/icons/Times';
import * as Toast from '#/components/Toast';
import { LiveEventFeedCardCompact } from '#/features/liveEvents/components/LiveEventFeedCardCompact';
import { useUserPreferencedLiveEvents } from '#/features/liveEvents/context';
import { useUpdateLiveEventPreferences } from '#/features/liveEvents/preferences';
export function SidebarLiveEventFeedsBanner() {
    var events = useUserPreferencedLiveEvents();
    return events.feeds.map(function (feed) { return _jsx(Inner, { feed: feed }, feed.id); });
}
function Inner(_a) {
    var feed = _a.feed;
    var _ = useLingui()._;
    var layout = feed.layouts.wide;
    var _b = useUpdateLiveEventPreferences({
        feed: feed,
        metricContext: 'sidebar',
        onUpdateSuccess: function (_a) {
            var undoAction = _a.undoAction;
            Toast.show(_jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, {}), _jsx(Toast.Text, { children: undoAction ? (_jsx(Trans, { children: "Live event hidden" })) : (_jsx(Trans, { children: "Live event unhidden" })) }), undoAction && (_jsx(Toast.Action, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Undo"], ["Undo"])))), onPress: function () {
                            if (undoAction) {
                                update(undoAction);
                            }
                        }, children: _jsx(Trans, { children: "Undo" }) }))] }), { type: 'success' });
        },
    }), update = _b.mutate, variables = _b.variables;
    if (variables)
        return null;
    return (_jsxs(View, { style: [a.relative], children: [_jsx(LiveEventFeedCardCompact, { feed: feed, metricContext: "sidebar" }), _jsx(View, { style: [a.justify_center, a.absolute, { top: 0, right: 6, bottom: 0 }], children: _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Dismiss live event banner"], ["Dismiss live event banner"])))), size: "tiny", shape: "round", style: [a.z_10], onPress: function () {
                        update({ type: 'hideFeed', id: feed.id });
                    }, children: function (_a) {
                        var hovered = _a.hovered, pressed = _a.pressed;
                        return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                        a.absolute,
                                        a.inset_0,
                                        a.rounded_full,
                                        {
                                            backgroundColor: layout.overlayColor,
                                            opacity: hovered || pressed ? 0.8 : 0.6,
                                        },
                                    ] }), _jsx(CloseIcon, { size: "xs", fill: layout.textColor, style: [a.z_20] })] }));
                    } }) })] }));
}
var templateObject_1, templateObject_2;
