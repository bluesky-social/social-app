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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { TID } from '@atproto/common-web';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { RECOMMENDED_SAVED_FEEDS } from '#/lib/constants';
import { useOverwriteSavedFeedsMutation } from '#/state/queries/preferences';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Typography';
/**
 * Explicitly named, since the CTA in this component will overwrite all saved
 * feeds if pressed. It should only be presented to the user if they actually
 * have no other feeds saved.
 */
export function NoSavedFeedsOfAnyType(_a) {
    var _this = this;
    var onAddRecommendedFeeds = _a.onAddRecommendedFeeds;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useOverwriteSavedFeedsMutation(), isPending = _b.isPending, overwriteSavedFeeds = _b.mutateAsync;
    var addRecommendedFeeds = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    onAddRecommendedFeeds === null || onAddRecommendedFeeds === void 0 ? void 0 : onAddRecommendedFeeds();
                    return [4 /*yield*/, overwriteSavedFeeds(RECOMMENDED_SAVED_FEEDS.map(function (f) { return (__assign(__assign({}, f), { id: TID.nextStr() })); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(View, { style: [a.flex_row, a.flex_wrap, a.justify_between, a.p_xl, a.gap_md], children: [_jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_medium, { maxWidth: 310 }], children: _jsx(Trans, { children: "Looks like you haven't saved any feeds! Use our recommendations or browse more below." }) }), _jsxs(Button, { disabled: isPending, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Apply default recommended feeds"], ["Apply default recommended feeds"])))), size: "small", color: "primary_subtle", onPress: addRecommendedFeeds, children: [_jsx(ButtonIcon, { icon: Plus }), _jsx(ButtonText, { children: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Use recommended"], ["Use recommended"])))) })] })] }));
}
var templateObject_1, templateObject_2;
