import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useReducer } from 'react';
import { View } from 'react-native';
import * as bcp47Match from 'bcp-47-match';
import { useEnableKeyboardControllerScreen } from '#/lib/hooks/useEnableKeyboardController';
import { useLanguagePrefs } from '#/state/preferences';
import { Layout, OnboardingControls, OnboardingHeaderSlot, } from '#/screens/Onboarding/Layout';
import { Context, createInitialOnboardingState, reducer, } from '#/screens/Onboarding/state';
import { StepFinished } from '#/screens/Onboarding/StepFinished';
import { StepInterests } from '#/screens/Onboarding/StepInterests';
import { StepProfile } from '#/screens/Onboarding/StepProfile';
import { atoms as a, useTheme } from '#/alf';
import { useIsFindContactsFeatureEnabledBasedOnGeolocation } from '#/components/contacts/country-allowlist';
import { useFindContactsFlowState } from '#/components/contacts/state';
import { Portal } from '#/components/Portal';
import { ScreenTransition } from '#/components/ScreenTransition';
import { useAnalytics } from '#/analytics';
import { ENV, IS_NATIVE } from '#/env';
import { StepFindContacts } from './StepFindContacts';
import { StepFindContactsIntro } from './StepFindContactsIntro';
import { StepSuggestedAccounts } from './StepSuggestedAccounts';
import { StepSuggestedStarterpacks } from './StepSuggestedStarterpacks';
export function Onboarding() {
    var t = useTheme();
    var ax = useAnalytics();
    var contentLanguages = useLanguagePrefs().contentLanguages;
    var probablySpeaksEnglish = useMemo(function () {
        if (contentLanguages.length === 0)
            return true;
        return bcp47Match.basicFilter('en', contentLanguages).length > 0;
    }, [contentLanguages]);
    // starter packs screen is currently geared towards english-speaking accounts
    var showSuggestedStarterpacks = ENV !== 'e2e' && probablySpeaksEnglish;
    var findContactsEnabled = useIsFindContactsFeatureEnabledBasedOnGeolocation();
    var showFindContacts = ENV !== 'e2e' &&
        IS_NATIVE &&
        findContactsEnabled &&
        !ax.features.enabled(ax.features.ImportContactsOnboardingDisable);
    var _a = useReducer(reducer, {
        starterPacksStepEnabled: showSuggestedStarterpacks,
        findContactsStepEnabled: showFindContacts,
    }, createInitialOnboardingState), state = _a[0], dispatch = _a[1];
    var _b = useFindContactsFlowState(), contactsFlowState = _b[0], contactsFlowDispatch = _b[1];
    useEnableKeyboardControllerScreen(true);
    return (_jsx(Portal, { children: _jsx(View, { style: [a.absolute, a.inset_0, t.atoms.bg], children: _jsx(OnboardingControls.Provider, { children: _jsx(OnboardingHeaderSlot.Provider, { children: _jsx(Context.Provider, { value: useMemo(function () { return ({ state: state, dispatch: dispatch }); }, [state, dispatch]), children: _jsx(ScreenTransition, { direction: state.stepTransitionDirection, style: a.flex_1, children: state.activeStep === 'find-contacts' ? (_jsx(StepFindContacts, { flowState: contactsFlowState, flowDispatch: contactsFlowDispatch })) : (_jsxs(Layout, { children: [state.activeStep === 'profile' && _jsx(StepProfile, {}), state.activeStep === 'interests' && _jsx(StepInterests, {}), state.activeStep === 'suggested-accounts' && (_jsx(StepSuggestedAccounts, {})), state.activeStep === 'suggested-starterpacks' && (_jsx(StepSuggestedStarterpacks, {})), state.activeStep === 'find-contacts-intro' && (_jsx(StepFindContactsIntro, {})), state.activeStep === 'finished' && _jsx(StepFinished, {})] })) }, state.activeStep) }) }) }) }) }));
}
