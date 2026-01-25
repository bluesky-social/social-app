import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { StyleSheet, View, } from 'react-native';
import { s } from '#/lib/styles';
import { atoms as a, useTheme } from '#/alf';
import { Bubble_Stroke2_Corner2_Rounded as Bubble } from '#/components/icons/Bubble';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled, Heart2_Stroke2_Corner0_Rounded as HeartIconOutline, } from '#/components/icons/Heart2';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
export function LoadingPlaceholder(_a) {
    var width = _a.width, height = _a.height, style = _a.style;
    var t = useTheme();
    return (_jsx(View, { style: [
            styles.loadingPlaceholder,
            {
                width: width,
                height: height,
                backgroundColor: t.palette.contrast_50,
            },
            style,
        ] }));
}
export function PostLoadingPlaceholder(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsxs(View, { style: [styles.post, style], children: [_jsx(LoadingPlaceholder, { width: 42, height: 42, style: [
                    styles.avatar,
                    {
                        position: 'relative',
                        top: -6,
                    },
                ] }), _jsxs(View, { style: [s.flex1], children: [_jsx(LoadingPlaceholder, { width: 100, height: 6, style: { marginBottom: 10 } }), _jsx(LoadingPlaceholder, { width: "95%", height: 6, style: { marginBottom: 8 } }), _jsx(LoadingPlaceholder, { width: "95%", height: 6, style: { marginBottom: 8 } }), _jsx(LoadingPlaceholder, { width: "80%", height: 6, style: { marginBottom: 11 } }), _jsxs(View, { style: styles.postCtrls, children: [_jsx(View, { style: [styles.postCtrl, { marginLeft: -6 }], children: _jsx(View, { style: styles.postBtn, children: _jsx(Bubble, { style: [
                                            {
                                                color: t.palette.contrast_500,
                                            },
                                            { pointerEvents: 'none' },
                                        ], width: 18 }) }) }), _jsx(View, { style: styles.postCtrl, children: _jsx(View, { style: styles.postBtn, children: _jsx(Repost, { style: [
                                            {
                                                color: t.palette.contrast_500,
                                            },
                                            { pointerEvents: 'none' },
                                        ], width: 18 }) }) }), _jsx(View, { style: styles.postCtrl, children: _jsx(View, { style: styles.postBtn, children: _jsx(HeartIconOutline, { style: [
                                            {
                                                color: t.palette.contrast_500,
                                            },
                                            { pointerEvents: 'none' },
                                        ], width: 18 }) }) }), _jsx(View, { style: styles.postCtrl, children: _jsx(View, { style: [styles.postBtn, { minHeight: 30 }] }) })] })] })] }));
}
export function PostFeedLoadingPlaceholder() {
    return (_jsxs(View, { children: [_jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {}), _jsx(PostLoadingPlaceholder, {})] }));
}
export function NotificationLoadingPlaceholder(_a) {
    var style = _a.style;
    var t = useTheme();
    return (_jsxs(View, { style: [styles.notification, style], children: [_jsx(View, { style: [{ width: 60 }, a.align_end, a.pr_sm, a.pt_2xs], children: _jsx(HeartIconFilled, { size: "xl", style: { color: t.palette.contrast_50 } }) }), _jsxs(View, { style: { flex: 1 }, children: [_jsx(View, { style: [a.flex_row, s.mb10], children: _jsx(LoadingPlaceholder, { width: 35, height: 35, style: styles.smallAvatar }) }), _jsx(LoadingPlaceholder, { width: "90%", height: 6, style: [s.mb5] }), _jsx(LoadingPlaceholder, { width: "70%", height: 6, style: [s.mb5] })] })] }));
}
export function NotificationFeedLoadingPlaceholder() {
    return (_jsxs(_Fragment, { children: [_jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {}), _jsx(NotificationLoadingPlaceholder, {})] }));
}
export function ProfileCardLoadingPlaceholder(_a) {
    var style = _a.style;
    return (_jsxs(View, { style: [styles.profileCard, style], children: [_jsx(LoadingPlaceholder, { width: 40, height: 40, style: styles.profileCardAvi }), _jsxs(View, { children: [_jsx(LoadingPlaceholder, { width: 140, height: 8, style: [s.mb5] }), _jsx(LoadingPlaceholder, { width: 120, height: 8, style: [s.mb10] }), _jsx(LoadingPlaceholder, { width: 220, height: 8, style: [s.mb5] })] })] }));
}
export function ProfileCardFeedLoadingPlaceholder() {
    return (_jsxs(_Fragment, { children: [_jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {}), _jsx(ProfileCardLoadingPlaceholder, {})] }));
}
export function FeedLoadingPlaceholder(_a) {
    var style = _a.style, _b = _a.showLowerPlaceholder, showLowerPlaceholder = _b === void 0 ? true : _b, _c = _a.showTopBorder, showTopBorder = _c === void 0 ? true : _c;
    var t = useTheme();
    return (_jsxs(View, { style: [
            {
                padding: 16,
                borderTopWidth: showTopBorder ? StyleSheet.hairlineWidth : 0,
            },
            t.atoms.border_contrast_low,
            style,
        ], children: [_jsxs(View, { style: [{ flexDirection: 'row' }], children: [_jsx(LoadingPlaceholder, { width: 36, height: 36, style: [styles.avatar, { borderRadius: 8 }] }), _jsxs(View, { style: [s.flex1], children: [_jsx(LoadingPlaceholder, { width: 100, height: 8, style: [s.mt5, s.mb10] }), _jsx(LoadingPlaceholder, { width: 120, height: 8 })] })] }), showLowerPlaceholder && (_jsx(View, { style: { marginTop: 12 }, children: _jsx(LoadingPlaceholder, { width: 120, height: 8 }) }))] }));
}
export function FeedFeedLoadingPlaceholder() {
    return (_jsxs(_Fragment, { children: [_jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {}), _jsx(FeedLoadingPlaceholder, {})] }));
}
export function ChatListItemLoadingPlaceholder(_a) {
    var style = _a.style;
    var t = useTheme();
    var random = useMemo(function () { return Math.random(); }, []);
    return (_jsxs(View, { style: [a.flex_row, a.gap_md, a.px_lg, a.mt_lg, t.atoms.bg, style], children: [_jsx(LoadingPlaceholder, { width: 52, height: 52, style: a.rounded_full }), _jsxs(View, { children: [_jsx(LoadingPlaceholder, { width: 140, height: 12, style: a.mt_xs }), _jsx(LoadingPlaceholder, { width: 120, height: 8, style: a.mt_sm }), _jsx(LoadingPlaceholder, { width: 80 + random * 100, height: 8, style: a.mt_sm })] })] }));
}
export function ChatListLoadingPlaceholder() {
    return (_jsxs(_Fragment, { children: [_jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {}), _jsx(ChatListItemLoadingPlaceholder, {})] }));
}
var styles = StyleSheet.create({
    loadingPlaceholder: {
        borderRadius: 6,
    },
    post: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 5,
        paddingRight: 15,
    },
    postCtrls: {
        opacity: 0.5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    postCtrl: {
        flex: 1,
    },
    postBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
    },
    avatar: {
        borderRadius: 999,
        marginRight: 12,
    },
    notification: {
        flexDirection: 'row',
        padding: 10,
    },
    profileCard: {
        flexDirection: 'row',
        padding: 10,
        margin: 1,
    },
    profileCardAvi: {
        borderRadius: 999,
        marginRight: 10,
    },
    smallAvatar: {
        borderRadius: 999,
        marginRight: 10,
    },
});
