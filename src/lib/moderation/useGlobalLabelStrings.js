var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useMemo } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function useGlobalLabelStrings() {
    var _ = useLingui()._;
    return useMemo(function () { return ({
        '!hide': {
            name: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Content Blocked"], ["Content Blocked"])))),
            description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["This content has been hidden by the moderators."], ["This content has been hidden by the moderators."])))),
        },
        '!warn': {
            name: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Content Warning"], ["Content Warning"])))),
            description: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["This content has received a general warning from moderators."], ["This content has received a general warning from moderators."])))),
        },
        '!no-unauthenticated': {
            name: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Sign-in Required"], ["Sign-in Required"])))),
            description: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["This user has requested that their content only be shown to signed-in users."], ["This user has requested that their content only be shown to signed-in users."])))),
        },
        porn: {
            name: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Adult Content"], ["Adult Content"])))),
            description: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Explicit sexual images."], ["Explicit sexual images."])))),
        },
        sexual: {
            name: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Sexually Suggestive"], ["Sexually Suggestive"])))),
            description: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Does not include nudity."], ["Does not include nudity."])))),
        },
        nudity: {
            name: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Non-sexual Nudity"], ["Non-sexual Nudity"])))),
            description: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["E.g. artistic nudes."], ["E.g. artistic nudes."])))),
        },
        'graphic-media': {
            name: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Graphic Media"], ["Graphic Media"])))),
            description: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Explicit or potentially disturbing media."], ["Explicit or potentially disturbing media."])))),
        },
        gore: {
            name: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Graphic Media"], ["Graphic Media"])))),
            description: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Explicit or potentially disturbing media."], ["Explicit or potentially disturbing media."])))),
        },
    }); }, [_]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;
