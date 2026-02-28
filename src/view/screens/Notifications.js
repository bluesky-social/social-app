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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { ComposeIcon2 } from '#/lib/icons';
import { s } from '#/lib/styles';
import { logger } from '#/logger';
import { emitSoftReset, listenSoftReset } from '#/state/events';
import { RQKEY as NOTIFS_RQKEY } from '#/state/queries/notifications/feed';
import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';
import { useUnreadNotifications, useUnreadNotificationsApi, } from '#/state/queries/notifications/unread';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSetMinimalShellMode } from '#/state/shell';
import { NotificationFeed } from '#/view/com/notifications/NotificationFeed';
import { Pager } from '#/view/com/pager/Pager';
import { TabBar } from '#/view/com/pager/TabBar';
import { FAB } from '#/view/com/util/fab/FAB';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';
import { MainScrollProvider } from '#/view/com/util/MainScrollProvider';
import { atoms as a, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { ButtonIcon } from '#/components/Button';
import { SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon } from '#/components/icons/SettingsGear2';
import * as Layout from '#/components/Layout';
import { InlineLinkText, Link } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { IS_NATIVE } from '#/env';
// We don't currently persist this across reloads since
// you gotta visit All to clear the badge anyway.
// But let's at least persist it during the sesssion.
var lastActiveTab = 0;
export function NotificationsScreen(_a) {
    var _this = this;
    var _ = useLingui()._;
    var openComposer = useOpenComposer().openComposer;
    var unreadNotifs = useUnreadNotifications();
    var hasNew = !!unreadNotifs;
    var checkUnreadAll = useUnreadNotificationsApi().checkUnread;
    var _b = useState(false), isLoadingAll = _b[0], setIsLoadingAll = _b[1];
    var _c = useState(false), isLoadingMentions = _c[0], setIsLoadingMentions = _c[1];
    var initialActiveTab = lastActiveTab;
    var _d = useState(initialActiveTab), activeTab = _d[0], setActiveTab = _d[1];
    var isLoading = activeTab === 0 ? isLoadingAll : isLoadingMentions;
    var onPageSelected = useCallback(function (index) {
        setActiveTab(index);
        lastActiveTab = index;
    }, [setActiveTab]);
    var queryClient = useQueryClient();
    var checkUnreadMentions = useCallback(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var invalidate = _b.invalidate;
        return __generator(this, function (_c) {
            if (invalidate) {
                return [2 /*return*/, truncateAndInvalidate(queryClient, NOTIFS_RQKEY('mentions'))];
            }
            else {
                // Background polling is not implemented for the mentions tab.
                // Just ignore it.
            }
            return [2 /*return*/];
        });
    }); }, [queryClient]);
    var sections = useMemo(function () {
        return [
            {
                title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["All"], ["All"])))),
                component: (_jsx(NotificationsTab, { filter: "all", isActive: activeTab === 0, isLoading: isLoadingAll, hasNew: hasNew, setIsLoadingLatest: setIsLoadingAll, checkUnread: checkUnreadAll })),
            },
            {
                title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Mentions"], ["Mentions"])))),
                component: (_jsx(NotificationsTab, { filter: "mentions", isActive: activeTab === 1, isLoading: isLoadingMentions, hasNew: false /* We don't know for sure */, setIsLoadingLatest: setIsLoadingMentions, checkUnread: checkUnreadMentions })),
            },
        ];
    }, [
        _,
        hasNew,
        checkUnreadAll,
        checkUnreadMentions,
        activeTab,
        isLoadingAll,
        isLoadingMentions,
    ]);
    return (_jsxs(Layout.Screen, { testID: "notificationsScreen", children: [_jsxs(Layout.Header.Outer, { noBottomBorder: true, sticky: false, children: [_jsx(Layout.Header.MenuButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Notifications" }) }) }), _jsx(Layout.Header.Slot, { children: _jsx(Link, { to: { screen: 'NotificationSettings' }, label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Notification settings"], ["Notification settings"])))), size: "small", variant: "ghost", color: "secondary", shape: "round", style: [a.justify_center], children: _jsx(ButtonIcon, { icon: isLoading ? Loader : SettingsIcon, size: "lg" }) }) })] }), _jsx(Pager, { onPageSelected: onPageSelected, renderTabBar: function (props) { return (_jsx(Layout.Center, { style: [a.z_10, web([a.sticky, { top: 0 }])], children: _jsx(TabBar, __assign({}, props, { items: sections.map(function (section) { return section.title; }), onPressSelected: function () { return emitSoftReset(); } })) })); }, initialPage: initialActiveTab, children: sections.map(function (section, i) { return (_jsx(View, { children: section.component }, i)); }) }), _jsx(FAB, { testID: "composeFAB", onPress: function () { return openComposer({ logContext: 'Fab' }); }, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: s.white }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" })] }));
}
function NotificationsTab(_a) {
    var filter = _a.filter, isActive = _a.isActive, isLoading = _a.isLoading, hasNew = _a.hasNew, checkUnread = _a.checkUnread, setIsLoadingLatest = _a.setIsLoadingLatest;
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = useState(false), isScrolledDown = _b[0], setIsScrolledDown = _b[1];
    var scrollElRef = useRef(null);
    var queryClient = useQueryClient();
    var isScreenFocused = useIsFocused();
    var isFocusedAndActive = isScreenFocused && isActive;
    // event handlers
    // =
    var scrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ animated: IS_NATIVE, offset: 0 });
        setMinimalShellMode(false);
    }, [scrollElRef, setMinimalShellMode]);
    var onPressLoadLatest = useCallback(function () {
        scrollToTop();
        if (hasNew) {
            // render what we have now
            truncateAndInvalidate(queryClient, NOTIFS_RQKEY(filter));
        }
        else if (!isLoading) {
            // check with the server
            setIsLoadingLatest(true);
            checkUnread({ invalidate: true })
                .catch(function () { return undefined; })
                .then(function () { return setIsLoadingLatest(false); });
        }
    }, [
        scrollToTop,
        queryClient,
        checkUnread,
        hasNew,
        isLoading,
        setIsLoadingLatest,
        filter,
    ]);
    var onFocusCheckLatest = useNonReactiveCallback(function () {
        // on focus, check for latest, but only invalidate if the user
        // isnt scrolled down to avoid moving content underneath them
        var currentIsScrolledDown;
        if (IS_NATIVE) {
            currentIsScrolledDown = isScrolledDown;
        }
        else {
            // On the web, this isn't always updated in time so
            // we're just going to look it up synchronously.
            currentIsScrolledDown = window.scrollY > 200;
        }
        checkUnread({ invalidate: !currentIsScrolledDown });
    });
    // on-visible setup
    // =
    useFocusEffect(useCallback(function () {
        if (isFocusedAndActive) {
            setMinimalShellMode(false);
            logger.debug('NotificationsScreen: Focus');
            onFocusCheckLatest();
        }
    }, [setMinimalShellMode, onFocusCheckLatest, isFocusedAndActive]));
    useEffect(function () {
        if (!isFocusedAndActive) {
            return;
        }
        return listenSoftReset(onPressLoadLatest);
    }, [onPressLoadLatest, isFocusedAndActive]);
    return (_jsxs(_Fragment, { children: [_jsx(MainScrollProvider, { children: _jsx(NotificationFeed, { enabled: isFocusedAndActive, filter: filter, refreshNotifications: function () { return checkUnread({ invalidate: true }); }, onScrolledDownChange: setIsScrolledDown, scrollElRef: scrollElRef, ListHeaderComponent: filter === 'mentions' ? (_jsx(DisabledNotificationsWarning, { active: isFocusedAndActive })) : null }) }), (isScrolledDown || hasNew) && (_jsx(LoadLatestBtn, { onPress: onPressLoadLatest, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Load new notifications"], ["Load new notifications"])))), showIndicator: hasNew }))] }));
}
function DisabledNotificationsWarning(_a) {
    var active = _a.active;
    var t = useTheme();
    var _ = useLingui()._;
    var data = useNotificationSettingsQuery({ enabled: active }).data;
    if (!data)
        return null;
    if (!data.reply.list && !data.quote.list && !data.mention.list) {
        // mention tab notifications are disabled
        return (_jsx(View, { style: [a.py_md, a.px_lg, a.border_b, t.atoms.border_contrast_low], children: _jsx(Admonition, { type: "warning", children: _jsxs(Trans, { children: ["You have completely disabled reply, quote, and mention notifications, so this tab will no longer update. To adjust this, visit your", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Visit your notification settings"], ["Visit your notification settings"])))), to: { screen: 'NotificationSettings' }, children: "notification settings" }), "."] }) }) }));
    }
    return null;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
