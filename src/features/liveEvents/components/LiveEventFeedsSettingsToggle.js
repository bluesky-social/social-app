var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import * as Toggle from '#/components/forms/Toggle';
import { Live_Stroke2_Corner0_Rounded as LiveIcon } from '#/components/icons/Live';
import { useLiveEventPreferences, useUpdateLiveEventPreferences, } from '#/features/liveEvents/preferences';
export function LiveEventFeedsSettingsToggle() {
    var _a;
    var _ = useLingui()._;
    var prefs = useLiveEventPreferences().data;
    var _b = useUpdateLiveEventPreferences({
        metricContext: 'settings',
    }), isPending = _b.isPending, updatedPrefs = _b.data, update = _b.mutate;
    var hideAllFeeds = !!((_a = (updatedPrefs || prefs)) === null || _a === void 0 ? void 0 : _a.hideAllFeeds);
    return (_jsx(Toggle.Item, { name: "enable_live_event_banner", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Show live events in your Discover Feed"], ["Show live events in your Discover Feed"])))), value: !hideAllFeeds, onChange: function () {
            if (!isPending) {
                update({ type: 'toggleHideAllFeeds' });
            }
        }, children: _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: LiveIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Show live events in your Discover Feed" }) }), _jsx(Toggle.Platform, {})] }) }));
}
var templateObject_1;
