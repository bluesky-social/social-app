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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, } from 'react';
import { AppState } from 'react-native';
import throttle from 'lodash.throttle';
import { PROD_FEEDS, STAGING_FEEDS } from '#/lib/constants';
import { isFeedSourceFeedInfo, } from '#/state/queries/feed';
import { getItemsForFeedback } from '#/view/com/posts/PostFeed';
import { useAnalytics } from '#/analytics';
import { useAgent } from './session';
export var FEEDBACK_FEEDS = __spreadArray(__spreadArray([], PROD_FEEDS, true), STAGING_FEEDS, true);
export var THIRD_PARTY_ALLOWED_INTERACTIONS = new Set([
    // These are explicit actions and are therefore fine to send.
    'app.bsky.feed.defs#requestLess',
    'app.bsky.feed.defs#requestMore',
    // These can be inferred from the firehose and are therefore fine to send.
    'app.bsky.feed.defs#interactionLike',
    'app.bsky.feed.defs#interactionQuote',
    'app.bsky.feed.defs#interactionReply',
    'app.bsky.feed.defs#interactionRepost',
    // This can be inferred from pagination requests for everything except the very last page
    // so it is fine to send. It is crucial for third party algorithmic feeds to receive these.
    'app.bsky.feed.defs#interactionSeen',
]);
var stateContext = createContext({
    enabled: false,
    onItemSeen: function (_item) { },
    sendInteraction: function (_interaction) { },
    feedDescriptor: undefined,
    feedSourceInfo: undefined,
});
stateContext.displayName = 'FeedFeedbackContext';
export function useFeedFeedback(feedSourceInfo, hasSession) {
    var _a;
    var ax = useAnalytics();
    var logger = ax.logger.useChild(ax.logger.Context.FeedFeedback);
    var agent = useAgent();
    var feed = !!feedSourceInfo && isFeedSourceFeedInfo(feedSourceInfo)
        ? feedSourceInfo
        : undefined;
    var isDiscover = isDiscoverFeed(feed === null || feed === void 0 ? void 0 : feed.feedDescriptor);
    var acceptsInteractions = Boolean(isDiscover || (feed === null || feed === void 0 ? void 0 : feed.acceptsInteractions));
    var proxyDid = (_a = feed === null || feed === void 0 ? void 0 : feed.view) === null || _a === void 0 ? void 0 : _a.did;
    var enabled = Boolean(feed) && Boolean(proxyDid) && acceptsInteractions && hasSession;
    var queue = useRef(new Set());
    var history = useRef(new WeakSet());
    var flushEvents = useCallback(function (stats, feedDescriptor) {
        if (stats === null) {
            return;
        }
        if (stats.clickthroughCount > 0) {
            ax.metric('feed:clickthrough', {
                count: stats.clickthroughCount,
                feed: feedDescriptor,
            });
            stats.clickthroughCount = 0;
        }
        if (stats.engagedCount > 0) {
            ax.metric('feed:engaged', {
                count: stats.engagedCount,
                feed: feedDescriptor,
            });
            stats.engagedCount = 0;
        }
        if (stats.seenCount > 0) {
            ax.metric('feed:seen', {
                count: stats.seenCount,
                feed: feedDescriptor,
            });
            stats.seenCount = 0;
        }
    }, [ax]);
    var aggregatedStats = useRef(null);
    var throttledFlushAggregatedStats = useMemo(function () {
        return throttle(function () {
            var _a;
            return flushEvents(aggregatedStats.current, (_a = feed === null || feed === void 0 ? void 0 : feed.feedDescriptor) !== null && _a !== void 0 ? _a : 'unknown');
        }, 45e3, {
            leading: true, // The outer call is already throttled somewhat.
            trailing: true,
        });
    }, [feed === null || feed === void 0 ? void 0 : feed.feedDescriptor, flushEvents]);
    var sendToFeedNoDelay = useCallback(function () {
        var interactions = Array.from(queue.current).map(toInteraction);
        queue.current.clear();
        var interactionsToSend = interactions.filter(function (interaction) {
            return interaction.event &&
                isInteractionAllowed(enabled, feed, interaction.event);
        });
        if (interactionsToSend.length === 0) {
            return;
        }
        // Send to the feed
        agent.app.bsky.feed
            .sendInteractions({ interactions: interactionsToSend }, {
            encoding: 'application/json',
            headers: {
                'atproto-proxy': "".concat(proxyDid, "#bsky_fg"),
            },
        })
            .catch(function () { }); // ignore upstream errors
        if (aggregatedStats.current === null) {
            aggregatedStats.current = createAggregatedStats();
        }
        sendOrAggregateInteractionsForStats(aggregatedStats.current, interactionsToSend);
        throttledFlushAggregatedStats();
        logger.debug('flushed');
    }, [agent, throttledFlushAggregatedStats, proxyDid, enabled, feed]);
    var sendToFeed = useMemo(function () {
        return throttle(sendToFeedNoDelay, 10e3, {
            leading: false,
            trailing: true,
        });
    }, [sendToFeedNoDelay]);
    useEffect(function () {
        if (!enabled) {
            return;
        }
        var sub = AppState.addEventListener('change', function (state) {
            if (state === 'background') {
                sendToFeed.flush();
            }
        });
        return function () { return sub.remove(); };
    }, [enabled, sendToFeed]);
    var onItemSeen = useCallback(function (feedItem) {
        if (!enabled) {
            return;
        }
        var items = getItemsForFeedback(feedItem);
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var _a = items_1[_i], postItem = _a.item, feedContext = _a.feedContext, reqId = _a.reqId;
            if (!history.current.has(postItem)) {
                history.current.add(postItem);
                queue.current.add(toString({
                    item: postItem.uri,
                    event: 'app.bsky.feed.defs#interactionSeen',
                    feedContext: feedContext,
                    reqId: reqId,
                }));
                sendToFeed();
            }
        }
    }, [enabled, sendToFeed]);
    var sendInteraction = useCallback(function (interaction) {
        if (!enabled) {
            return;
        }
        logger.debug('sendInteraction', __assign({}, interaction));
        if (!history.current.has(interaction)) {
            history.current.add(interaction);
            queue.current.add(toString(interaction));
            sendToFeed();
        }
    }, [enabled, sendToFeed]);
    return useMemo(function () {
        return {
            enabled: enabled,
            // pass this method to the <List> onItemSeen
            onItemSeen: onItemSeen,
            // call on various events
            // queues the event to be sent with the throttled sendToFeed call
            sendInteraction: sendInteraction,
            feedDescriptor: feed === null || feed === void 0 ? void 0 : feed.feedDescriptor,
            feedSourceInfo: typeof feed === 'object' ? feed : undefined,
        };
    }, [enabled, onItemSeen, sendInteraction, feed]);
}
export var FeedFeedbackProvider = stateContext.Provider;
export function useFeedFeedbackContext() {
    return useContext(stateContext);
}
// TODO
// We will introduce a permissions framework for 3p feeds to
// take advantage of the feed feedback API. Until that's in
// place, we're hardcoding it to the discover feed.
// -prf
export function isDiscoverFeed(feed) {
    return !!feed && FEEDBACK_FEEDS.includes(feed);
}
function isInteractionAllowed(enabled, feed, interaction) {
    if (!enabled || !feed) {
        return false;
    }
    var isDiscover = isDiscoverFeed(feed.feedDescriptor);
    return isDiscover ? true : THIRD_PARTY_ALLOWED_INTERACTIONS.has(interaction);
}
function toString(interaction) {
    return "".concat(interaction.item, "|").concat(interaction.event, "|").concat(interaction.feedContext || '', "|").concat(interaction.reqId || '');
}
function toInteraction(str) {
    var _a = str.split('|'), item = _a[0], event = _a[1], feedContext = _a[2], reqId = _a[3];
    return { item: item, event: event, feedContext: feedContext, reqId: reqId };
}
function createAggregatedStats() {
    return {
        clickthroughCount: 0,
        engagedCount: 0,
        seenCount: 0,
    };
}
function sendOrAggregateInteractionsForStats(stats, interactions) {
    for (var _i = 0, interactions_1 = interactions; _i < interactions_1.length; _i++) {
        var interaction = interactions_1[_i];
        switch (interaction.event) {
            // The events are aggregated and sent later in batches.
            case 'app.bsky.feed.defs#clickthroughAuthor':
            case 'app.bsky.feed.defs#clickthroughEmbed':
            case 'app.bsky.feed.defs#clickthroughItem':
            case 'app.bsky.feed.defs#clickthroughReposter': {
                stats.clickthroughCount++;
                break;
            }
            case 'app.bsky.feed.defs#interactionLike':
            case 'app.bsky.feed.defs#interactionQuote':
            case 'app.bsky.feed.defs#interactionReply':
            case 'app.bsky.feed.defs#interactionRepost':
            case 'app.bsky.feed.defs#interactionShare': {
                stats.engagedCount++;
                break;
            }
            case 'app.bsky.feed.defs#interactionSeen': {
                stats.seenCount++;
                break;
            }
        }
    }
}
