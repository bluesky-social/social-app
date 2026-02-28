var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Pressable, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { getCurrentRoute } from '#/lib/routes/helpers';
import { emitSoftReset } from '#/state/events';
import { usePinnedFeedsInfos, } from '#/state/queries/feed';
import { useSelectedFeed, useSetSelectedFeed } from '#/state/shell/selected-feed';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme, web } from '#/alf';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
export function DesktopFeeds() {
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var _a = usePinnedFeedsInfos(), pinnedFeedInfos = _a.data, error = _a.error, isLoading = _a.isLoading;
    var selectedFeed = useSelectedFeed();
    var setSelectedFeed = useSetSelectedFeed();
    var navigation = useNavigation();
    var route = useNavigationState(function (state) {
        if (!state) {
            return { name: 'Home' };
        }
        return getCurrentRoute(state);
    });
    if (isLoading) {
        return (_jsx(View, { style: [{ gap: 10 }], children: Array(5)
                .fill(0)
                .map(function (_, i) { return (_jsx(View, { style: [
                    a.rounded_sm,
                    t.atoms.bg_contrast_25,
                    {
                        height: 16,
                        width: i % 2 === 0 ? '60%' : '80%',
                    },
                ] }, i)); }) }));
    }
    if (error || !pinnedFeedInfos) {
        return null;
    }
    return (_jsxs(View, { style: [
            a.flex_1,
            web({
                gap: 2,
                /*
                 * Small padding prevents overflow prior to actually overflowing the
                 * height of the screen with lots of feeds.
                 */
                paddingTop: 2,
                overflowY: 'auto',
            }),
        ], children: [pinnedFeedInfos.map(function (feedInfo, index) {
                var feed = feedInfo.feedDescriptor;
                var current = route.name === 'Home' &&
                    (selectedFeed ? feed === selectedFeed : index === 0);
                return (_jsx(FeedItem, { feedInfo: feedInfo, current: current, onPress: function () {
                        ax.metric('desktopFeeds:feed:click', {
                            feedUri: feedInfo.uri,
                            feedDescriptor: feed,
                        });
                        setSelectedFeed(feed);
                        navigation.navigate('Home');
                        if (route.name === 'Home' && feed === selectedFeed) {
                            emitSoftReset();
                        }
                    } }, feedInfo.uri));
            }), _jsx(Link, { to: "/feeds", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["More feeds"], ["More feeds"])))), style: [
                    a.flex_row,
                    a.align_center,
                    a.gap_sm,
                    a.self_start,
                    a.rounded_sm,
                    { paddingVertical: 6, paddingHorizontal: 8 },
                    route.name === 'Feeds' && { backgroundColor: t.palette.primary_50 },
                ], children: function (_a) {
                    var hovered = _a.hovered;
                    var isActive = route.name === 'Feeds';
                    return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                    a.align_center,
                                    a.justify_center,
                                    a.rounded_xs,
                                    isActive
                                        ? { backgroundColor: t.palette.primary_100 }
                                        : t.atoms.bg_contrast_50,
                                    {
                                        width: 20,
                                        height: 20,
                                    },
                                ], children: _jsx(Plus, { style: { width: 16, height: 16 }, fill: isActive || hovered
                                        ? t.atoms.text.color
                                        : t.atoms.text_contrast_medium.color }) }), _jsx(Text, { style: [
                                    a.text_md,
                                    a.leading_snug,
                                    isActive
                                        ? [t.atoms.text, a.font_semi_bold]
                                        : hovered
                                            ? t.atoms.text
                                            : t.atoms.text_contrast_medium,
                                ], numberOfLines: 1, children: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["More feeds"], ["More feeds"])))) })] }));
                } })] }));
}
function FeedItem(_a) {
    var feedInfo = _a.feedInfo, current = _a.current, onPress = _a.onPress;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useInteractionState(), hovered = _b.state, onHoverIn = _b.onIn, onHoverOut = _b.onOut;
    var isFollowing = feedInfo.feedDescriptor === 'following';
    return (_jsxs(Pressable, { accessibilityRole: "link", accessibilityLabel: feedInfo.displayName, accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Opens ", " feed"], ["Opens ", " feed"])), feedInfo.displayName)), onPress: onPress, onHoverIn: onHoverIn, onHoverOut: onHoverOut, style: [
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.self_start,
            a.rounded_sm,
            { paddingVertical: 6, paddingHorizontal: 8 },
            current && { backgroundColor: t.palette.primary_50 },
        ], children: [isFollowing ? (_jsx(View, { style: [
                    a.align_center,
                    a.justify_center,
                    a.rounded_xs,
                    {
                        width: 20,
                        height: 20,
                        backgroundColor: t.palette.primary_500,
                    },
                ], children: _jsx(FilterTimeline, { style: { width: 14, height: 14 }, fill: t.palette.white }) })) : (_jsx(UserAvatar, { type: feedInfo.type === 'list' ? 'list' : 'algo', size: 20, avatar: feedInfo.avatar, noBorder: true })), _jsx(Text, { style: [
                    a.text_md,
                    a.leading_snug,
                    current
                        ? [t.atoms.text, a.font_semi_bold]
                        : hovered
                            ? t.atoms.text
                            : t.atoms.text_contrast_medium,
                ], numberOfLines: 1, children: feedInfo.displayName })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
