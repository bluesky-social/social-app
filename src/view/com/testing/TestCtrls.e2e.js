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
import { useState } from 'react';
import { LogBox, Pressable, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BLUESKY_PROXY_HEADER } from '#/lib/constants';
import { useAgent, useSessionApi } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import { useOnboardingDispatch } from '#/state/shell/onboarding';
import { navigate } from '../../../Navigation';
LogBox.ignoreAllLogs();
/**
 * This utility component is only included in the test simulator
 * build. It gives some quick triggers which help improve the pace
 * of the tests dramatically.
 */
var BTN = { height: 1, width: 1, backgroundColor: 'red' };
export function TestCtrls() {
    var _this = this;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var _a = useSessionApi(), logoutEveryAccount = _a.logoutEveryAccount, login = _a.login;
    var onboardingDispatch = useOnboardingDispatch();
    var setShowLoggedOut = useLoggedOutViewControls().setShowLoggedOut;
    var onPressSignInAlice = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, login({
                        service: 'http://localhost:3000',
                        identifier: 'alice.test',
                        password: 'hunter2',
                    }, 'LoginForm')];
                case 1:
                    _a.sent();
                    setShowLoggedOut(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var onPressSignInBob = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, login({
                        service: 'http://localhost:3000',
                        identifier: 'bob.test',
                        password: 'hunter2',
                    }, 'LoginForm')];
                case 1:
                    _a.sent();
                    setShowLoggedOut(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var _b = useState(''), proxyHeader = _b[0], setProxyHeader = _b[1];
    return (_jsxs(View, { style: { position: 'absolute', top: 100, right: 0, zIndex: 100 }, children: [_jsx(TextInput, { accessibilityLabel: "Text input field", accessibilityHint: "Enter proxy header", testID: "e2eProxyHeaderInput", onChangeText: function (val) { return setProxyHeader(val); }, onSubmitEditing: function () {
                    var header = "".concat(proxyHeader, "#bsky_appview");
                    BLUESKY_PROXY_HEADER.set(header);
                    agent.configureProxy(header);
                }, style: BTN }), _jsx(Pressable, { testID: "e2eSignInAlice", onPress: onPressSignInAlice, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eSignInBob", onPress: onPressSignInBob, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eSignOut", onPress: function () { return logoutEveryAccount('Settings'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eGotoHome", onPress: function () { return navigate('Home'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eGotoSettings", onPress: function () { return navigate('Settings'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eGotoModeration", onPress: function () { return navigate('Moderation'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eGotoLists", onPress: function () { return navigate('Lists'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eGotoFeeds", onPress: function () { return navigate('Feeds'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "storybookBtn", onPress: function () { return navigate('Debug'); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eRefreshHome", onPress: function () { return queryClient.invalidateQueries({ queryKey: ['post-feed'] }); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eOpenLoggedOutView", onPress: function () { return setShowLoggedOut(true); }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eStartOnboarding", onPress: function () {
                    onboardingDispatch({ type: 'start' });
                }, accessibilityRole: "button", style: BTN }), _jsx(Pressable, { testID: "e2eStartLongboarding", onPress: function () {
                    onboardingDispatch({ type: 'start' });
                }, accessibilityRole: "button", style: BTN })] }));
}
