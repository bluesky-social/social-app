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
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect } from '@react-navigation/native';
import { HITSLOP_10 } from '#/lib/constants';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { shareUrl } from '#/lib/sharing';
import { cleanError } from '#/lib/strings/errors';
import { enforceLen } from '#/lib/strings/helpers';
import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSetMinimalShellMode } from '#/state/shell';
import { Pager } from '#/view/com/pager/Pager';
import { TabBar } from '#/view/com/pager/TabBar';
import { Post } from '#/view/com/post/Post';
import { List } from '#/view/com/util/List';
import { atoms as a, web } from '#/alf';
import { Button, ButtonIcon } from '#/components/Button';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import * as Layout from '#/components/Layout';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
var renderItem = function (_a) {
    var item = _a.item;
    return _jsx(Post, { post: item });
};
var keyExtractor = function (item, index) {
    return "".concat(item.uri, "-").concat(index);
};
export default function TopicScreen(_a) {
    var route = _a.route;
    var topic = route.params.topic;
    var _ = useLingui()._;
    var headerTitle = React.useMemo(function () {
        return enforceLen(decodeURIComponent(topic), 24, true, 'middle');
    }, [topic]);
    var onShare = React.useCallback(function () {
        var url = new URL('https://bsky.app');
        url.pathname = "/topic/".concat(topic);
        shareUrl(url.toString());
    }, [topic]);
    var _b = React.useState(0), activeTab = _b[0], setActiveTab = _b[1];
    var setMinimalShellMode = useSetMinimalShellMode();
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var onPageSelected = React.useCallback(function (index) {
        setMinimalShellMode(false);
        setActiveTab(index);
    }, [setMinimalShellMode]);
    var sections = React.useMemo(function () {
        return [
            {
                title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Top"], ["Top"])))),
                component: (_jsx(TopicScreenTab, { topic: topic, sort: "top", active: activeTab === 0 })),
            },
            {
                title: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Latest"], ["Latest"])))),
                component: (_jsx(TopicScreenTab, { topic: topic, sort: "latest", active: activeTab === 1 })),
            },
        ];
    }, [_, topic, activeTab]);
    return (_jsx(Layout.Screen, { children: _jsx(Pager, { onPageSelected: onPageSelected, renderTabBar: function (props) { return (_jsxs(Layout.Center, { style: [a.z_10, web([a.sticky, { top: 0 }])], children: [_jsxs(Layout.Header.Outer, { noBottomBorder: true, children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: headerTitle }) }), _jsx(Layout.Header.Slot, { children: _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Share"], ["Share"])))), size: "small", variant: "ghost", color: "primary", shape: "round", onPress: onShare, hitSlop: HITSLOP_10, style: [{ right: -3 }], children: _jsx(ButtonIcon, { icon: Share, size: "md" }) }) })] }), _jsx(TabBar, __assign({ items: sections.map(function (section) { return section.title; }) }, props))] })); }, initialPage: 0, children: sections.map(function (section, i) { return (_jsx(View, { children: section.component }, i)); }) }) }));
}
function TopicScreenTab(_a) {
    var _this = this;
    var topic = _a.topic, sort = _a.sort, active = _a.active;
    var _ = useLingui()._;
    var initialNumToRender = useInitialNumToRender();
    var _b = React.useState(false), isPTR = _b[0], setIsPTR = _b[1];
    var trackPostView = usePostViewTracking('Topic');
    var _c = useSearchPostsQuery({
        query: decodeURIComponent(topic),
        sort: sort,
        enabled: active,
    }), data = _c.data, isFetched = _c.isFetched, isFetchingNextPage = _c.isFetchingNextPage, isLoading = _c.isLoading, isError = _c.isError, error = _c.error, refetch = _c.refetch, fetchNextPage = _c.fetchNextPage, hasNextPage = _c.hasNextPage;
    var posts = React.useMemo(function () {
        return (data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.posts; })) || [];
    }, [data]);
    var onRefresh = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTR(true);
                    return [4 /*yield*/, refetch()];
                case 1:
                    _a.sent();
                    setIsPTR(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch]);
    var onEndReached = React.useCallback(function () {
        if (isFetchingNextPage || !hasNextPage || error)
            return;
        fetchNextPage();
    }, [isFetchingNextPage, hasNextPage, error, fetchNextPage]);
    return (_jsx(_Fragment, { children: posts.length < 1 ? (_jsx(ListMaybePlaceholder, { isLoading: isLoading || !isFetched, isError: isError, onRetry: refetch, emptyType: "results", emptyMessage: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["We couldn't find any results for that topic."], ["We couldn't find any results for that topic."])))) })) : (_jsx(List, { data: posts, renderItem: renderItem, keyExtractor: keyExtractor, refreshing: isPTR, onRefresh: onRefresh, onEndReached: onEndReached, onEndReachedThreshold: 4, onItemSeen: trackPostView, 
            // @ts-ignore web only -prf
            desktopFixedHeight: true, ListFooterComponent: _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage }), initialNumToRender: initialNumToRender, windowSize: 11 })) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
