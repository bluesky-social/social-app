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
import { createContext, useContext, useMemo } from 'react';
import { logger } from '#/logger';
export function createInitialOnboardingState(_a) {
    var _b = _a === void 0 ? { starterPacksStepEnabled: true, findContactsStepEnabled: false } : _a, starterPacksStepEnabled = _b.starterPacksStepEnabled, findContactsStepEnabled = _b.findContactsStepEnabled;
    var screens = {
        profile: true,
        interests: true,
        'suggested-accounts': true,
        'suggested-starterpacks': starterPacksStepEnabled,
        'find-contacts-intro': findContactsStepEnabled,
        'find-contacts': findContactsStepEnabled,
        finished: true,
    };
    return {
        screens: screens,
        activeStep: 'profile',
        stepTransitionDirection: 'Forward',
        interestsStepResults: {
            selectedInterests: [],
        },
        profileStepResults: {
            isCreatedAvatar: false,
            image: undefined,
            imageUri: '',
            imageMime: '',
        },
    };
}
export var Context = createContext(null);
Context.displayName = 'OnboardingContext';
export function reducer(s, a) {
    var _a;
    var next = __assign({}, s);
    var stepOrder = getStepOrder(s);
    switch (a.type) {
        case 'next': {
            var nextIndex = stepOrder.indexOf(next.activeStep) + 1;
            var nextStep = stepOrder[nextIndex];
            if (nextStep) {
                next.activeStep = nextStep;
            }
            next.stepTransitionDirection = 'Forward';
            break;
        }
        case 'prev': {
            var prevIndex = stepOrder.indexOf(next.activeStep) - 1;
            var prevStep = stepOrder[prevIndex];
            if (prevStep) {
                next.activeStep = prevStep;
            }
            next.stepTransitionDirection = 'Backward';
            break;
        }
        case 'skip-contacts': {
            var nextIndex = stepOrder.indexOf('find-contacts') + 1;
            var nextStep = (_a = stepOrder[nextIndex]) !== null && _a !== void 0 ? _a : 'finished';
            next.activeStep = nextStep;
            next.stepTransitionDirection = 'Forward';
            break;
        }
        case 'finish': {
            next = createInitialOnboardingState({
                starterPacksStepEnabled: s.screens['suggested-starterpacks'],
                findContactsStepEnabled: s.screens['find-contacts'],
            });
            break;
        }
        case 'setInterestsStepResults': {
            next.interestsStepResults = {
                selectedInterests: a.selectedInterests,
            };
            break;
        }
        case 'setProfileStepResults': {
            next.profileStepResults = {
                isCreatedAvatar: a.isCreatedAvatar,
                image: a.image,
                imageUri: a.imageUri,
                imageMime: a.imageMime,
                creatorState: a.creatorState,
            };
            break;
        }
    }
    var state = __assign(__assign({}, next), { hasPrev: next.activeStep !== 'profile' });
    logger.debug("onboarding", {
        hasPrev: state.hasPrev,
        activeStep: state.activeStep,
        interestsStepResults: {
            selectedInterests: state.interestsStepResults.selectedInterests,
        },
        profileStepResults: state.profileStepResults,
    });
    if (s.activeStep !== state.activeStep) {
        logger.debug("onboarding: step changed", { activeStep: state.activeStep });
    }
    return state;
}
function getStepOrder(s) {
    return [
        s.screens.profile && 'profile',
        s.screens.interests && 'interests',
        s.screens['suggested-accounts'] && 'suggested-accounts',
        s.screens['suggested-starterpacks'] && 'suggested-starterpacks',
        s.screens['find-contacts-intro'] && 'find-contacts-intro',
        s.screens['find-contacts'] && 'find-contacts',
        s.screens.finished && 'finished',
    ].filter(function (x) { return !!x; });
}
/**
 * Note: not to be confused with `useOnboardingState`, which just determines if onboarding is active.
 * This hook is for internal state of the onboarding flow (i.e. active step etc).
 *
 * This adds additional derived state to the onboarding context reducer.
 */
export function useOnboardingInternalState() {
    var ctx = useContext(Context);
    if (!ctx) {
        throw new Error('useOnboardingInternalState must be used within OnboardingContext');
    }
    var state = ctx.state, dispatch = ctx.dispatch;
    return {
        state: useMemo(function () {
            var stepOrder = getStepOrder(state).filter(function (x) { return x !== 'find-contacts' && x !== 'finished'; });
            var canGoBack = state.activeStep !== stepOrder[0];
            return __assign(__assign({}, state), { canGoBack: canGoBack, 
                /**
                 * Note: for *display* purposes only, do not lean on this
                 * for navigation purposes! we merge certain steps!
                 */
                activeStepIndex: stepOrder.indexOf(state.activeStep === 'find-contacts'
                    ? 'find-contacts-intro'
                    : state.activeStep), totalSteps: stepOrder.length });
        }, [state]),
        dispatch: dispatch,
    };
}
