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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppBskyGraphStarterpack, } from '@atproto/api';
import { TID } from '@atproto/common-web';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadBlob } from '#/lib/api';
import { BSKY_APP_ACCOUNT_DID, DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED, VIDEO_SAVED_FEED, } from '#/lib/constants';
import { useRequestNotificationsPermission } from '#/lib/notifications/notifications';
import { logger } from '#/logger';
import { useSetHasCheckedForStarterPack } from '#/state/preferences/used-starter-packs';
import { getAllListMembers } from '#/state/queries/list-members';
import { preferencesQueryKey } from '#/state/queries/preferences';
import { RQKEY as profileRQKey } from '#/state/queries/profile';
import { useAgent } from '#/state/session';
import { useOnboardingDispatch } from '#/state/shell';
import { useProgressGuideControls } from '#/state/shell/progress-guide';
import { useActiveStarterPack, useSetActiveStarterPack, } from '#/state/shell/starter-pack';
import { OnboardingControls, OnboardingHeaderSlot, } from '#/screens/Onboarding/Layout';
import { useOnboardingInternalState, } from '#/screens/Onboarding/state';
import { bulkWriteFollows } from '#/screens/Onboarding/util';
import { atoms as a, useBreakpoints } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRight_Stroke2_Corner0_Rounded as ArrowRight } from '#/components/icons/Arrow';
import { Loader } from '#/components/Loader';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import * as bsky from '#/types/bsky';
import { ValuePropositionPager } from './ValuePropositionPager';
export function StepFinished() {
    var _this = this;
    var _a = useOnboardingInternalState(), state = _a.state, dispatch = _a.dispatch;
    var ax = useAnalytics();
    var onboardDispatch = useOnboardingDispatch();
    var _b = useState(false), saving = _b[0], setSaving = _b[1];
    var queryClient = useQueryClient();
    var agent = useAgent();
    var requestNotificationsPermission = useRequestNotificationsPermission();
    var activeStarterPack = useActiveStarterPack();
    var setActiveStarterPack = useSetActiveStarterPack();
    var setHasCheckedForStarterPack = useSetHasCheckedForStarterPack();
    var startProgressGuide = useProgressGuideControls().startProgressGuide;
    var finishOnboarding = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var starterPack, listItems, spRes, e_1, e_2, interestsStepResults, profileStepResults_1, selectedInterests_1, e_3;
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    setSaving(true);
                    if (!(activeStarterPack === null || activeStarterPack === void 0 ? void 0 : activeStarterPack.uri)) return [3 /*break*/, 8];
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, agent.app.bsky.graph.getStarterPack({
                            starterPack: activeStarterPack.uri,
                        })];
                case 2:
                    spRes = _g.sent();
                    starterPack = spRes.data.starterPack;
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _g.sent();
                    logger.error('Failed to fetch starter pack', { safeMessage: e_1 });
                    return [3 /*break*/, 4];
                case 4:
                    _g.trys.push([4, 7, , 8]);
                    if (!(starterPack === null || starterPack === void 0 ? void 0 : starterPack.list)) return [3 /*break*/, 6];
                    return [4 /*yield*/, getAllListMembers(agent, starterPack.list.uri)];
                case 5:
                    listItems = _g.sent();
                    _g.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    e_2 = _g.sent();
                    logger.error('Failed to fetch starter pack list items', {
                        safeMessage: e_2,
                    });
                    return [3 /*break*/, 8];
                case 8:
                    _g.trys.push([8, 10, , 11]);
                    interestsStepResults = state.interestsStepResults, profileStepResults_1 = state.profileStepResults;
                    selectedInterests_1 = interestsStepResults.selectedInterests;
                    return [4 /*yield*/, Promise.all([
                            bulkWriteFollows(agent, __spreadArray([
                                BSKY_APP_ACCOUNT_DID
                            ], ((_a = listItems === null || listItems === void 0 ? void 0 : listItems.map(function (i) { return i.subject.did; })) !== null && _a !== void 0 ? _a : []), true)),
                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                var feedsToSave;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: 
                                        // Interests need to get saved first, then we can write the feeds to prefs
                                        return [4 /*yield*/, agent.setInterestsPref({ tags: selectedInterests_1 })
                                            // Default feeds that every user should have pinned when landing in the app
                                        ];
                                        case 1:
                                            // Interests need to get saved first, then we can write the feeds to prefs
                                            _b.sent();
                                            feedsToSave = [
                                                __assign(__assign({}, DISCOVER_SAVED_FEED), { id: TID.nextStr() }),
                                                __assign(__assign({}, TIMELINE_SAVED_FEED), { id: TID.nextStr() }),
                                                __assign(__assign({}, VIDEO_SAVED_FEED), { id: TID.nextStr() }),
                                            ];
                                            // Any starter pack feeds will be pinned _after_ the defaults
                                            if (starterPack && ((_a = starterPack.feeds) === null || _a === void 0 ? void 0 : _a.length)) {
                                                feedsToSave.push.apply(feedsToSave, starterPack.feeds.map(function (f) { return ({
                                                    type: 'feed',
                                                    value: f.uri,
                                                    pinned: true,
                                                    id: TID.nextStr(),
                                                }); }));
                                            }
                                            return [4 /*yield*/, agent.overwriteSavedFeeds(feedsToSave)];
                                        case 2:
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })(),
                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                var imageUri, imageMime, blobPromise;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            imageUri = profileStepResults_1.imageUri, imageMime = profileStepResults_1.imageMime;
                                            blobPromise = imageUri && imageMime
                                                ? uploadBlob(agent, imageUri, imageMime)
                                                : undefined;
                                            return [4 /*yield*/, agent.upsertProfile(function (existing) { return __awaiter(_this, void 0, void 0, function () {
                                                    var next, res;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0:
                                                                next = existing !== null && existing !== void 0 ? existing : {};
                                                                if (!blobPromise) return [3 /*break*/, 2];
                                                                return [4 /*yield*/, blobPromise];
                                                            case 1:
                                                                res = _a.sent();
                                                                if (res.data.blob) {
                                                                    next.avatar = res.data.blob;
                                                                }
                                                                _a.label = 2;
                                                            case 2:
                                                                if (starterPack) {
                                                                    next.joinedViaStarterPack = {
                                                                        uri: starterPack.uri,
                                                                        cid: starterPack.cid,
                                                                    };
                                                                }
                                                                next.displayName = '';
                                                                if (!next.createdAt) {
                                                                    next.createdAt = new Date().toISOString();
                                                                }
                                                                return [2 /*return*/, next];
                                                        }
                                                    });
                                                }); })];
                                        case 1:
                                            _a.sent();
                                            ax.metric('onboarding:finished:avatarResult', {
                                                avatarResult: profileStepResults_1.isCreatedAvatar
                                                    ? 'created'
                                                    : profileStepResults_1.image
                                                        ? 'uploaded'
                                                        : 'default',
                                            });
                                            return [2 /*return*/];
                                    }
                                });
                            }); })(),
                            requestNotificationsPermission('AfterOnboarding'),
                        ])];
                case 9:
                    _g.sent();
                    return [3 /*break*/, 11];
                case 10:
                    e_3 = _g.sent();
                    logger.info("onboarding: bulk save failed");
                    logger.error(e_3);
                    return [3 /*break*/, 11];
                case 11: 
                // Try to ensure that prefs and profile are up-to-date by the time we render Home.
                return [4 /*yield*/, Promise.all([
                        queryClient.invalidateQueries({
                            queryKey: preferencesQueryKey,
                        }),
                        queryClient.invalidateQueries({
                            queryKey: profileRQKey((_c = (_b = agent.session) === null || _b === void 0 ? void 0 : _b.did) !== null && _c !== void 0 ? _c : ''),
                        }),
                    ]).catch(function (e) {
                        logger.error(e);
                        // Keep going.
                    })];
                case 12:
                    // Try to ensure that prefs and profile are up-to-date by the time we render Home.
                    _g.sent();
                    setSaving(false);
                    setActiveStarterPack(undefined);
                    setHasCheckedForStarterPack(true);
                    startProgressGuide('follow-10');
                    dispatch({ type: 'finish' });
                    onboardDispatch({ type: 'finish' });
                    ax.metric('onboarding:finished:nextPressed', {
                        usedStarterPack: Boolean(starterPack),
                        starterPackName: starterPack &&
                            bsky.dangerousIsType(starterPack.record, AppBskyGraphStarterpack.isRecord)
                            ? starterPack.record.name
                            : undefined,
                        starterPackCreator: starterPack === null || starterPack === void 0 ? void 0 : starterPack.creator.did,
                        starterPackUri: starterPack === null || starterPack === void 0 ? void 0 : starterPack.uri,
                        profilesFollowed: (_d = listItems === null || listItems === void 0 ? void 0 : listItems.length) !== null && _d !== void 0 ? _d : 0,
                        feedsPinned: (_f = (_e = starterPack === null || starterPack === void 0 ? void 0 : starterPack.feeds) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0,
                    });
                    if (starterPack && (listItems === null || listItems === void 0 ? void 0 : listItems.length)) {
                        ax.metric('starterPack:followAll', {
                            logContext: 'Onboarding',
                            starterPack: starterPack.uri,
                            count: listItems === null || listItems === void 0 ? void 0 : listItems.length,
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, [
        ax,
        queryClient,
        agent,
        dispatch,
        onboardDispatch,
        activeStarterPack,
        state,
        requestNotificationsPermission,
        setActiveStarterPack,
        setHasCheckedForStarterPack,
        startProgressGuide,
    ]);
    return (_jsx(ValueProposition, { finishOnboarding: finishOnboarding, saving: saving, state: state }));
}
function ValueProposition(_a) {
    var finishOnboarding = _a.finishOnboarding, saving = _a.saving, state = _a.state;
    var _b = useState(0), subStep = _b[0], setSubStep = _b[1];
    var _ = useLingui()._;
    var ax = useAnalytics();
    var gtMobile = useBreakpoints().gtMobile;
    var onPress = function () {
        if (subStep === 2) {
            finishOnboarding(); // has its own metrics
        }
        else if (subStep === 1) {
            setSubStep(2);
            ax.metric('onboarding:valueProp:stepTwo:nextPressed', {});
        }
        else if (subStep === 0) {
            setSubStep(1);
            ax.metric('onboarding:valueProp:stepOne:nextPressed', {});
        }
    };
    return (_jsxs(_Fragment, { children: [!gtMobile && (_jsx(OnboardingHeaderSlot.Portal, { children: _jsx(Button, { disabled: saving, variant: "ghost", color: "secondary", size: "small", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Skip introduction and start using your account"], ["Skip introduction and start using your account"])))), onPress: function () {
                        ax.metric('onboarding:valueProp:skipPressed', {});
                        finishOnboarding();
                    }, style: [a.bg_transparent], children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) }) })), _jsx(ValuePropositionPager, { step: subStep, setStep: function (ss) { return setSubStep(ss); }, avatarUri: state.profileStepResults.imageUri }), _jsx(OnboardingControls.Portal, { children: _jsxs(View, { style: gtMobile && [a.gap_md, a.flex_row], children: [gtMobile && (IS_WEB ? subStep !== 2 : true) && (_jsx(Button, { disabled: saving, color: "secondary", size: "large", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Skip introduction and start using your account"], ["Skip introduction and start using your account"])))), onPress: function () { return finishOnboarding(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) })), _jsxs(Button, { testID: "onboardingFinish", disabled: saving, color: "primary", size: "large", label: subStep === 2
                                ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Complete onboarding and start using your account"], ["Complete onboarding and start using your account"]))))
                                : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Next"], ["Next"])))), onPress: onPress, children: [_jsx(ButtonText, { children: saving ? (_jsx(Trans, { children: "Finalizing" })) : subStep === 2 ? (_jsx(Trans, { children: "Let's go!" })) : (_jsx(Trans, { children: "Next" })) }), subStep === 2 && (_jsx(ButtonIcon, { icon: saving ? Loader : ArrowRight }))] }, state.activeStep)] }) })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
