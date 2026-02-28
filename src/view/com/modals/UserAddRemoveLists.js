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
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { usePalette } from '#/lib/hooks/usePalette';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { s } from '#/lib/styles';
import { useModalControls } from '#/state/modals';
import { getMembership, useDangerousListMembershipsQuery, useListMembershipAddMutation, useListMembershipRemoveMutation, } from '#/state/queries/list-memberships';
import { useSession } from '#/state/session';
import { IS_ANDROID, IS_WEB, IS_WEB_MOBILE } from '#/env';
import { MyLists } from '../lists/MyLists';
import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
import * as Toast from '../util/Toast';
import { UserAvatar } from '../util/UserAvatar';
export var snapPoints = ['fullscreen'];
export function Component(_a) {
    var subject = _a.subject, handle = _a.handle, displayName = _a.displayName, onAdd = _a.onAdd, onRemove = _a.onRemove;
    var closeModal = useModalControls().closeModal;
    var pal = usePalette('default');
    var screenHeight = useWindowDimensions().height;
    var _ = useLingui()._;
    var memberships = useDangerousListMembershipsQuery().data;
    var onPressDone = useCallback(function () {
        closeModal();
    }, [closeModal]);
    var listStyle = React.useMemo(function () {
        if (IS_WEB_MOBILE) {
            return [pal.border, { height: screenHeight / 2 }];
        }
        else if (IS_WEB) {
            return [pal.border, { height: screenHeight / 1.5 }];
        }
        return [pal.border, { flex: 1, borderTopWidth: StyleSheet.hairlineWidth }];
    }, [pal.border, screenHeight]);
    var headerStyles = [
        {
            textAlign: 'center',
            fontWeight: '600',
            fontSize: 20,
            marginBottom: 12,
            paddingHorizontal: 12,
        },
        pal.text,
    ];
    return (_jsxs(View, { testID: "userAddRemoveListsModal", style: s.hContentRegion, children: [_jsx(Text, { style: headerStyles, numberOfLines: 1, children: _jsxs(Trans, { children: ["Update", ' ', _jsx(Text, { style: headerStyles, numberOfLines: 1, children: displayName }), ' ', "in Lists"] }) }), _jsx(MyLists, { filter: "all", inline: true, renderItem: function (list, index) { return (_jsx(ListItem, { index: index, list: list, memberships: memberships, subject: subject, handle: handle, onAdd: onAdd, onRemove: onRemove }, list.uri)); }, style: listStyle }), _jsx(View, { style: [styles.btns, pal.border], children: _jsx(Button, { testID: "doneBtn", type: "default", onPress: onPressDone, style: styles.footerBtn, accessibilityLabel: _(msg({ message: "Done", context: 'action' })), accessibilityHint: "", onAccessibilityEscape: onPressDone, label: _(msg({ message: "Done", context: 'action' })) }) })] }));
}
function ListItem(_a) {
    var _this = this;
    var index = _a.index, list = _a.list, memberships = _a.memberships, subject = _a.subject, handle = _a.handle, onAdd = _a.onAdd, onRemove = _a.onRemove;
    var pal = usePalette('default');
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var _b = React.useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var membership = React.useMemo(function () { return getMembership(memberships, list.uri, subject); }, [memberships, list.uri, subject]);
    var listMembershipAddMutation = useListMembershipAddMutation();
    var listMembershipRemoveMutation = useListMembershipRemoveMutation();
    var onToggleMembership = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof membership === 'undefined') {
                        return [2 /*return*/];
                    }
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    if (!(membership === false)) return [3 /*break*/, 3];
                    return [4 /*yield*/, listMembershipAddMutation.mutateAsync({
                            listUri: list.uri,
                            actorDid: subject,
                        })];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Added to list"], ["Added to list"])))));
                    onAdd === null || onAdd === void 0 ? void 0 : onAdd(list.uri);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, listMembershipRemoveMutation.mutateAsync({
                        listUri: list.uri,
                        actorDid: subject,
                        membershipUri: membership,
                    })];
                case 4:
                    _a.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Removed from list"], ["Removed from list"])))));
                    onRemove === null || onRemove === void 0 ? void 0 : onRemove(list.uri);
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1 = _a.sent();
                    Toast.show(cleanError(e_1), 'xmark');
                    return [3 /*break*/, 8];
                case 7:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [
        _,
        list,
        subject,
        membership,
        setIsProcessing,
        onAdd,
        onRemove,
        listMembershipAddMutation,
        listMembershipRemoveMutation,
    ]);
    return (_jsxs(View, { testID: "toggleBtn-".concat(list.name), style: [
            styles.listItem,
            pal.border,
            index !== 0 && { borderTopWidth: StyleSheet.hairlineWidth },
        ], children: [_jsx(View, { style: styles.listItemAvi, children: _jsx(UserAvatar, { size: 40, avatar: list.avatar, type: "list" }) }), _jsxs(View, { style: styles.listItemContent, children: [_jsx(Text, { type: "lg", style: [s.bold, pal.text], numberOfLines: 1, lineHeight: 1.2, children: sanitizeDisplayName(list.name) }), _jsxs(Text, { type: "md", style: [pal.textLight], numberOfLines: 1, children: [list.purpose === 'app.bsky.graph.defs#curatelist' &&
                                (list.creator.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) ? (_jsx(Trans, { children: "User list by you" })) : (_jsxs(Trans, { children: ["User list by ", sanitizeHandle(list.creator.handle, '@')] }))), list.purpose === 'app.bsky.graph.defs#modlist' &&
                                (list.creator.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) ? (_jsx(Trans, { children: "Moderation list by you" })) : (_jsxs(Trans, { children: ["Moderation list by ", sanitizeHandle(list.creator.handle, '@')] })))] })] }), _jsx(View, { children: isProcessing || typeof membership === 'undefined' ? (_jsx(ActivityIndicator, {})) : (_jsx(Button, { testID: "user-".concat(handle, "-addBtn"), type: "default", label: membership === false ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Add"], ["Add"])))) : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Remove"], ["Remove"])))), onPress: onToggleMembership })) })] }));
}
var styles = StyleSheet.create({
    container: {
        paddingHorizontal: IS_WEB ? 0 : 16,
    },
    btns: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingTop: 10,
        paddingBottom: IS_ANDROID ? 10 : 0,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    listItemAvi: {
        width: 54,
        paddingLeft: 4,
        paddingTop: 8,
        paddingBottom: 10,
    },
    listItemContent: {
        flex: 1,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        width: 24,
        height: 24,
        borderRadius: 6,
        marginRight: 8,
    },
    loadingContainer: {
        position: 'absolute',
        top: 10,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
