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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Mute_Stroke2_Corner0_Rounded as MuteIcon } from '#/components/icons/Mute';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { useAnalytics } from '#/analytics';
export function SubscribeMenu(_a) {
    var _this = this;
    var list = _a.list;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var subscribeMutePromptControl = Prompt.usePromptControl();
    var subscribeBlockPromptControl = Prompt.usePromptControl();
    var _b = useListMuteMutation(), muteList = _b.mutateAsync, isMutePending = _b.isPending;
    var _c = useListBlockMutation(), blockList = _c.mutateAsync, isBlockPending = _c.isPending;
    var isPending = isMutePending || isBlockPending;
    var onSubscribeMute = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, muteList({ uri: list.uri, mute: true })];
                case 1:
                    _b.sent();
                    Toast.show(_(msg({ message: 'List muted', context: 'toast' })));
                    ax.metric('moderation:subscribedToList', { listType: 'mute' });
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))), { type: 'error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var onSubscribeBlock = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, blockList({ uri: list.uri, block: true })];
                case 1:
                    _b.sent();
                    Toast.show(_(msg({ message: 'List blocked', context: 'toast' })));
                    ax.metric('moderation:subscribedToList', { listType: 'block' });
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue. Please check your internet connection and try again."], ["There was an issue. Please check your internet connection and try again."])))), { type: 'error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Subscribe to this list"], ["Subscribe to this list"])))), children: function (_a) {
                            var props = _a.props;
                            return (_jsxs(Button, __assign({ label: props.accessibilityLabel, testID: "subscribeBtn", size: "small", color: "primary_subtle", style: [a.rounded_full], disabled: isPending }, props, { children: [isPending && _jsx(ButtonIcon, { icon: Loader }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Subscribe" }) })] })));
                        } }), _jsx(Menu.Outer, { showCancel: true, children: _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Mute accounts"], ["Mute accounts"])))), onPress: subscribeMutePromptControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Mute accounts" }) }), _jsx(Menu.ItemIcon, { position: "right", icon: MuteIcon })] }), _jsxs(Menu.Item, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Block accounts"], ["Block accounts"])))), onPress: subscribeBlockPromptControl.open, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Block accounts" }) }), _jsx(Menu.ItemIcon, { position: "right", icon: PersonXIcon })] })] }) })] }), _jsx(Prompt.Basic, { control: subscribeMutePromptControl, title: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Mute these accounts?"], ["Mute these accounts?"])))), description: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Muting is private. Muted accounts can interact with you, but you will not see their posts or receive notifications from them."], ["Muting is private. Muted accounts can interact with you, but you will not see their posts or receive notifications from them."])))), onConfirm: onSubscribeMute, confirmButtonCta: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Mute list"], ["Mute list"])))) }), _jsx(Prompt.Basic, { control: subscribeBlockPromptControl, title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Block these accounts?"], ["Block these accounts?"])))), description: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Blocking is public. Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you."], ["Blocking is public. Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you."])))), onConfirm: onSubscribeBlock, confirmButtonCta: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Block list"], ["Block list"])))), confirmButtonColor: "negative" })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
