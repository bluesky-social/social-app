var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useMemo } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function useAgeAssuranceCopy() {
    var _ = useLingui()._;
    return useMemo(function () {
        return {
            notice: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult."], ["Due to laws in your region, certain features on Bluesky are currently restricted until you're able to verify you're an adult."])))),
            banner: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["The laws in your location require you to verify you're an adult to access certain features. Tap to learn more."], ["The laws in your location require you to verify you're an adult to access certain features. Tap to learn more."])))),
            chatsInfoText: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult."], ["Don't worry! All existing messages and settings are saved and will be available after you verify you're an adult."])))),
        };
    }, [_]);
}
var templateObject_1, templateObject_2, templateObject_3;
