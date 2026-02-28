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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import * as persisted from '#/state/persisted';
export var OnboardingScreenSteps = {
    Welcome: 'Welcome',
    RecommendedFeeds: 'RecommendedFeeds',
    RecommendedFollows: 'RecommendedFollows',
    Home: 'Home',
};
var OnboardingStepsArray = Object.values(OnboardingScreenSteps);
var stateContext = React.createContext(compute(persisted.defaults.onboarding));
stateContext.displayName = 'OnboardingStateContext';
var dispatchContext = React.createContext(function (_) { });
dispatchContext.displayName = 'OnboardingDispatchContext';
function reducer(state, action) {
    switch (action.type) {
        case 'set': {
            if (OnboardingStepsArray.includes(action.step)) {
                persisted.write('onboarding', { step: action.step });
                return compute(__assign(__assign({}, state), { step: action.step }));
            }
            return state;
        }
        case 'next': {
            var currentStep = action.currentStep || state.step;
            var nextStep = 'Home';
            if (currentStep === 'Welcome') {
                nextStep = 'RecommendedFeeds';
            }
            else if (currentStep === 'RecommendedFeeds') {
                nextStep = 'RecommendedFollows';
            }
            else if (currentStep === 'RecommendedFollows') {
                nextStep = 'Home';
            }
            persisted.write('onboarding', { step: nextStep });
            return compute(__assign(__assign({}, state), { step: nextStep }));
        }
        case 'start': {
            persisted.write('onboarding', { step: 'Welcome' });
            return compute(__assign(__assign({}, state), { step: 'Welcome' }));
        }
        case 'finish': {
            persisted.write('onboarding', { step: 'Home' });
            return compute(__assign(__assign({}, state), { step: 'Home' }));
        }
        case 'skip': {
            persisted.write('onboarding', { step: 'Home' });
            return compute(__assign(__assign({}, state), { step: 'Home' }));
        }
        default: {
            throw new Error('Invalid action');
        }
    }
}
export function Provider(_a) {
    var children = _a.children;
    var _b = React.useReducer(reducer, compute(persisted.get('onboarding'))), state = _b[0], dispatch = _b[1];
    React.useEffect(function () {
        return persisted.onUpdate('onboarding', function (nextOnboarding) {
            var next = nextOnboarding.step;
            // TODO we've introduced a footgun
            if (state.step !== next) {
                dispatch({
                    type: 'set',
                    step: nextOnboarding.step,
                });
            }
        });
    }, [state, dispatch]);
    return (_jsx(stateContext.Provider, { value: state, children: _jsx(dispatchContext.Provider, { value: dispatch, children: children }) }));
}
export function useOnboardingState() {
    return React.useContext(stateContext);
}
export function useOnboardingDispatch() {
    return React.useContext(dispatchContext);
}
export function isOnboardingActive() {
    return compute(persisted.get('onboarding')).isActive;
}
function compute(state) {
    return __assign(__assign({}, state), { isActive: state.step !== 'Home', isComplete: state.step === 'Home' });
}
