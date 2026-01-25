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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { AppBskyGraphStarterpack, } from '@atproto/api';
import { msg, plural } from '@lingui/macro';
import { STARTER_PACK_MAX_SIZE } from '#/lib/constants';
import * as Toast from '#/view/com/util/Toast';
import * as bsky from '#/types/bsky';
var steps = ['Details', 'Profiles', 'Feeds'];
var StateContext = React.createContext([
    {},
    function (_) { },
]);
StateContext.displayName = 'StarterPackWizardStateContext';
export var useWizardState = function () { return React.useContext(StateContext); };
function reducer(state, action) {
    var _a, _b;
    var updatedState = state;
    // -- Navigation
    var currentIndex = steps.indexOf(state.currentStep);
    if (action.type === 'Next' && state.currentStep !== 'Feeds') {
        updatedState = __assign(__assign({}, state), { currentStep: steps[currentIndex + 1], transitionDirection: 'Forward' });
    }
    else if (action.type === 'Back' && state.currentStep !== 'Details') {
        updatedState = __assign(__assign({}, state), { currentStep: steps[currentIndex - 1], transitionDirection: 'Backward' });
    }
    switch (action.type) {
        case 'SetName':
            updatedState = __assign(__assign({}, state), { name: action.name.slice(0, 50) });
            break;
        case 'SetDescription':
            updatedState = __assign(__assign({}, state), { description: action.description });
            break;
        case 'AddProfile':
            if (state.profiles.length > STARTER_PACK_MAX_SIZE) {
                Toast.show((_a = msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You may only add up to ", ""], ["You may only add up to ", ""])), plural(STARTER_PACK_MAX_SIZE, {
                    other: "".concat(STARTER_PACK_MAX_SIZE, " profiles"),
                })).message) !== null && _a !== void 0 ? _a : '', 'info');
            }
            else {
                updatedState = __assign(__assign({}, state), { profiles: __spreadArray(__spreadArray([], state.profiles, true), [action.profile], false) });
            }
            break;
        case 'RemoveProfile':
            updatedState = __assign(__assign({}, state), { profiles: state.profiles.filter(function (profile) { return profile.did !== action.profileDid; }) });
            break;
        case 'AddFeed':
            if (state.feeds.length >= 3) {
                Toast.show((_b = msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You may only add up to 3 feeds"], ["You may only add up to 3 feeds"]))).message) !== null && _b !== void 0 ? _b : '', 'info');
            }
            else {
                updatedState = __assign(__assign({}, state), { feeds: __spreadArray(__spreadArray([], state.feeds, true), [action.feed], false) });
            }
            break;
        case 'RemoveFeed':
            updatedState = __assign(__assign({}, state), { feeds: state.feeds.filter(function (f) { return f.uri !== action.feedUri; }) });
            break;
        case 'SetProcessing':
            updatedState = __assign(__assign({}, state), { processing: action.processing });
            break;
    }
    return updatedState;
}
export function Provider(_a) {
    var starterPack = _a.starterPack, listItems = _a.listItems, targetProfile = _a.targetProfile, children = _a.children;
    var createInitialState = function () {
        var _a, _b;
        var targetDid = targetProfile === null || targetProfile === void 0 ? void 0 : targetProfile.did;
        if (starterPack &&
            bsky.validate(starterPack.record, AppBskyGraphStarterpack.validateRecord)) {
            return {
                canNext: true,
                currentStep: 'Details',
                name: starterPack.record.name,
                description: starterPack.record.description,
                profiles: (_a = listItems === null || listItems === void 0 ? void 0 : listItems.map(function (i) { return i.subject; })) !== null && _a !== void 0 ? _a : [],
                feeds: (_b = starterPack.feeds) !== null && _b !== void 0 ? _b : [],
                processing: false,
                transitionDirection: 'Forward',
                targetDid: targetDid,
            };
        }
        return {
            canNext: true,
            currentStep: 'Details',
            profiles: [targetProfile],
            feeds: [],
            processing: false,
            transitionDirection: 'Forward',
            targetDid: targetDid,
        };
    };
    var _b = React.useReducer(reducer, null, createInitialState), state = _b[0], dispatch = _b[1];
    return (_jsx(StateContext.Provider, { value: [state, dispatch], children: children }));
}
var templateObject_1, templateObject_2;
