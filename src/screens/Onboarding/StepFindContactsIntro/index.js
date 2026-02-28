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
import { View } from 'react-native';
import * as Contacts from 'expo-contacts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { urls } from '#/lib/constants';
import { useCallOnce } from '#/lib/once';
import { atoms as a } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonText } from '#/components/Button';
import { ContactsHeroImage } from '#/components/contacts/components/HeroImage';
import { InlineLinkText } from '#/components/Link';
import { useAnalytics } from '#/analytics';
import { OnboardingControls, OnboardingDescriptionText, OnboardingPosition, OnboardingTitleText, } from '../Layout';
import { useOnboardingInternalState } from '../state';
export function StepFindContactsIntro() {
    var _this = this;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var dispatch = useOnboardingInternalState().dispatch;
    useCallOnce(function () {
        ax.metric('onboarding:contacts:presented', {});
    })();
    var _a = useQuery({
        queryKey: ['contacts-available'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Contacts.isAvailableAsync()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); },
    }), isAvailable = _a.data, isSuccess = _a.isSuccess;
    return (_jsxs(View, { style: [a.w_full, a.gap_sm], children: [_jsx(OnboardingPosition, {}), _jsx(ContactsHeroImage, {}), _jsx(OnboardingTitleText, { style: [a.mt_sm], children: _jsx(Trans, { children: "Bluesky is more fun with friends" }) }), _jsx(OnboardingDescriptionText, { children: _jsxs(Trans, { children: ["Find your friends on Bluesky by verifying your phone number and matching with your contacts. We protect your information and you control what happens next.", ' ', _jsx(InlineLinkText, { to: urls.website.blog.findFriendsAnnouncement, label: _(msg({
                                message: "Learn more about importing contacts",
                                context: "english-only-resource",
                            })), style: [a.text_md, a.leading_snug], children: _jsx(Trans, { context: "english-only-resource", children: "Learn more" }) })] }) }), !isAvailable && isSuccess && (_jsx(Admonition, { type: "error", children: _jsx(Trans, { children: "Contact sync is not available on this device, as the app is unable to access your contacts." }) })), _jsx(OnboardingControls.Portal, { children: _jsxs(View, { style: [a.gap_md], children: [_jsx(Button, { onPress: function () { return dispatch({ type: 'next' }); }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Import contacts"], ["Import contacts"])))), size: "large", color: "primary", disabled: !isAvailable, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Import contacts" }) }) }), _jsx(Button, { onPress: function () { return dispatch({ type: 'skip-contacts' }); }, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Skip"], ["Skip"])))), size: "large", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) })] }) })] }));
}
var templateObject_1, templateObject_2;
