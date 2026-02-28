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
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { interests, useInterestsDisplayNames } from '#/lib/interests';
import { capitalize } from '#/lib/strings/capitalize';
import { logger } from '#/logger';
import { OnboardingControls, OnboardingDescriptionText, OnboardingPosition, OnboardingTitleText, } from '#/screens/Onboarding/Layout';
import { useOnboardingInternalState } from '#/screens/Onboarding/state';
import { InterestButton } from '#/screens/Onboarding/StepInterests/InterestButton';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Toggle from '#/components/forms/Toggle';
import { Loader } from '#/components/Loader';
import { useAnalytics } from '#/analytics';
export function StepInterests() {
    var _this = this;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var interestsDisplayNames = useInterestsDisplayNames();
    var _a = useOnboardingInternalState(), state = _a.state, dispatch = _a.dispatch;
    var _b = React.useState(false), saving = _b[0], setSaving = _b[1];
    var _c = React.useState(state.interestsStepResults.selectedInterests.map(function (i) { return i; })), selectedInterests = _c[0], setSelectedInterests = _c[1];
    var saveInterests = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setSaving(true);
            try {
                setSaving(false);
                dispatch({
                    type: 'setInterestsStepResults',
                    selectedInterests: selectedInterests,
                });
                dispatch({ type: 'next' });
                ax.metric('onboarding:interests:nextPressed', {
                    selectedInterests: selectedInterests,
                    selectedInterestsLength: selectedInterests.length,
                });
            }
            catch (e) {
                logger.info("onboading: error saving interests");
                logger.error(e);
            }
            return [2 /*return*/];
        });
    }); }, [ax, selectedInterests, setSaving, dispatch]);
    return (_jsxs(View, { style: [a.align_start, a.gap_sm], testID: "onboardingInterests", children: [_jsx(OnboardingPosition, {}), _jsx(OnboardingTitleText, { children: _jsx(Trans, { children: "What are your interests?" }) }), _jsx(OnboardingDescriptionText, { children: _jsx(Trans, { children: "We'll use this to help customize your experience." }) }), _jsx(View, { style: [a.w_full, a.pt_lg], children: _jsx(Toggle.Group, { values: selectedInterests, onChange: setSelectedInterests, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Select your interests from the options below"], ["Select your interests from the options below"])))), children: _jsx(View, { style: [a.flex_row, a.gap_md, a.flex_wrap], children: interests.map(function (interest) { return (_jsx(Toggle.Item, { name: interest, label: interestsDisplayNames[interest] || capitalize(interest), children: _jsx(InterestButton, { interest: interest }) }, interest)); }) }) }) }), _jsx(OnboardingControls.Portal, { children: _jsxs(Button, { disabled: saving, testID: "onboardingContinue", variant: "solid", color: "primary", size: "large", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Continue to next step"], ["Continue to next step"])))), onPress: saveInterests, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Continue" }) }), saving && _jsx(ButtonIcon, { icon: Loader })] }) })] }));
}
var templateObject_1, templateObject_2;
