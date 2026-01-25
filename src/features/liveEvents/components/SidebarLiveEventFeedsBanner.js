import { jsx as _jsx } from "react/jsx-runtime";
import { LiveEventFeedCardCompact } from '#/features/liveEvents/components/LiveEventFeedCardCompact';
import { useLiveEvents } from '#/features/liveEvents/context';
export function SidebarLiveEventFeedsBanner() {
    var events = useLiveEvents();
    return events.feeds.map(function (feed) { return (_jsx(LiveEventFeedCardCompact, { feed: feed, metricContext: "sidebar" }, feed.id)); });
}
