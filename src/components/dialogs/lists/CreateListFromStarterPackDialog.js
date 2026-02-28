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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { AtUri, } from '@atproto/api';
import { TID } from '@atproto/common-web';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import chunk from 'lodash.chunk';
import { until } from '#/lib/async/until';
import { wait } from '#/lib/async/wait';
import { logger } from '#/logger';
import { getAllListMembers } from '#/state/queries/list-members';
import { useAgent, useSession } from '#/state/session';
import { atoms as a, platform, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { CreateOrEditListDialog } from './CreateOrEditListDialog';
export function CreateListFromStarterPackDialog(_a) {
    var _this = this;
    var _b;
    var control = _a.control, starterPack = _a.starterPack;
    var _ = useLingui()._;
    var t = useTheme();
    var agent = useAgent();
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var navigation = useNavigation();
    var queryClient = useQueryClient();
    var createDialogControl = Dialog.useDialogControl();
    var loadingDialogControl = Dialog.useDialogControl();
    var record = starterPack.record;
    var onPressCreate = function () {
        control.close(function () { return createDialogControl.open(); });
    };
    var addMembersAndNavigate = function (listUri) { return __awaiter(_this, void 0, void 0, function () {
        var navigateToList, listItems, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    navigateToList = function () {
                        var urip = new AtUri(listUri);
                        navigation.navigate('ProfileList', {
                            name: urip.hostname,
                            rkey: urip.rkey,
                        });
                    };
                    if (!starterPack.list || !currentAccount) {
                        loadingDialogControl.close(navigateToList);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, wait(3000, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var items, listitemWrites, chunks, _i, chunks_1, c;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, getAllListMembers(agent, starterPack.list.uri)];
                                    case 1:
                                        items = _a.sent();
                                        if (!(items.length > 0)) return [3 /*break*/, 7];
                                        listitemWrites = items.map(function (item) {
                                            var listitemRecord = {
                                                $type: 'app.bsky.graph.listitem',
                                                subject: item.subject.did,
                                                list: listUri,
                                                createdAt: new Date().toISOString(),
                                            };
                                            return {
                                                $type: 'com.atproto.repo.applyWrites#create',
                                                collection: 'app.bsky.graph.listitem',
                                                rkey: TID.nextStr(),
                                                value: listitemRecord,
                                            };
                                        });
                                        chunks = chunk(listitemWrites, 50);
                                        _i = 0, chunks_1 = chunks;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < chunks_1.length)) return [3 /*break*/, 5];
                                        c = chunks_1[_i];
                                        return [4 /*yield*/, agent.com.atproto.repo.applyWrites({
                                                repo: currentAccount.did,
                                                writes: c,
                                            })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [4 /*yield*/, until(5, 1e3, function (res) { return res.data.items.length > 0; }, function () {
                                            return agent.app.bsky.graph.getList({
                                                list: listUri,
                                                limit: 1,
                                            });
                                        })];
                                    case 6:
                                        _a.sent();
                                        _a.label = 7;
                                    case 7: return [2 /*return*/, items];
                                }
                            });
                        }); })())];
                case 2:
                    listItems = _a.sent();
                    queryClient.invalidateQueries({ queryKey: ['list-members', listUri] });
                    ax.metric('starterPack:convertToList', {
                        starterPack: starterPack.uri,
                        memberCount: listItems.length,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    logger.error('Failed to add members to list', { safeMessage: e_1 });
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["List created, but failed to add some members"], ["List created, but failed to add some members"])))), {
                        type: 'error',
                    });
                    return [3 /*break*/, 4];
                case 4:
                    loadingDialogControl.close(navigateToList);
                    return [2 /*return*/];
            }
        });
    }); };
    var onListCreated = function (listUri) {
        loadingDialogControl.open();
        addMembersAndNavigate(listUri);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Dialog.Outer, { control: control, testID: "createListFromStarterPackDialog", nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Create list from starter pack"], ["Create list from starter pack"])))), style: web({ maxWidth: 400 }), children: [_jsxs(View, { style: [a.gap_lg], children: [_jsx(Text, { style: [a.text_xl, a.font_bold], children: _jsx(Trans, { children: "Create list from starter pack" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "This will create a new list with the same name, description, and members as this starter pack." }) }), _jsx(Admonition, { type: "tip", children: _jsx(Trans, { children: "Changes to the starter pack will not be reflected in the list after creation. The list will be an independent copy." }) }), _jsxs(View, { style: [
                                            platform({
                                                web: [a.flex_row_reverse],
                                                native: [a.flex_col],
                                            }),
                                            a.gap_md,
                                            a.pt_sm,
                                        ], children: [_jsx(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Create list"], ["Create list"])))), onPress: onPressCreate, size: platform({
                                                    web: 'small',
                                                    native: 'large',
                                                }), color: "primary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Create list" }) }) }), _jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: function () { return control.close(); }, size: platform({
                                                    web: 'small',
                                                    native: 'large',
                                                }), color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] })] }), _jsx(Dialog.Close, {})] })] }), _jsx(CreateOrEditListDialog, { control: createDialogControl, purpose: "app.bsky.graph.defs#curatelist", onSave: onListCreated, initialValues: {
                    name: record.name,
                    description: record.description,
                    avatar: (_b = starterPack.list) === null || _b === void 0 ? void 0 : _b.avatar,
                } }), _jsxs(Dialog.Outer, { control: loadingDialogControl, nativeOptions: { preventDismiss: true }, children: [_jsx(Dialog.Handle, {}), _jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Adding members to list..."], ["Adding members to list..."])))), style: web({ maxWidth: 400 }), children: _jsxs(View, { style: [a.align_center, a.gap_lg, a.py_5xl], children: [_jsx(Loader, { size: "xl" }), _jsx(Text, { style: [a.text_lg, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Adding members to list..." }) })] }) })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
