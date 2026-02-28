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
import { AppBskyGraphDefs, AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { logger } from '#/logger';
import { useListBlockMutation, useListDeleteMutation, useListMuteMutation, } from '#/state/queries/list';
import { useRemoveFeedMutation } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import { Button, ButtonIcon } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon } from '#/components/icons/ArrowOutOfBox';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLink } from '#/components/icons/ChainLink';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon } from '#/components/icons/DotGrid';
import { PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon } from '#/components/icons/Pencil';
import { PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon } from '#/components/icons/Person';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon } from '#/components/icons/Speaker';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Menu from '#/components/Menu';
import { ReportDialog, useReportDialogControl, } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
export function MoreOptionsMenu(_a) {
    var _this = this;
    var _b, _c;
    var list = _a.list, savedFeedConfig = _a.savedFeedConfig;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var editListDialogControl = useDialogControl();
    var deleteListPromptControl = useDialogControl();
    var reportDialogControl = useReportDialogControl();
    var navigation = useNavigation();
    var removeSavedFeed = useRemoveFeedMutation().mutateAsync;
    var deleteList = useListDeleteMutation().mutateAsync;
    var muteList = useListMuteMutation().mutateAsync;
    var blockList = useListBlockMutation().mutateAsync;
    var isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST;
    var isModList = list.purpose === AppBskyGraphDefs.MODLIST;
    var isBlocking = !!((_b = list.viewer) === null || _b === void 0 ? void 0 : _b.blocked);
    var isMuting = !!((_c = list.viewer) === null || _c === void 0 ? void 0 : _c.muted);
    var isPinned = Boolean(savedFeedConfig === null || savedFeedConfig === void 0 ? void 0 : savedFeedConfig.pinned);
    var isOwner = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === list.creator.did;
    var onPressShare = function () {
        var rkey = new AtUri(list.uri).rkey;
        var url = toShareUrl("/profile/".concat(list.creator.did, "/lists/").concat(rkey));
        shareUrl(url);
    };
    var onRemoveFromSavedFeeds = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!savedFeedConfig)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, removeSavedFeed(savedFeedConfig)];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Removed from your feeds"], ["Removed from your feeds"])))));
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue contacting the server"], ["There was an issue contacting the server"])))), {
                        type: 'error',
                    });
                    logger.error('Failed to remove pinned list', { message: e_1 });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var onPressDelete = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, deleteList({ uri: list.uri })];
                case 1:
                    _a.sent();
                    if (!savedFeedConfig) return [3 /*break*/, 3];
                    return [4 /*yield*/, removeSavedFeed(savedFeedConfig)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    Toast.show(_(msg({ message: 'List deleted', context: 'toast' })));
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    }
                    else {
                        navigation.navigate('Home');
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var onUnpinModList = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (!savedFeedConfig)
                        return [2 /*return*/];
                    return [4 /*yield*/, removeSavedFeed(savedFeedConfig)];
                case 1:
                    _b.sent();
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Unpinned list"], ["Unpinned list"])))));
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to unpin list"], ["Failed to unpin list"])))), {
                        type: 'error',
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var onUnsubscribeMute = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, muteList({ uri: list.uri, mute: false })];
                case 1:
                    _b.sent();
                    Toast.show(_(msg({ message: 'List unmuted', context: 'toast' })));
                    ax.metric('moderation:unsubscribedFromList', { listType: 'mute' });
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var onUnsubscribeBlock = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, blockList({ uri: list.uri, block: false })];
                case 1:
                    _b.sent();
                    Toast.show(_(msg({ message: 'List unblocked', context: 'toast' })));
                    ax.metric('moderation:unsubscribedFromList', { listType: 'block' });
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["More options"], ["More options"])))), children: function (_a) {
                            var props = _a.props;
                            return (_jsx(Button, __assign({ label: props.accessibilityLabel, testID: "moreOptionsBtn", size: "small", color: "secondary", shape: "round" }, props, { children: _jsx(ButtonIcon, { icon: DotGridIcon }) })));
                        } }), _jsxs(Menu.Outer, { children: [_jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: IS_WEB ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Copy link to list"], ["Copy link to list"])))) : _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Share via..."], ["Share via..."])))), onPress: onPressShare, children: [_jsx(Menu.ItemText, { children: IS_WEB ? (_jsx(Trans, { children: "Copy link to list" })) : (_jsx(Trans, { children: "Share via..." })) }), _jsx(Menu.ItemIcon, { position: "right", icon: IS_WEB ? ChainLink : ShareIcon })] }), savedFeedConfig && (_jsxs(Menu.Item, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Remove from my feeds"], ["Remove from my feeds"])))), onPress: onRemoveFromSavedFeeds, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Remove from my feeds" }) }), _jsx(Menu.ItemIcon, { position: "right", icon: TrashIcon })] }))] }), _jsx(Menu.Divider, {}), isOwner ? (_jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Edit list details"], ["Edit list details"])))), onPress: editListDialogControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Edit list details" }) }), _jsx(Menu.ItemIcon, { position: "right", icon: PencilLineIcon })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Delete list"], ["Delete list"])))), onPress: deleteListPromptControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Delete list" }) }), _jsx(Menu.ItemIcon, { position: "right", icon: TrashIcon })] })] })) : (_jsx(Menu.Group, { children: _jsxs(Menu.Item, { label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Report list"], ["Report list"])))), onPress: reportDialogControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Report list" }) }), _jsx(Menu.ItemIcon, { position: "right", icon: WarningIcon })] }) })), isModList && isPinned && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsx(Menu.Group, { children: _jsxs(Menu.Item, { label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Unpin moderation list"], ["Unpin moderation list"])))), onPress: onUnpinModList, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Unpin moderation list" }) }), _jsx(Menu.ItemIcon, { icon: PinIcon })] }) })] })), isCurateList && (isBlocking || isMuting) && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Group, { children: [isBlocking && (_jsxs(Menu.Item, { label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Unblock list"], ["Unblock list"])))), onPress: onUnsubscribeBlock, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Unblock list" }) }), _jsx(Menu.ItemIcon, { icon: PersonCheckIcon })] })), isMuting && (_jsxs(Menu.Item, { label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Unmute list"], ["Unmute list"])))), onPress: onUnsubscribeMute, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Unmute list" }) }), _jsx(Menu.ItemIcon, { icon: UnmuteIcon })] }))] })] }))] })] }), _jsx(CreateOrEditListDialog, { control: editListDialogControl, list: list }), _jsx(Prompt.Basic, { control: deleteListPromptControl, title: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Delete this list?"], ["Delete this list?"])))), description: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["If you delete this list, you won't be able to recover it."], ["If you delete this list, you won't be able to recover it."])))), onConfirm: onPressDelete, confirmButtonCta: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Delete"], ["Delete"])))), confirmButtonColor: "negative" }), _jsx(ReportDialog, { control: reportDialogControl, subject: __assign(__assign({}, list), { $type: 'app.bsky.graph.defs#listView' }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19;
