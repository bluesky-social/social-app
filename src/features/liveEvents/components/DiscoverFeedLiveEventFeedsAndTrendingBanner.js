var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useTrendingSettings } from '#/state/preferences/trending';
import { atoms as a, useLayoutBreakpoints } from '#/alf';
import { Button } from '#/components/Button';
import { TimesLarge_Stroke2_Corner0_Rounded as CloseIcon } from '#/components/icons/Times';
import { TrendingInterstitial } from '#/components/interstitials/Trending';
import * as Toast from '#/components/Toast';
import { LiveEventFeedCardWide } from '#/features/liveEvents/components/LiveEventFeedCardWide';
import { useUserPreferencedLiveEvents } from '#/features/liveEvents/context';
import { useUpdateLiveEventPreferences } from '#/features/liveEvents/preferences';
export function DiscoverFeedLiveEventFeedsAndTrendingBanner() {
    var events = useUserPreferencedLiveEvents();
    var rightNavVisible = useLayoutBreakpoints().rightNavVisible;
    var trendingDisabled = useTrendingSettings().trendingDisabled;
    if (!events.feeds.length) {
        if (!rightNavVisible && !trendingDisabled) {
            // only show trending on mobile when live event banner is not shown
            return _jsx(TrendingInterstitial, {});
        }
        else {
            // no feed, no trending
            return null;
        }
    }
    // On desktop, we show in the sidebar
    if (rightNavVisible)
        return null;
    return events.feeds.map(function (feed) { return _jsx(Inner, { feed: feed }, feed.id); });
}
function Inner(_a) {
    var feed = _a.feed;
    var _ = useLingui()._;
    var layout = feed.layouts.wide;
    var _b = useUpdateLiveEventPreferences({
        feed: feed,
        metricContext: 'discover',
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
    return (_jsx(_Fragment, { children: _jsx(View, { style: [a.px_lg, a.pt_md, a.pb_xs], children: _jsxs(View, { children: [_jsx(LiveEventFeedCardWide, { feed: feed, metricContext: "discover" }), _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Dismiss live event banner"], ["Dismiss live event banner"])))), size: "tiny", shape: "round", style: [a.absolute, a.z_10, { top: 6, right: 6 }], onPress: function () {
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
                        } })] }) }) }));
}
var templateObject_1, templateObject_2;
