import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallOnce } from '#/lib/once';
import { FindContactsFlow } from '#/components/contacts/FindContactsFlow';
import { ScreenTransition } from '#/components/ScreenTransition';
import { useAnalytics } from '#/analytics';
import { useOnboardingInternalState } from '../state';
export function StepFindContacts(_a) {
    var flowState = _a.flowState, flowDispatch = _a.flowDispatch;
    var dispatch = useOnboardingInternalState().dispatch;
    var ax = useAnalytics();
    useCallOnce(function () {
        ax.metric('onboarding:contacts:begin', {});
    })();
    var _b = useState('Forward'), transitionDirection = _b[0], setTransitionDirection = _b[1];
    var isFinalStep = flowState.step === '4: view matches';
    var onSkip = useCallback(function () {
        if (!isFinalStep) {
            ax.metric('onboarding:contacts:skipPressed', {});
        }
        dispatch({ type: 'next' });
    }, [dispatch, isFinalStep, ax]);
    var canGoBack = flowState.step === '2: verify number';
    var onBack = useCallback(function () {
        if (canGoBack) {
            setTransitionDirection('Backward');
            flowDispatch({ type: 'BACK' });
            setTimeout(function () {
                setTransitionDirection('Forward');
            });
        }
        else {
            dispatch({ type: 'prev' });
        }
    }, [dispatch, flowDispatch, canGoBack]);
    return (_jsx(SafeAreaView, { edges: ['left', 'top', 'right'], children: _jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: _jsx(ScreenTransition, { direction: transitionDirection, children: _jsx(FindContactsFlow, { context: "Onboarding", state: flowState, dispatch: flowDispatch, onCancel: onSkip, onBack: onBack }) }, flowState.step) }) }));
}
