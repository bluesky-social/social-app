var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { AppBskyEmbedVideo, AtUri } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { VIDEO_FEED_URI } from '#/lib/constants';
import { makeCustomFeedLink } from '#/lib/routes/links';
import { RQKEY, usePostFeedQuery } from '#/state/queries/post-feed';
import { BlockDrawerGesture } from '#/view/shell/BlockDrawerGesture';
import { atoms as a, tokens, useGutters, useTheme } from '#/alf';
import { ButtonIcon } from '#/components/Button';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { CompactVideoPostCard, CompactVideoPostCardPlaceholder, } from '#/components/VideoPostCard';
import { useAnalytics } from '#/analytics';
var CARD_WIDTH = 100;
var FEED_DESC = "feedgen|".concat(VIDEO_FEED_URI);
var FEED_PARAMS = {
    feedCacheKey: 'explore',
};
export function ExploreTrendingVideos() {
    var gutters = useGutters([0, 'base']);
    var _a = usePostFeedQuery(FEED_DESC, FEED_PARAMS), data = _a.data, isLoading = _a.isLoading, error = _a.error;
    // Refetch on tab change if nothing else is using this query.
    var queryClient = useQueryClient();
    useFocusEffect(function () {
        return function () {
            var query = queryClient
                .getQueryCache()
                .find({ queryKey: RQKEY(FEED_DESC, FEED_PARAMS) });
            if (query && query.getObserversCount() <= 1) {
                query.fetch();
            }
        };
    });
    // const {data: saved} = useSavedFeeds()
    // const isSavedAlready = useMemo(() => {
    //   return !!saved?.feeds?.some(info => info.config.value === VIDEO_FEED_URI)
    // }, [saved])
    // const {mutateAsync: addSavedFeeds, isPending: isPinPending} =
    //   useAddSavedFeedsMutation()
    // const pinFeed = useCallback(
    //   (e: any) => {
    //     e.preventDefault()
    //     addSavedFeeds([
    //       {
    //         type: 'feed',
    //         value: VIDEO_FEED_URI,
    //         pinned: true,
    //       },
    //     ])
    //     // prevent navigation
    //     return false
    //   },
    //   [addSavedFeeds],
    // )
    if (error) {
        return null;
    }
    return (_jsx(View, { style: [a.pb_xl], children: _jsx(BlockDrawerGesture, { children: _jsx(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, decelerationRate: "fast", snapToInterval: CARD_WIDTH + tokens.space.sm, children: _jsx(View, { style: [
                        a.pt_lg,
                        a.flex_row,
                        a.gap_sm,
                        {
                            paddingLeft: gutters.paddingLeft,
                            paddingRight: gutters.paddingRight,
                        },
                    ], children: isLoading ? (Array(10)
                        .fill(0)
                        .map(function (_, i) { return (_jsx(View, { style: [{ width: CARD_WIDTH }], children: _jsx(CompactVideoPostCardPlaceholder, {}) }, i)); })) : error || !data ? (_jsx(Text, { children: _jsx(Trans, { children: "Whoops! Trending videos failed to load." }) })) : (_jsx(VideoCards, { data: data })) }) }) }) }));
}
function VideoCards(_a) {
    var data = _a.data;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var items = useMemo(function () {
        return data.pages
            .flatMap(function (page) { return page.slices; })
            .map(function (slice) { return slice.items[0]; })
            .filter(Boolean)
            .filter(function (item) { return AppBskyEmbedVideo.isView(item.post.embed); })
            .slice(0, 8);
    }, [data]);
    var href = useMemo(function () {
        var urip = new AtUri(VIDEO_FEED_URI);
        return makeCustomFeedLink(urip.host, urip.rkey, undefined, 'explore');
    }, []);
    return (_jsxs(_Fragment, { children: [items.map(function (item) { return (_jsx(View, { style: [{ width: CARD_WIDTH }], children: _jsx(CompactVideoPostCard, { post: item.post, moderation: item.moderation, sourceContext: {
                        type: 'feedgen',
                        uri: VIDEO_FEED_URI,
                        sourceInterstitial: 'explore',
                    }, onInteract: function () {
                        ax.metric('videoCard:click', { context: 'interstitial:explore' });
                    } }) }, item.post.uri)); }), _jsx(View, { style: [{ width: CARD_WIDTH * 2 }], children: _jsx(Link, { to: href, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View more"], ["View more"])))), style: [
                        a.justify_center,
                        a.align_center,
                        a.flex_1,
                        a.rounded_md,
                        t.atoms.bg_contrast_25,
                    ], children: function (_a) {
                        var pressed = _a.pressed;
                        return (_jsxs(View, { style: [
                                a.flex_row,
                                a.align_center,
                                a.gap_md,
                                {
                                    opacity: pressed ? 0.6 : 1,
                                },
                            ], children: [_jsx(Text, { style: [a.text_md], children: _jsx(Trans, { children: "View more" }) }), _jsx(View, { style: [
                                        a.align_center,
                                        a.justify_center,
                                        a.rounded_full,
                                        {
                                            width: 34,
                                            height: 34,
                                            backgroundColor: t.palette.primary_500,
                                        },
                                    ], children: _jsx(ButtonIcon, { icon: ChevronRight }) })] }));
                    } }) })] }));
}
var templateObject_1;
