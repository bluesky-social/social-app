var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useOnboardingSuggestedStarterPacksQuery } from '#/state/queries/useOnboardingSuggestedStarterPacksQuery';
import { OnboardingControls, OnboardingPosition, OnboardingTitleText, } from '#/screens/Onboarding/Layout';
import { useOnboardingInternalState } from '#/screens/Onboarding/state';
import { atoms as a, useBreakpoints } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon } from '#/components/icons/ArrowRotate';
import { Loader } from '#/components/Loader';
import { StarterPackCard } from './StarterPackCard';
export function StepSuggestedStarterpacks() {
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var moderationOpts = useModerationOpts();
    var _a = useOnboardingInternalState(), state = _a.state, dispatch = _a.dispatch;
    var _b = useOnboardingSuggestedStarterPacksQuery({
        enabled: true,
        overrideInterests: state.interestsStepResults.selectedInterests,
    }), suggestedStarterPacks = _b.data, isLoading = _b.isLoading, isError = _b.isError, isRefetching = _b.isRefetching, refetch = _b.refetch;
    return (_jsxs(View, { style: [a.align_start, a.gap_sm], testID: "onboardingInterests", children: [_jsx(OnboardingPosition, {}), _jsx(OnboardingTitleText, { children: _jsx(Trans, { comment: "Starter packs suggested to the user for them to follow", children: "Find people to follow" }) }), _jsx(View, { style: [
                    a.overflow_hidden,
                    a.flex_1,
                    a.justify_start,
                    a.w_full,
                    a.mt_sm,
                ], children: isLoading || !moderationOpts ? (_jsx(View, { style: [
                        a.flex_1,
                        a.align_center,
                        a.justify_center,
                        { minHeight: 400 },
                    ], children: _jsx(Loader, { size: "xl" }) })) : isError ? (_jsx(View, { style: [a.flex_1, a.px_xl, a.pt_5xl], children: _jsx(Admonition, { type: "error", children: _jsx(Trans, { children: "An error occurred while fetching suggested accounts." }) }) })) : (_jsx(View, { style: [a.flex_1], children: suggestedStarterPacks === null || suggestedStarterPacks === void 0 ? void 0 : suggestedStarterPacks.starterPacks.map(function (starterPack) { return (_jsx(View, { style: [a.pb_lg], children: _jsx(StarterPackCard, { view: starterPack }) }, starterPack.uri)); }) })) }), _jsx(OnboardingControls.Portal, { children: isError ? (_jsxs(View, { style: [a.gap_md, gtMobile ? a.flex_row : a.flex_col], children: [_jsxs(Button, { disabled: isRefetching, color: "secondary", size: "large", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Retry"], ["Retry"])))), onPress: function () { return refetch(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: ArrowRotateCounterClockwiseIcon })] }), _jsx(Button, { color: "secondary", size: "large", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Skip to next step"], ["Skip to next step"])))), onPress: function () { return dispatch({ type: 'next' }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Skip" }) }) })] })) : (_jsx(View, { style: [a.gap_md, gtMobile ? a.flex_row : a.flex_col], children: _jsx(Button, { color: "primary", size: "large", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Continue to next step"], ["Continue to next step"])))), onPress: function () { return dispatch({ type: 'next' }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Continue" }) }) }) })) })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
