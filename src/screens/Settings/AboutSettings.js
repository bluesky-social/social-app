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
import { Platform } from 'react-native';
import { setStringAsync } from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { STATUS_PAGE_URL } from '#/lib/constants';
import * as Toast from '#/view/com/util/Toast';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import { Atom_Stroke2_Corner0_Rounded as AtomIcon } from '#/components/icons/Atom';
import { BroomSparkle_Stroke2_Corner2_Rounded as BroomSparkleIcon } from '#/components/icons/BroomSparkle';
import { CodeLines_Stroke2_Corner2_Rounded as CodeLinesIcon } from '#/components/icons/CodeLines';
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import { Newspaper_Stroke2_Corner2_Rounded as NewspaperIcon } from '#/components/icons/Newspaper';
import { Wrench_Stroke2_Corner2_Rounded as WrenchIcon } from '#/components/icons/Wrench';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';
import { getDeviceId } from '#/analytics/identifiers';
import { IS_ANDROID, IS_IOS, IS_NATIVE } from '#/env';
import * as env from '#/env';
import { useDemoMode } from '#/storage/hooks/demo-mode';
import { useDevMode } from '#/storage/hooks/dev-mode';
import { OTAInfo } from './components/OTAInfo';
export function AboutSettingsScreen(_a) {
    var _this = this;
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var _c = useDevMode(), devModeEnabled = _c[0], setDevModeEnabled = _c[1];
    var _d = useDemoMode(), demoModeEnabled = _d[0], setDemoModeEnabled = _d[1];
    var _e = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var freeSpaceBefore, freeSpaceAfter, spaceDiff;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, FileSystem.getFreeDiskStorageAsync()];
                    case 1:
                        freeSpaceBefore = _a.sent();
                        return [4 /*yield*/, Image.clearDiskCache()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, FileSystem.getFreeDiskStorageAsync()];
                    case 3:
                        freeSpaceAfter = _a.sent();
                        spaceDiff = freeSpaceBefore - freeSpaceAfter;
                        return [2 /*return*/, spaceDiff * -1];
                }
            });
        }); },
        onSuccess: function (sizeDiffBytes) {
            if (IS_ANDROID) {
                Toast.show(_(msg({
                    message: "Image cache cleared, freed ".concat(i18n.number(Math.abs(sizeDiffBytes / 1024 / 1024), {
                        notation: 'compact',
                        style: 'unit',
                        unit: 'megabyte',
                    })),
                    comment: "Android-only toast message which includes amount of space freed using localized number formatting",
                })));
            }
            else {
                Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Image cache cleared"], ["Image cache cleared"])))));
            }
        },
    }), onClearImageCache = _e.mutate, isClearingImageCache = _e.isPending;
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "About" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.LinkItem, { to: "https://bsky.social/about/support/tos", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Terms of Service"], ["Terms of Service"])))), children: [_jsx(SettingsList.ItemIcon, { icon: NewspaperIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Terms of Service" }) })] }), _jsxs(SettingsList.LinkItem, { to: "https://bsky.social/about/support/privacy-policy", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Privacy Policy"], ["Privacy Policy"])))), children: [_jsx(SettingsList.ItemIcon, { icon: NewspaperIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Privacy Policy" }) })] }), _jsxs(SettingsList.LinkItem, { to: STATUS_PAGE_URL, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Status Page"], ["Status Page"])))), children: [_jsx(SettingsList.ItemIcon, { icon: GlobeIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Status Page" }) })] }), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.LinkItem, { to: "/sys/log", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["System log"], ["System log"])))), children: [_jsx(SettingsList.ItemIcon, { icon: CodeLinesIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "System log" }) })] }), IS_NATIVE && (_jsxs(SettingsList.PressableItem, { onPress: function () { return onClearImageCache(); }, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Clear image cache"], ["Clear image cache"])))), disabled: isClearingImageCache, children: [_jsx(SettingsList.ItemIcon, { icon: BroomSparkleIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Clear image cache" }) }), isClearingImageCache && _jsx(SettingsList.ItemIcon, { icon: Loader })] })), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Version ", ""], ["Version ", ""])), env.APP_VERSION)), accessibilityHint: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Copies build version to clipboard"], ["Copies build version to clipboard"])))), onLongPress: function () {
                                var newDevModeEnabled = !devModeEnabled;
                                setDevModeEnabled(newDevModeEnabled);
                                Toast.show(newDevModeEnabled
                                    ? _(msg({
                                        message: 'Developer mode enabled',
                                        context: 'toast',
                                    }))
                                    : _(msg({
                                        message: 'Developer mode disabled',
                                        context: 'toast',
                                    })));
                            }, onPress: function () {
                                var _a;
                                setStringAsync("Build version: ".concat(env.APP_VERSION, "; Bundle info: ").concat(env.APP_METADATA, "; Bundle date: ").concat(env.BUNDLE_DATE, "; Platform: ").concat(Platform.OS, "; Platform version: ").concat(Platform.Version, "; Device ID: ").concat((_a = getDeviceId()) !== null && _a !== void 0 ? _a : 'N/A'));
                                Toast.show(_(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Copied build version to clipboard"], ["Copied build version to clipboard"])))));
                            }, children: [_jsx(SettingsList.ItemIcon, { icon: WrenchIcon }), _jsx(SettingsList.ItemText, { children: _jsxs(Trans, { children: ["Version ", env.APP_VERSION] }) }), _jsx(SettingsList.BadgeText, { children: env.APP_METADATA })] }), devModeEnabled && (_jsxs(_Fragment, { children: [_jsx(OTAInfo, {}), IS_IOS && (_jsxs(SettingsList.PressableItem, { onPress: function () {
                                        var newDemoModeEnabled = !demoModeEnabled;
                                        setDemoModeEnabled(newDemoModeEnabled);
                                        Toast.show('Demo mode ' +
                                            (newDemoModeEnabled ? 'enabled' : 'disabled'));
                                    }, label: demoModeEnabled ? 'Disable demo mode' : 'Enable demo mode', disabled: isClearingImageCache, children: [_jsx(SettingsList.ItemIcon, { icon: AtomIcon }), _jsx(SettingsList.ItemText, { children: demoModeEnabled ? 'Disable demo mode' : 'Enable demo mode' })] }))] }))] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
