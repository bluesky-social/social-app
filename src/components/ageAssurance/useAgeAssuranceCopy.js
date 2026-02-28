var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useAgeAssurance } from '#/ageAssurance';
export function useAgeAssuranceCopy() {
    var _ = useLingui()._;
    var aa = useAgeAssurance();
    var hasCompletedFlow = aa.state.status === aa.Status.Assured;
    return useMemo(function () {
        return {
            notice: hasCompletedFlow
                ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You have completed the Age Assurance process, but based on the results, we cannot be sure that you are 18 years of age or older. Due to laws in your region, certain features on Bluesky must remain restricted until you're able to verify you're an adult."], ["You have completed the Age Assurance process, but based on the results, we cannot be sure that you are 18 years of age or older. Due to laws in your region, certain features on Bluesky must remain restricted until you're able to verify you're an adult."]))))
                : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult."], ["Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult."])))),
            banner: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["The laws in your region require you to verify you're an adult to access certain features. Tap to learn more."], ["The laws in your region require you to verify you're an adult to access certain features. Tap to learn more."])))),
            chatsInfoText: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult."], ["Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult."])))),
        };
    }, [_, hasCompletedFlow]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
