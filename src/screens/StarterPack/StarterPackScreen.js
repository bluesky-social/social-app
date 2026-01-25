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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { AppBskyGraphDefs, AppBskyGraphStarterpack, AtUri, RichText as RichTextAPI, } from '@atproto/api';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { batchedUpdates } from '#/lib/batchedUpdates';
import { HITSLOP_20 } from '#/lib/constants';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { makeProfileLink, makeStarterPackLink } from '#/lib/routes/links';
import { cleanError } from '#/lib/strings/errors';
import { getStarterPackOgCard } from '#/lib/strings/starter-pack';
import { logger } from '#/logger';
import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getAllListMembers } from '#/state/queries/list-members';
import { useResolvedStarterPackShortLink } from '#/state/queries/resolve-short-link';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useShortenLink } from '#/state/queries/shorten-link';
import { useDeleteStarterPackMutation, useStarterPackQuery, } from '#/state/queries/starter-packs';
import { useAgent, useSession } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { ProgressGuideAction, useProgressGuideControls, } from '#/state/shell/progress-guide';
import { useSetActiveStarterPack } from '#/state/shell/starter-pack';
import { PagerWithHeader } from '#/view/com/pager/PagerWithHeader';
import { ProfileSubpageHeader } from '#/view/com/profile/ProfileSubpageHeader';
import * as Toast from '#/view/com/util/Toast';
import { bulkWriteFollows } from '#/screens/Onboarding/util';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon } from '#/components/icons/ArrowOutOfBox';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { DotGrid_Stroke2_Corner0_Rounded as Ellipsis } from '#/components/icons/DotGrid';
import { Pencil_Stroke2_Corner0_Rounded as Pencil } from '#/components/icons/Pencil';
import { Trash_Stroke2_Corner0_Rounded as Trash } from '#/components/icons/Trash';
import * as Layout from '#/components/Layout';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import { ReportDialog, useReportDialogControl, } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { FeedsList } from '#/components/StarterPack/Main/FeedsList';
import { PostsList } from '#/components/StarterPack/Main/PostsList';
import { ProfilesList } from '#/components/StarterPack/Main/ProfilesList';
import { QrCodeDialog } from '#/components/StarterPack/QrCodeDialog';
import { ShareDialog } from '#/components/StarterPack/ShareDialog';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import * as bsky from '#/types/bsky';
export function StarterPackScreen(_a) {
    var route = _a.route;
    return (_jsx(Layout.Screen, { children: _jsx(StarterPackScreenInner, { routeParams: route.params }) }));
}
export function StarterPackScreenShort(_a) {
    var route = _a.route;
    var _ = useLingui()._;
    var _b = useResolvedStarterPackShortLink({
        code: route.params.code,
    }), resolvedStarterPack = _b.data, isLoading = _b.isLoading, isError = _b.isError;
    if (isLoading || isError || !resolvedStarterPack) {
        return (_jsx(Layout.Screen, { children: _jsx(ListMaybePlaceholder, { isLoading: isLoading, isError: isError, errorMessage: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["That starter pack could not be found."], ["That starter pack could not be found."])))), emptyMessage: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["That starter pack could not be found."], ["That starter pack could not be found."])))) }) }));
    }
    return (_jsx(Layout.Screen, { children: _jsx(StarterPackScreenInner, { routeParams: resolvedStarterPack }) }));
}
export function StarterPackScreenInner(_a) {
    var _b;
    var routeParams = _a.routeParams;
    var name = routeParams.name, rkey = routeParams.rkey;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var moderationOpts = useModerationOpts();
    var _c = useResolveDidQuery(name), did = _c.data, isLoadingDid = _c.isLoading, isErrorDid = _c.isError;
    var _d = useStarterPackQuery({ did: did, rkey: rkey }), starterPack = _d.data, isLoadingStarterPack = _d.isLoading, isErrorStarterPack = _d.isError;
    var isValid = starterPack &&
        (starterPack.list || ((_b = starterPack === null || starterPack === void 0 ? void 0 : starterPack.creator) === null || _b === void 0 ? void 0 : _b.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) &&
        AppBskyGraphDefs.validateStarterPackView(starterPack) &&
        AppBskyGraphStarterpack.validateRecord(starterPack.record);
    if (!did || !starterPack || !isValid || !moderationOpts) {
        return (_jsx(ListMaybePlaceholder, { isLoading: isLoadingDid || isLoadingStarterPack || !moderationOpts, isError: isErrorDid || isErrorStarterPack || !isValid, errorMessage: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["That starter pack could not be found."], ["That starter pack could not be found."])))), emptyMessage: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["That starter pack could not be found."], ["That starter pack could not be found."])))) }));
    }
    if (!starterPack.list && starterPack.creator.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
        return _jsx(InvalidStarterPack, { rkey: rkey });
    }
    return (_jsx(StarterPackScreenLoaded, { starterPack: starterPack, routeParams: routeParams, moderationOpts: moderationOpts }));
}
function StarterPackScreenLoaded(_a) {
    var _b;
    var starterPack = _a.starterPack, routeParams = _a.routeParams, moderationOpts = _a.moderationOpts;
    var showPeopleTab = Boolean(starterPack.list);
    var showFeedsTab = Boolean((_b = starterPack.feeds) === null || _b === void 0 ? void 0 : _b.length);
    var showPostsTab = Boolean(starterPack.list);
    var _ = useLingui()._;
    var ax = useAnalytics();
    var tabs = __spreadArray(__spreadArray(__spreadArray([], (showPeopleTab ? [_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["People"], ["People"]))))] : []), true), (showFeedsTab ? [_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Feeds"], ["Feeds"]))))] : []), true), (showPostsTab ? [_(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Posts"], ["Posts"]))))] : []), true);
    var qrCodeDialogControl = useDialogControl();
    var shareDialogControl = useDialogControl();
    var shortenLink = useShortenLink();
    var _c = React.useState(), link = _c[0], setLink = _c[1];
    var _d = React.useState(false), imageLoaded = _d[0], setImageLoaded = _d[1];
    React.useEffect(function () {
        ax.metric('starterPack:opened', {
            starterPack: starterPack.uri,
        });
    }, [ax, starterPack.uri]);
    var onOpenShareDialog = React.useCallback(function () {
        var rkey = new AtUri(starterPack.uri).rkey;
        shortenLink(makeStarterPackLink(starterPack.creator.did, rkey)).then(function (res) {
            setLink(res.url);
        });
        Image.prefetch(getStarterPackOgCard(starterPack))
            .then(function () {
            setImageLoaded(true);
        })
            .catch(function () {
            setImageLoaded(true);
        });
        shareDialogControl.open();
    }, [shareDialogControl, shortenLink, starterPack]);
    React.useEffect(function () {
        if (routeParams.new) {
            onOpenShareDialog();
        }
    }, [onOpenShareDialog, routeParams.new, shareDialogControl]);
    return (_jsxs(_Fragment, { children: [_jsxs(PagerWithHeader, { items: tabs, isHeaderReady: true, renderHeader: function () { return (_jsx(Header, { starterPack: starterPack, routeParams: routeParams, onOpenShareDialog: onOpenShareDialog })); }, children: [showPeopleTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfilesList
                            // Validated above
                            , { 
                                // Validated above
                                listUri: starterPack.list.uri, headerHeight: headerHeight, 
                                // @ts-expect-error
                                scrollElRef: scrollElRef, moderationOpts: moderationOpts }));
                        }
                        : null, showFeedsTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
                            return (_jsx(FeedsList
                            // @ts-expect-error ?
                            , { 
                                // @ts-expect-error ?
                                feeds: starterPack === null || starterPack === void 0 ? void 0 : starterPack.feeds, headerHeight: headerHeight, 
                                // @ts-expect-error
                                scrollElRef: scrollElRef }));
                        }
                        : null, showPostsTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
                            return (_jsx(PostsList
                            // Validated above
                            , { 
                                // Validated above
                                listUri: starterPack.list.uri, headerHeight: headerHeight, 
                                // @ts-expect-error
                                scrollElRef: scrollElRef, moderationOpts: moderationOpts }));
                        }
                        : null] }), _jsx(QrCodeDialog, { control: qrCodeDialogControl, starterPack: starterPack, link: link }), _jsx(ShareDialog, { control: shareDialogControl, qrDialogControl: qrCodeDialogControl, starterPack: starterPack, link: link, imageLoaded: imageLoaded })] }));
}
function Header(_a) {
    var _this = this;
    var _b;
    var starterPack = _a.starterPack, routeParams = _a.routeParams, onOpenShareDialog = _a.onOpenShareDialog;
    var _ = useLingui()._;
    var t = useTheme();
    var _c = useSession(), currentAccount = _c.currentAccount, hasSession = _c.hasSession;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var setActiveStarterPack = useSetActiveStarterPack();
    var requestSwitchToAccount = useLoggedOutViewControls().requestSwitchToAccount;
    var captureAction = useProgressGuideControls().captureAction;
    var _d = React.useState(false), isProcessing = _d[0], setIsProcessing = _d[1];
    var record = starterPack.record, creator = starterPack.creator;
    var isOwn = (creator === null || creator === void 0 ? void 0 : creator.did) === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var joinedAllTimeCount = (_b = starterPack.joinedAllTimeCount) !== null && _b !== void 0 ? _b : 0;
    var ax = useAnalytics();
    var navigation = useNavigation();
    React.useEffect(function () {
        var onFocus = function () {
            if (hasSession)
                return;
            setActiveStarterPack({
                uri: starterPack.uri,
            });
        };
        var onBeforeRemove = function () {
            if (hasSession)
                return;
            setActiveStarterPack(undefined);
        };
        navigation.addListener('focus', onFocus);
        navigation.addListener('beforeRemove', onBeforeRemove);
        return function () {
            navigation.removeListener('focus', onFocus);
            navigation.removeListener('beforeRemove', onBeforeRemove);
        };
    }, [hasSession, navigation, setActiveStarterPack, starterPack.uri]);
    var onFollowAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var listItems, e_1, dids, followUris, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!starterPack.list)
                        return [2 /*return*/];
                    setIsProcessing(true);
                    listItems = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getAllListMembers(agent, starterPack.list.uri)];
                case 2:
                    listItems = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    setIsProcessing(false);
                    Toast.show(_(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["An error occurred while trying to follow all"], ["An error occurred while trying to follow all"])))), 'xmark');
                    logger.error('Failed to get list members for starter pack', {
                        safeMessage: e_1,
                    });
                    return [2 /*return*/];
                case 4:
                    dids = listItems
                        .filter(function (li) {
                        var _a;
                        return li.subject.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) &&
                            !isBlockedOrBlocking(li.subject) &&
                            !isMuted(li.subject) &&
                            !((_a = li.subject.viewer) === null || _a === void 0 ? void 0 : _a.following);
                    })
                        .map(function (li) { return li.subject.did; });
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, bulkWriteFollows(agent, dids)];
                case 6:
                    followUris = _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    e_2 = _a.sent();
                    setIsProcessing(false);
                    Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["An error occurred while trying to follow all"], ["An error occurred while trying to follow all"])))), 'xmark');
                    logger.error('Failed to follow all accounts', { safeMessage: e_2 });
                    return [3 /*break*/, 8];
                case 8:
                    setIsProcessing(false);
                    batchedUpdates(function () {
                        for (var _i = 0, dids_1 = dids; _i < dids_1.length; _i++) {
                            var did = dids_1[_i];
                            updateProfileShadow(queryClient, did, {
                                followingUri: followUris.get(did),
                            });
                        }
                    });
                    Toast.show(_(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["All accounts have been followed!"], ["All accounts have been followed!"])))));
                    captureAction(ProgressGuideAction.Follow, dids.length);
                    ax.metric('starterPack:followAll', {
                        logContext: 'StarterPackProfilesList',
                        starterPack: starterPack.uri,
                        count: dids.length,
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    if (!bsky.dangerousIsType(record, AppBskyGraphStarterpack.isRecord)) {
        return null;
    }
    var richText = record.description
        ? new RichTextAPI({
            text: record.description,
            facets: record.descriptionFacets,
        })
        : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(ProfileSubpageHeader, { isLoading: false, href: makeProfileLink(creator), title: record.name, isOwner: isOwn, avatar: undefined, creator: creator, purpose: "app.bsky.graph.defs#referencelist", avatarType: "starter-pack", children: hasSession ? (_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center], children: [isOwn ? (_jsx(Button, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Share this starter pack"], ["Share this starter pack"])))), hitSlop: HITSLOP_20, variant: "solid", color: "primary", size: "small", onPress: onOpenShareDialog, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Share" }) }) })) : (_jsxs(Button, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Follow all"], ["Follow all"])))), variant: "solid", color: "primary", size: "small", disabled: isProcessing, onPress: onFollowAll, style: [a.flex_row, a.gap_xs, a.align_center], children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Follow all" }) }), isProcessing && _jsx(ButtonIcon, { icon: Loader })] })), _jsx(OverflowMenu, { routeParams: routeParams, starterPack: starterPack, onOpenShareDialog: onOpenShareDialog })] })) : null }), !hasSession || richText || joinedAllTimeCount >= 25 ? (_jsxs(View, { style: [a.px_lg, a.pt_md, a.pb_sm, a.gap_md], children: [richText ? _jsx(RichText, { value: richText, style: [a.text_md] }) : null, !hasSession ? (_jsx(Button, { label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Join Bluesky"], ["Join Bluesky"])))), onPress: function () {
                            setActiveStarterPack({
                                uri: starterPack.uri,
                            });
                            requestSwitchToAccount({ requestedAccount: 'new' });
                        }, variant: "solid", color: "primary", size: "large", children: _jsx(ButtonText, { style: [a.text_lg], children: _jsx(Trans, { children: "Join Bluesky" }) }) })) : null, joinedAllTimeCount >= 25 ? (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_sm], children: [_jsx(FontAwesomeIcon, { icon: "arrow-trend-up", size: 12, color: t.atoms.text_contrast_medium.color }), _jsx(Text, { style: [
                                    a.font_semi_bold,
                                    a.text_sm,
                                    t.atoms.text_contrast_medium,
                                ], children: _jsxs(Trans, { comment: "Number of users (always at least 25) who have joined Bluesky using a specific starter pack", children: [_jsx(Plural, { value: starterPack.joinedAllTimeCount || 0, other: "# people have" }), ' ', "used this starter pack!"] }) })] })) : null] })) : null] }));
}
function OverflowMenu(_a) {
    var _this = this;
    var starterPack = _a.starterPack, routeParams = _a.routeParams, onOpenShareDialog = _a.onOpenShareDialog;
    var t = useTheme();
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gtMobile = useBreakpoints().gtMobile;
    var currentAccount = useSession().currentAccount;
    var reportDialogControl = useReportDialogControl();
    var deleteDialogControl = useDialogControl();
    var navigation = useNavigation();
    var _b = useDeleteStarterPackMutation({
        onSuccess: function () {
            ax.metric('starterPack:delete', {});
            deleteDialogControl.close(function () {
                if (navigation.canGoBack()) {
                    navigation.popToTop();
                }
                else {
                    navigation.navigate('Home');
                }
            });
        },
        onError: function (e) {
            logger.error('Failed to delete starter pack', { safeMessage: e });
        },
    }), deleteStarterPack = _b.mutate, isDeletePending = _b.isPending, deleteError = _b.error;
    var isOwn = starterPack.creator.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var onDeleteStarterPack = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!starterPack.list) {
                logger.error("Unable to delete starterpack because list is missing");
                return [2 /*return*/];
            }
            deleteStarterPack({
                rkey: routeParams.rkey,
                listUri: starterPack.list.uri,
            });
            ax.metric('starterPack:delete', {});
            return [2 /*return*/];
        });
    }); };
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Repost or quote post"], ["Repost or quote post"])))), children: function (_a) {
                            var props = _a.props;
                            return (_jsx(Button, __assign({}, props, { testID: "headerDropdownBtn", label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Open starter pack menu"], ["Open starter pack menu"])))), hitSlop: HITSLOP_20, variant: "solid", color: "secondary", size: "small", shape: "round", children: _jsx(ButtonIcon, { icon: Ellipsis }) })));
                        } }), _jsx(Menu.Outer, { style: { minWidth: 170 }, children: isOwn ? (_jsxs(_Fragment, { children: [_jsxs(Menu.Item, { label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Edit starter pack"], ["Edit starter pack"])))), testID: "editStarterPackLinkBtn", onPress: function () {
                                        navigation.navigate('StarterPackEdit', {
                                            rkey: routeParams.rkey,
                                        });
                                    }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Edit" }) }), _jsx(Menu.ItemIcon, { icon: Pencil, position: "right" })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Delete starter pack"], ["Delete starter pack"])))), testID: "deleteStarterPackBtn", onPress: function () {
                                        deleteDialogControl.open();
                                    }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Delete" }) }), _jsx(Menu.ItemIcon, { icon: Trash, position: "right" })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Menu.Group, { children: _jsxs(Menu.Item, { label: IS_WEB
                                            ? _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Copy link to starter pack"], ["Copy link to starter pack"]))))
                                            : _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Share via..."], ["Share via..."])))), testID: "shareStarterPackLinkBtn", onPress: onOpenShareDialog, children: [_jsx(Menu.ItemText, { children: IS_WEB ? (_jsx(Trans, { children: "Copy link" })) : (_jsx(Trans, { children: "Share via..." })) }), _jsx(Menu.ItemIcon, { icon: IS_WEB ? ChainLinkIcon : ArrowOutOfBoxIcon, position: "right" })] }) }), _jsxs(Menu.Item, { label: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Report starter pack"], ["Report starter pack"])))), onPress: function () { return reportDialogControl.open(); }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Report starter pack" }) }), _jsx(Menu.ItemIcon, { icon: CircleInfo, position: "right" })] })] })) })] }), starterPack.list && (_jsx(ReportDialog, { control: reportDialogControl, subject: __assign(__assign({}, starterPack), { $type: 'app.bsky.graph.defs#starterPackView' }) })), _jsxs(Prompt.Outer, { control: deleteDialogControl, children: [_jsx(Prompt.TitleText, { children: _jsx(Trans, { children: "Delete starter pack?" }) }), _jsx(Prompt.DescriptionText, { children: _jsx(Trans, { children: "Are you sure you want to delete this starter pack?" }) }), deleteError && (_jsxs(View, { style: [
                            a.flex_row,
                            a.gap_sm,
                            a.rounded_sm,
                            a.p_md,
                            a.mb_lg,
                            a.border,
                            t.atoms.border_contrast_medium,
                            t.atoms.bg_contrast_25,
                        ], children: [_jsxs(View, { style: [a.flex_1, a.gap_2xs], children: [_jsx(Text, { style: [a.font_semi_bold], children: _jsx(Trans, { children: "Unable to delete" }) }), _jsx(Text, { style: [a.leading_snug], children: cleanError(deleteError) })] }), _jsx(CircleInfo, { size: "sm", fill: t.palette.negative_400 })] })), _jsxs(Prompt.Actions, { children: [_jsxs(Button, { variant: "solid", color: "negative", size: gtMobile ? 'small' : 'large', label: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Yes, delete this starter pack"], ["Yes, delete this starter pack"])))), onPress: onDeleteStarterPack, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Delete" }) }), isDeletePending && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Prompt.Cancel, {})] })] })] }));
}
function InvalidStarterPack(_a) {
    var rkey = _a.rkey;
    var _ = useLingui()._;
    var t = useTheme();
    var navigation = useNavigation();
    var gtMobile = useBreakpoints().gtMobile;
    var _b = React.useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var goBack = function () {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.replace('Home');
        }
    };
    var deleteStarterPack = useDeleteStarterPackMutation({
        onSuccess: function () {
            setIsProcessing(false);
            goBack();
        },
        onError: function (e) {
            setIsProcessing(false);
            logger.error('Failed to delete invalid starter pack', { safeMessage: e });
            Toast.show(_(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Failed to delete starter pack"], ["Failed to delete starter pack"])))), 'xmark');
        },
    }).mutate;
    return (_jsx(Layout.Content, { centerContent: true, children: _jsxs(View, { style: [a.py_4xl, a.px_xl, a.align_center, a.gap_5xl], children: [_jsxs(View, { style: [a.w_full, a.align_center, a.gap_lg], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_3xl], children: _jsx(Trans, { children: "Starter pack is invalid" }) }), _jsx(Text, { style: [
                                a.text_md,
                                a.text_center,
                                t.atoms.text_contrast_high,
                                { lineHeight: 1.4 },
                                gtMobile ? { width: 450 } : [a.w_full, a.px_lg],
                            ], children: _jsx(Trans, { children: "The starter pack that you are trying to view is invalid. You may delete this starter pack instead." }) })] }), _jsxs(View, { style: [a.gap_md, gtMobile ? { width: 350 } : [a.w_full, a.px_lg]], children: [_jsxs(Button, { variant: "solid", color: "primary", label: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Delete starter pack"], ["Delete starter pack"])))), size: "large", style: [a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }], disabled: isProcessing, onPress: function () {
                                setIsProcessing(true);
                                deleteStarterPack({ rkey: rkey });
                            }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Delete" }) }), isProcessing && _jsx(Loader, { size: "xs", color: "white" })] }), _jsx(Button, { variant: "solid", color: "secondary", label: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Return to previous page"], ["Return to previous page"])))), size: "large", style: [a.rounded_sm, a.overflow_hidden, { paddingVertical: 10 }], disabled: isProcessing, onPress: goBack, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go Back" }) }) })] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24;
