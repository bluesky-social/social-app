import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a, useTheme } from '#/alf';
import { LiveEventFeedCardWide } from '#/features/liveEvents/components/LiveEventFeedCardWide';
import { useLiveEvents } from '#/features/liveEvents/context';
export function ExploreScreenLiveEventFeedsBanner() {
    var t = useTheme();
    var events = useLiveEvents();
    return events.feeds.map(function (feed) { return (_jsx(View, { style: [a.p_lg, a.border_b, t.atoms.border_contrast_low], children: _jsx(LiveEventFeedCardWide, { feed: feed, metricContext: "explore" }) }, feed.id)); });
}
