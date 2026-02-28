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
import * as Updates from 'expo-updates';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Toast from '#/view/com/util/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { Shapes_Stroke2_Corner0_Rounded as ShapesIcon } from '#/components/icons/Shapes';
import { Loader } from '#/components/Loader';
import * as SettingsList from '../components/SettingsList';
export function OTAInfo() {
    var _this = this;
    var _ = useLingui()._;
    var _a = useQuery({
        queryKey: ['ota-info'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Updates.checkForUpdateAsync()];
                    case 1:
                        status = _a.sent();
                        return [2 /*return*/, status.isAvailable];
                }
            });
        }); },
    }), isAvailable = _a.data, isPendingInfo = _a.isPending, isFetchingInfo = _a.isFetching, isErrorInfo = _a.isError, refetch = _a.refetch;
    var _b = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Updates.fetchUpdateAsync()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Updates.reloadAsync()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            return Toast.show("Failed to update: ".concat(error.message), 'xmark');
        },
    }), fetchAndLaunchUpdate = _b.mutate, isPendingUpdate = _b.isPending;
    if (!Updates.isEnabled || __DEV__) {
        return null;
    }
    return (_jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: ShapesIcon }), _jsx(SettingsList.ItemText, { children: isAvailable ? (_jsx(Trans, { children: "OTA status: Available!" })) : isErrorInfo ? (_jsx(Trans, { children: "OTA status: Error fetching update" })) : isPendingInfo ? (_jsx(Trans, { children: "OTA status: ..." })) : (_jsx(Trans, { children: "OTA status: None available" })) }), _jsx(Button, { label: isAvailable ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Update"], ["Update"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Fetch update"], ["Fetch update"])))), disabled: isFetchingInfo || isPendingUpdate, variant: "solid", size: "small", color: isAvailable ? 'primary' : 'secondary_inverted', onPress: function () {
                    if (isFetchingInfo || isPendingUpdate)
                        return;
                    if (isAvailable) {
                        fetchAndLaunchUpdate();
                    }
                    else {
                        refetch();
                    }
                }, children: isAvailable ? (_jsx(ButtonText, { children: _jsx(Trans, { children: "Update" }) })) : (_jsx(ButtonIcon, { icon: isFetchingInfo ? Loader : RetryIcon })) })] }));
}
var templateObject_1, templateObject_2;
