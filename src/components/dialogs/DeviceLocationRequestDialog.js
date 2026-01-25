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
import { useState } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { wait } from '#/lib/async/wait';
import { isNetworkError, useCleanError } from '#/lib/hooks/useCleanError';
import { logger } from '#/logger';
import { atoms as a, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { PinLocation_Stroke2_Corner0_Rounded as LocationIcon } from '#/components/icons/PinLocation';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import { useRequestDeviceGeolocation } from '#/geolocation';
export function DeviceLocationRequestDialog(_a) {
    var control = _a.control, onLocationAcquired = _a.onLocationAcquired;
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Confirm your location"], ["Confirm your location"])))), style: [web({ maxWidth: 380 })], children: [_jsx(DeviceLocationRequestDialogInner, { onLocationAcquired: onLocationAcquired }), _jsx(Dialog.Close, {})] })] }));
}
function DeviceLocationRequestDialogInner(_a) {
    var _this = this;
    var onLocationAcquired = _a.onLocationAcquired;
    var t = useTheme();
    var _ = useLingui()._;
    var close = Dialog.useDialogContext().close;
    var requestDeviceLocation = useRequestDeviceGeolocation();
    var cleanError = useCleanError();
    var _b = useState(false), isRequesting = _b[0], setIsRequesting = _b[1];
    var _c = useState(''), error = _c[0], setError = _c[1];
    var _d = useState(false), dialogDisabled = _d[0], setDialogDisabled = _d[1];
    var onPressConfirm = function () { return __awaiter(_this, void 0, void 0, function () {
        var req, location_1, e_1, _a, clean, raw;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setError('');
                    setIsRequesting(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, wait(1e3, requestDeviceLocation())];
                case 2:
                    req = _b.sent();
                    if (req.granted) {
                        location_1 = req.location;
                        if (location_1 && location_1.countryCode) {
                            onLocationAcquired === null || onLocationAcquired === void 0 ? void 0 : onLocationAcquired({
                                geolocation: location_1,
                                setDialogError: setError,
                                disableDialogAction: function () { return setDialogDisabled(true); },
                                closeDialog: close,
                            });
                        }
                        else {
                            setError(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to resolve location. Please try again."], ["Failed to resolve location. Please try again."])))));
                        }
                    }
                    else {
                        setError(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Unable to access location. You'll need to visit your system settings to enable location services for Bluesky."], ["Unable to access location. You'll need to visit your system settings to enable location services for Bluesky."])))));
                    }
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _b.sent();
                    _a = cleanError(e_1), clean = _a.clean, raw = _a.raw;
                    setError(clean || raw || e_1.message);
                    if (!isNetworkError(e_1)) {
                        logger.error("blockedGeoOverlay: unexpected error", {
                            safeMessage: e_1.message,
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setIsRequesting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { style: [a.text_xl, a.font_bold], children: _jsx(Trans, { children: "Confirm your location" }) }), _jsxs(View, { style: [a.gap_sm, a.pb_xs], children: [_jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "Tap below to allow Bluesky to access your GPS location. We will then use that data to more accurately determine the content and features available in your region." }) }), _jsx(Text, { style: [
                            a.text_md,
                            a.leading_snug,
                            t.atoms.text_contrast_medium,
                            a.pb_xs,
                        ], children: _jsx(Trans, { children: "Your location data is not tracked and does not leave your device." }) })] }), error && (_jsx(View, { style: [a.pb_xs], children: _jsx(Admonition, { type: "error", children: error }) })), _jsxs(View, { style: [a.gap_sm], children: [!dialogDisabled && (_jsxs(Button, { disabled: isRequesting, label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Allow location access"], ["Allow location access"])))), onPress: onPressConfirm, size: IS_WEB ? 'small' : 'large', color: "primary", children: [_jsx(ButtonIcon, { icon: isRequesting ? Loader : LocationIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Allow location access" }) })] })), !IS_WEB && (_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: function () { return close(); }, size: IS_WEB ? 'small' : 'large', color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }))] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
