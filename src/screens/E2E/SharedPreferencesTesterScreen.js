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
import React from 'react';
import { View } from 'react-native';
import { ScrollView } from '#/view/com/util/Views';
import { atoms as a } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';
import { SharedPrefs } from '../../../modules/expo-bluesky-swiss-army';
export function SharedPreferencesTesterScreen() {
    var _this = this;
    var _a = React.useState(''), currentTestOutput = _a[0], setCurrentTestOutput = _a[1];
    return (_jsx(Layout.Screen, { children: _jsx(ScrollView, { contentContainerStyle: { backgroundColor: 'red' }, children: _jsxs(View, { style: [a.flex_1], children: [_jsx(View, { children: _jsx(Text, { testID: "testOutput", children: currentTestOutput }) }), _jsxs(View, { style: [a.flex_wrap], children: [_jsx(Button, { label: "btn", testID: "setStringBtn", style: [a.self_center], variant: "solid", color: "primary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var str;
                                    return __generator(this, function (_a) {
                                        SharedPrefs.removeValue('testerString');
                                        SharedPrefs.setValue('testerString', 'Hello');
                                        str = SharedPrefs.getString('testerString');
                                        console.log(JSON.stringify(str));
                                        setCurrentTestOutput("".concat(str));
                                        return [2 /*return*/];
                                    });
                                }); }, children: _jsx(ButtonText, { children: "Set String" }) }), _jsx(Button, { label: "btn", testID: "removeStringBtn", style: [a.self_center], variant: "solid", color: "primary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var str;
                                    return __generator(this, function (_a) {
                                        SharedPrefs.removeValue('testerString');
                                        str = SharedPrefs.getString('testerString');
                                        setCurrentTestOutput("".concat(str));
                                        return [2 /*return*/];
                                    });
                                }); }, children: _jsx(ButtonText, { children: "Remove String" }) }), _jsx(Button, { label: "btn", testID: "setBoolBtn", style: [a.self_center], variant: "solid", color: "primary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var bool;
                                    return __generator(this, function (_a) {
                                        SharedPrefs.removeValue('testerBool');
                                        SharedPrefs.setValue('testerBool', true);
                                        bool = SharedPrefs.getBool('testerBool');
                                        setCurrentTestOutput("".concat(bool));
                                        return [2 /*return*/];
                                    });
                                }); }, children: _jsx(ButtonText, { children: "Set Bool" }) }), _jsx(Button, { label: "btn", testID: "setNumberBtn", style: [a.self_center], variant: "solid", color: "primary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var num;
                                    return __generator(this, function (_a) {
                                        SharedPrefs.removeValue('testerNumber');
                                        SharedPrefs.setValue('testerNumber', 123);
                                        num = SharedPrefs.getNumber('testerNumber');
                                        setCurrentTestOutput("".concat(num));
                                        return [2 /*return*/];
                                    });
                                }); }, children: _jsx(ButtonText, { children: "Set Number" }) }), _jsx(Button, { label: "btn", testID: "addToSetBtn", style: [a.self_center], variant: "solid", color: "primary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var contains;
                                    return __generator(this, function (_a) {
                                        SharedPrefs.removeFromSet('testerSet', 'Hello!');
                                        SharedPrefs.addToSet('testerSet', 'Hello!');
                                        contains = SharedPrefs.setContains('testerSet', 'Hello!');
                                        setCurrentTestOutput("".concat(contains));
                                        return [2 /*return*/];
                                    });
                                }); }, children: _jsx(ButtonText, { children: "Add to Set" }) }), _jsx(Button, { label: "btn", testID: "removeFromSetBtn", style: [a.self_center], variant: "solid", color: "primary", size: "small", onPress: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var contains;
                                    return __generator(this, function (_a) {
                                        SharedPrefs.removeFromSet('testerSet', 'Hello!');
                                        contains = SharedPrefs.setContains('testerSet', 'Hello!');
                                        setCurrentTestOutput("".concat(contains));
                                        return [2 /*return*/];
                                    });
                                }); }, children: _jsx(ButtonText, { children: "Remove from Set" }) })] })] }) }) }));
}
