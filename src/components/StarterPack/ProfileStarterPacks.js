var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { findNodeHandle, useWindowDimensions, View, } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useGenerateStarterPackMutation } from '#/lib/generate-starterpack';
import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { parseStarterPackUri } from '#/lib/strings/starter-pack';
import { logger } from '#/logger';
import { useActorStarterPacksQuery } from '#/state/queries/actor-starter-packs';
import { EmptyState, } from '#/view/com/util/EmptyState';
import { List } from '#/view/com/util/List';
import { FeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { atoms as a, ios, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { LinearGradientBackground } from '#/components/LinearGradientBackground';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { Default as StarterPackCard } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Typography';
import { IS_IOS } from '#/env';
function keyExtractor(item) {
    return item.uri;
}
export function ProfileStarterPacks(_a) {
    var _this = this;
    var ref = _a.ref, scrollElRef = _a.scrollElRef, did = _a.did, headerOffset = _a.headerOffset, enabled = _a.enabled, style = _a.style, testID = _a.testID, setScrollViewTag = _a.setScrollViewTag, isMe = _a.isMe, emptyStateMessage = _a.emptyStateMessage, emptyStateButton = _a.emptyStateButton, emptyStateIcon = _a.emptyStateIcon;
    var t = useTheme();
    var bottomBarOffset = useBottomBarOffset(100);
    var height = useWindowDimensions().height;
    var _b = useState(false), isPTRing = _b[0], setIsPTRing = _b[1];
    var _c = useActorStarterPacksQuery({ did: did, enabled: enabled }), data = _c.data, refetch = _c.refetch, isError = _c.isError, hasNextPage = _c.hasNextPage, isFetchingNextPage = _c.isFetchingNextPage, fetchNextPage = _c.fetchNextPage;
    var isTabletOrDesktop = useWebMediaQueries().isTabletOrDesktop;
    var items = data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.starterPacks; });
    var _ = useLingui()._;
    var EmptyComponent = useCallback(function () {
        if (emptyStateMessage || emptyStateButton || emptyStateIcon) {
            return (_jsx(View, { style: [a.px_lg, a.align_center, a.justify_center], children: _jsx(EmptyState, { icon: emptyStateIcon, iconSize: "3xl", message: emptyStateMessage !== null && emptyStateMessage !== void 0 ? emptyStateMessage : _('Starter packs let you share your favorite feeds and people with your friends.'), button: emptyStateButton }) }));
        }
        return _jsx(Empty, {});
    }, [_, emptyStateMessage, emptyStateButton, emptyStateIcon]);
    useImperativeHandle(ref, function () { return ({
        scrollToTop: function () { },
    }); });
    var onRefresh = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTRing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, refetch()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    logger.error('Failed to refresh starter packs', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4:
                    setIsPTRing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch, setIsPTRing]);
    var onEndReached = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isFetchingNextPage || !hasNextPage || isError)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchNextPage()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    logger.error('Failed to load more starter packs', { message: err_2 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);
    useEffect(function () {
        if (IS_IOS && enabled && scrollElRef.current) {
            var nativeTag = findNodeHandle(scrollElRef.current);
            setScrollViewTag(nativeTag);
        }
    }, [enabled, scrollElRef, setScrollViewTag]);
    var renderItem = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        return (_jsx(View, { style: [
                a.p_lg,
                (isTabletOrDesktop || index !== 0) && a.border_t,
                t.atoms.border_contrast_low,
            ], children: _jsx(StarterPackCard, { starterPack: item }) }));
    }, [isTabletOrDesktop, t.atoms.border_contrast_low]);
    return (_jsx(View, { testID: testID, style: style, children: _jsx(List, { testID: testID ? "".concat(testID, "-flatlist") : undefined, ref: scrollElRef, data: items, renderItem: renderItem, keyExtractor: keyExtractor, refreshing: isPTRing, headerOffset: headerOffset, progressViewOffset: ios(0), contentContainerStyle: {
                minHeight: height + headerOffset,
                paddingBottom: bottomBarOffset,
            }, removeClippedSubviews: true, desktopFixedHeight: true, onEndReached: onEndReached, onRefresh: onRefresh, ListEmptyComponent: data ? (isMe ? EmptyComponent : undefined) : FeedLoadingPlaceholder, ListFooterComponent: !!data && (items === null || items === void 0 ? void 0 : items.length) !== 0 && isMe ? CreateAnother : undefined }) }));
}
function CreateAnother() {
    var _ = useLingui()._;
    var t = useTheme();
    var navigation = useNavigation();
    return (_jsx(View, { style: [
            a.pr_md,
            a.pt_lg,
            a.gap_lg,
            a.border_t,
            t.atoms.border_contrast_low,
        ], children: _jsxs(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Create a starter pack"], ["Create a starter pack"])))), variant: "solid", color: "secondary", size: "small", style: [a.self_center], onPress: function () { return navigation.navigate('StarterPackWizard', {}); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Create another" }) }), _jsx(ButtonIcon, { icon: Plus, position: "right" })] }) }));
}
function Empty() {
    var _ = useLingui()._;
    var navigation = useNavigation();
    var confirmDialogControl = useDialogControl();
    var followersDialogControl = useDialogControl();
    var errorDialogControl = useDialogControl();
    var requireEmailVerification = useRequireEmailVerification();
    var _a = useState(false), isGenerating = _a[0], setIsGenerating = _a[1];
    var generateStarterPack = useGenerateStarterPackMutation({
        onSuccess: function (_a) {
            var uri = _a.uri;
            var parsed = parseStarterPackUri(uri);
            if (parsed) {
                navigation.push('StarterPack', {
                    name: parsed.name,
                    rkey: parsed.rkey,
                });
            }
            setIsGenerating(false);
        },
        onError: function (e) {
            logger.error('Failed to generate starter pack', { safeMessage: e });
            setIsGenerating(false);
            if (e.message.includes('NOT_ENOUGH_FOLLOWERS')) {
                followersDialogControl.open();
            }
            else {
                errorDialogControl.open();
            }
        },
    }).mutate;
    var generate = function () {
        setIsGenerating(true);
        generateStarterPack();
    };
    var openConfirmDialog = useCallback(function () {
        confirmDialogControl.open();
    }, [confirmDialogControl]);
    var wrappedOpenConfirmDialog = requireEmailVerification(openConfirmDialog, {
        instructions: [
            _jsx(Trans, { children: "Before creating a starter pack, you must first verify your email." }, "confirm"),
        ],
    });
    var navToWizard = useCallback(function () {
        navigation.navigate('StarterPackWizard', {});
    }, [navigation]);
    var wrappedNavToWizard = requireEmailVerification(navToWizard, {
        instructions: [
            _jsx(Trans, { children: "Before creating a starter pack, you must first verify your email." }, "nav"),
        ],
    });
    return (_jsxs(LinearGradientBackground, { style: [
            a.px_lg,
            a.py_lg,
            a.justify_between,
            a.gap_lg,
            a.shadow_lg,
            { marginTop: a.border.borderWidth },
        ], children: [_jsxs(View, { style: [a.gap_xs], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_lg, { color: 'white' }], children: _jsx(Trans, { children: "You haven't created a starter pack yet!" }) }), _jsx(Text, { style: [a.text_md, { color: 'white' }], children: _jsx(Trans, { children: "Starter packs let you easily share your favorite feeds and people with your friends." }) })] }), _jsxs(View, { style: [a.flex_row, a.gap_md, { marginLeft: 'auto' }], children: [_jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Create a starter pack for me"], ["Create a starter pack for me"])))), variant: "ghost", color: "primary", size: "small", disabled: isGenerating, onPress: wrappedOpenConfirmDialog, style: { backgroundColor: 'transparent' }, children: [_jsx(ButtonText, { style: { color: 'white' }, children: _jsx(Trans, { children: "Make one for me" }) }), isGenerating && _jsx(Loader, { size: "md" })] }), _jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Create a starter pack"], ["Create a starter pack"])))), variant: "ghost", color: "primary", size: "small", disabled: isGenerating, onPress: wrappedNavToWizard, style: {
                            backgroundColor: 'white',
                            borderColor: 'white',
                            width: 100,
                        }, hoverStyle: [{ backgroundColor: '#dfdfdf' }], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create" }) }) })] }), _jsxs(Prompt.Outer, { control: confirmDialogControl, children: [_jsx(Prompt.TitleText, { children: _jsx(Trans, { children: "Generate a starter pack" }) }), _jsx(Prompt.DescriptionText, { children: _jsx(Trans, { children: "Bluesky will choose a set of recommended accounts from people in your network." }) }), _jsxs(Prompt.Actions, { children: [_jsx(Prompt.Action, { color: "primary", cta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Choose for me"], ["Choose for me"])))), onPress: generate }), _jsx(Prompt.Action, { color: "secondary", cta: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Let me choose"], ["Let me choose"])))), onPress: function () {
                                    navigation.navigate('StarterPackWizard', {});
                                } })] })] }), _jsx(Prompt.Basic, { control: followersDialogControl, title: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Oops!"], ["Oops!"])))), description: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["You must be following at least seven other people to generate a starter pack."], ["You must be following at least seven other people to generate a starter pack."])))), onConfirm: function () { }, showCancel: false }), _jsx(Prompt.Basic, { control: errorDialogControl, title: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Oops!"], ["Oops!"])))), description: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["An error occurred while generating your starter pack. Want to try again?"], ["An error occurred while generating your starter pack. Want to try again?"])))), onConfirm: generate, confirmButtonCta: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Retry"], ["Retry"])))) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
