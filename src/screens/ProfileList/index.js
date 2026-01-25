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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { AppBskyGraphDefs, AtUri, moderateUserList, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import { ComposeIcon2 } from '#/lib/icons';
import { cleanError } from '#/lib/strings/errors';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListQuery } from '#/state/queries/list';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { usePreferencesQuery, } from '#/state/queries/preferences';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { PagerWithHeader } from '#/view/com/pager/PagerWithHeader';
import { FAB } from '#/view/com/util/fab/FAB';
import { ListHiddenScreen } from '#/screens/List/ListHiddenScreen';
import { atoms as a, platform } from '#/alf';
import { useDialogControl } from '#/components/Dialog';
import { ListAddRemoveUsersDialog } from '#/components/dialogs/lists/ListAddRemoveUsersDialog';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import * as Hider from '#/components/moderation/Hider';
import { AboutSection } from './AboutSection';
import { ErrorScreen } from './components/ErrorScreen';
import { Header } from './components/Header';
import { FeedSection } from './FeedSection';
export function ProfileListScreen(props) {
    return (_jsx(Layout.Screen, { testID: "profileListScreen", children: _jsx(ProfileListScreenInner, __assign({}, props)) }));
}
function ProfileListScreenInner(props) {
    var _ = useLingui()._;
    var _a = props.route.params, handleOrDid = _a.name, rkey = _a.rkey;
    var _b = useResolveUriQuery(AtUri.make(handleOrDid, 'app.bsky.graph.list', rkey).toString()), resolvedUri = _b.data, resolveError = _b.error;
    var preferences = usePreferencesQuery().data;
    var _c = useListQuery(resolvedUri === null || resolvedUri === void 0 ? void 0 : resolvedUri.uri), list = _c.data, listError = _c.error;
    var moderationOpts = useModerationOpts();
    if (resolveError) {
        return (_jsxs(_Fragment, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Could not load list" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { centerContent: true, children: _jsx(ErrorScreen, { error: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["We're sorry, but we were unable to resolve this list. If this persists, please contact the list creator, @", "."], ["We're sorry, but we were unable to resolve this list. If this persists, please contact the list creator, @", "."])), handleOrDid)) }) })] }));
    }
    if (listError) {
        return (_jsxs(_Fragment, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Could not load list" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { centerContent: true, children: _jsx(ErrorScreen, { error: cleanError(listError) }) })] }));
    }
    return resolvedUri && list && moderationOpts && preferences ? (_jsx(ProfileListScreenLoaded, __assign({}, props, { uri: resolvedUri.uri, list: list, moderationOpts: moderationOpts, preferences: preferences }))) : (_jsxs(_Fragment, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, {}), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { centerContent: true, contentContainerStyle: platform({
                    web: [a.mx_auto],
                    native: [a.align_center],
                }), children: _jsx(Loader, { size: "2xl" }) })] }));
}
function ProfileListScreenLoaded(_a) {
    var _b;
    var route = _a.route, uri = _a.uri, list = _a.list, moderationOpts = _a.moderationOpts, preferences = _a.preferences;
    var _ = useLingui()._;
    var queryClient = useQueryClient();
    var openComposer = useOpenComposer().openComposer;
    var setMinimalShellMode = useSetMinimalShellMode();
    var currentAccount = useSession().currentAccount;
    var rkey = route.params.rkey;
    var feedSectionRef = useRef(null);
    var aboutSectionRef = useRef(null);
    var isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST;
    var isScreenFocused = useIsFocused();
    var isHidden = ((_b = list.labels) === null || _b === void 0 ? void 0 : _b.findIndex(function (l) { return l.val === '!hide'; })) !== -1;
    var isOwner = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === list.creator.did;
    var scrollElRef = useAnimatedRef();
    var addUserDialogControl = useDialogControl();
    var sectionTitlesCurate = [_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Posts"], ["Posts"])))), _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["People"], ["People"]))))];
    var moderation = useMemo(function () {
        return moderateUserList(list, moderationOpts);
    }, [list, moderationOpts]);
    useSetTitle(isHidden ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["List Hidden"], ["List Hidden"])))) : list.name);
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var onChangeMembers = function () {
        if (isCurateList) {
            truncateAndInvalidate(queryClient, FEED_RQKEY("list|".concat(list.uri)));
        }
    };
    var onCurrentPageSelected = useCallback(function (index) {
        var _a, _b;
        if (index === 0) {
            (_a = feedSectionRef.current) === null || _a === void 0 ? void 0 : _a.scrollToTop();
        }
        else if (index === 1) {
            (_b = aboutSectionRef.current) === null || _b === void 0 ? void 0 : _b.scrollToTop();
        }
    }, [feedSectionRef]);
    var renderHeader = useCallback(function () {
        return _jsx(Header, { rkey: rkey, list: list, preferences: preferences });
    }, [rkey, list, preferences]);
    if (isCurateList) {
        return (_jsxs(Hider.Outer, { modui: moderation.ui('contentView'), allowOverride: isOwner, children: [_jsx(Hider.Mask, { children: _jsx(ListHiddenScreen, { list: list, preferences: preferences }) }), _jsxs(Hider.Content, { children: [_jsxs(View, { style: [a.util_screen_outer], children: [_jsxs(PagerWithHeader, { items: sectionTitlesCurate, isHeaderReady: true, renderHeader: renderHeader, onCurrentPageSelected: onCurrentPageSelected, children: [function (_a) {
                                            var headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef, isFocused = _a.isFocused;
                                            return (_jsx(FeedSection, { ref: feedSectionRef, feed: "list|".concat(uri), scrollElRef: scrollElRef, headerHeight: headerHeight, isFocused: isScreenFocused && isFocused, isOwner: isOwner, onPressAddUser: addUserDialogControl.open }));
                                        }, function (_a) {
                                            var headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
                                            return (_jsx(AboutSection, { ref: aboutSectionRef, scrollElRef: scrollElRef, list: list, onPressAddUser: addUserDialogControl.open, headerHeight: headerHeight }));
                                        }] }), _jsx(FAB, { testID: "composeFAB", onPress: function () { return openComposer({}); }, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: { color: 'white' } }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" })] }), _jsx(ListAddRemoveUsersDialog, { control: addUserDialogControl, list: list, onChange: onChangeMembers })] })] }));
    }
    return (_jsxs(Hider.Outer, { modui: moderation.ui('contentView'), allowOverride: isOwner, children: [_jsx(Hider.Mask, { children: _jsx(ListHiddenScreen, { list: list, preferences: preferences }) }), _jsxs(Hider.Content, { children: [_jsxs(View, { style: [a.util_screen_outer], children: [_jsx(Layout.Center, { children: renderHeader() }), _jsx(AboutSection, { list: list, scrollElRef: scrollElRef, onPressAddUser: addUserDialogControl.open, headerHeight: 0 }), _jsx(FAB, { testID: "composeFAB", onPress: function () { return openComposer({}); }, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: { color: 'white' } }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" })] }), _jsx(ListAddRemoveUsersDialog, { control: addUserDialogControl, list: list, onChange: onChangeMembers })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
