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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { AppBskyFeedDefs, AtUri, } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { sanitizeHandle } from '#/lib/strings/handles';
import { hydrateFeedGenerator, hydrateList, useFeedSourceInfoQuery, } from '#/state/queries/feed';
import { FeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { Link } from '#/components/Link';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { MissingFeed } from './MissingFeed';
export function FeedSourceCard(_a) {
    var feedUri = _a.feedUri, feedData = _a.feedData, props = __rest(_a, ["feedUri", "feedData"]);
    if (feedData) {
        var feed = void 0;
        if (AppBskyFeedDefs.isGeneratorView(feedData)) {
            feed = hydrateFeedGenerator(feedData);
        }
        else {
            feed = hydrateList(feedData);
        }
        return _jsx(FeedSourceCardLoaded, __assign({ feedUri: feedUri, feed: feed }, props));
    }
    else {
        return _jsx(FeedSourceCardWithoutData, __assign({ feedUri: feedUri }, props));
    }
}
export function FeedSourceCardWithoutData(_a) {
    var feedUri = _a.feedUri, props = __rest(_a, ["feedUri"]);
    var _b = useFeedSourceInfoQuery({
        uri: feedUri,
    }), feed = _b.data, error = _b.error;
    return (_jsx(FeedSourceCardLoaded, __assign({ feedUri: feedUri, feed: feed, error: error }, props)));
}
export function FeedSourceCardLoaded(_a) {
    var feedUri = _a.feedUri, feed = _a.feed, style = _a.style, _b = _a.showDescription, showDescription = _b === void 0 ? false : _b, _c = _a.showLikes, showLikes = _c === void 0 ? false : _c, showMinimalPlaceholder = _a.showMinimalPlaceholder, hideTopBorder = _a.hideTopBorder, _d = _a.link, link = _d === void 0 ? true : _d, error = _a.error;
    var t = useTheme();
    var _ = useLingui()._;
    /*
     * LOAD STATE
     *
     * This state also captures the scenario where a feed can't load for whatever
     * reason.
     */
    if (!feed) {
        if (error) {
            return (_jsx(MissingFeed, { uri: feedUri, style: style, hideTopBorder: hideTopBorder, error: error }));
        }
        return (_jsx(FeedLoadingPlaceholder, { style: [
                t.atoms.border_contrast_low,
                !(showMinimalPlaceholder || hideTopBorder) && a.border_t,
                a.flex_1,
                style,
            ], showTopBorder: false, showLowerPlaceholder: !showMinimalPlaceholder }));
    }
    var inner = (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, a.align_center], children: [_jsx(View, { style: [a.mr_md], children: _jsx(UserAvatar, { type: "algo", size: 36, avatar: feed.avatar }) }), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { emoji: true, style: [a.text_sm, a.font_semi_bold, a.leading_snug], numberOfLines: 1, children: feed.displayName }), _jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_medium, a.leading_snug], numberOfLines: 1, children: feed.type === 'feed' ? (_jsxs(Trans, { children: ["Feed by ", sanitizeHandle(feed.creatorHandle, '@')] })) : (_jsxs(Trans, { children: ["List by ", sanitizeHandle(feed.creatorHandle, '@')] })) })] })] }), showDescription && feed.description ? (_jsx(RichText, { style: [t.atoms.text_contrast_high, a.flex_1, a.flex_wrap], value: feed.description, numberOfLines: 3 })) : null, showLikes && feed.type === 'feed' ? (_jsx(Text, { style: [
                    a.text_sm,
                    a.font_semi_bold,
                    t.atoms.text_contrast_medium,
                    a.leading_snug,
                ], children: _jsxs(Trans, { children: ["Liked by", ' ', _jsx(Plural, { value: feed.likeCount || 0, one: "# user", other: "# users" })] }) })) : null] }));
    if (link) {
        return (_jsx(Link, { testID: "feed-".concat(feed.displayName), label: _(feed.type === 'feed'
                ? msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ", a feed by ", ", liked by ", ""], ["", ", a feed by ", ", liked by ", ""])), feed.displayName, sanitizeHandle(feed.creatorHandle, '@'), feed.likeCount || 0) : msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", ", a list by ", ""], ["", ", a list by ", ""])), feed.displayName, sanitizeHandle(feed.creatorHandle, '@'))), to: {
                screen: feed.type === 'feed' ? 'ProfileFeed' : 'ProfileList',
                params: { name: feed.creatorDid, rkey: new AtUri(feed.uri).rkey },
            }, style: [
                a.flex_1,
                a.p_lg,
                a.gap_md,
                !hideTopBorder && !a.border_t,
                t.atoms.border_contrast_low,
                style,
            ], children: inner }));
    }
    else {
        return (_jsx(View, { style: [
                a.flex_1,
                a.p_lg,
                a.gap_md,
                !hideTopBorder && !a.border_t,
                t.atoms.border_contrast_low,
                style,
            ], children: inner }));
    }
}
var templateObject_1, templateObject_2;
