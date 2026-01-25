var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function useLabelBehaviorDescription(labelValueDef, pref) {
    var _ = useLingui()._;
    if (pref === 'ignore') {
        return _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Off"], ["Off"]))));
    }
    if (labelValueDef.blurs === 'content' || labelValueDef.blurs === 'media') {
        if (pref === 'hide') {
            return _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hide"], ["Hide"]))));
        }
        return _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Warn"], ["Warn"]))));
    }
    else if (labelValueDef.severity === 'alert') {
        if (pref === 'hide') {
            return _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hide"], ["Hide"]))));
        }
        return _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Warn"], ["Warn"]))));
    }
    else if (labelValueDef.severity === 'inform') {
        if (pref === 'hide') {
            return _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Hide"], ["Hide"]))));
        }
        return _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Show badge"], ["Show badge"]))));
    }
    else {
        if (pref === 'hide') {
            return _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Hide"], ["Hide"]))));
        }
        return _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Disabled"], ["Disabled"]))));
    }
}
export function useLabelLongBehaviorDescription(labelValueDef, pref) {
    var _ = useLingui()._;
    if (pref === 'ignore') {
        return _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Disabled"], ["Disabled"]))));
    }
    if (labelValueDef.blurs === 'content') {
        if (pref === 'hide') {
            return _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Warn content and filter from feeds"], ["Warn content and filter from feeds"]))));
        }
        return _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Warn content"], ["Warn content"]))));
    }
    else if (labelValueDef.blurs === 'media') {
        if (pref === 'hide') {
            return _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Blur images and filter from feeds"], ["Blur images and filter from feeds"]))));
        }
        return _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Blur images"], ["Blur images"]))));
    }
    else if (labelValueDef.severity === 'alert') {
        if (pref === 'hide') {
            return _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Show warning and filter from feeds"], ["Show warning and filter from feeds"]))));
        }
        return _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Show warning"], ["Show warning"]))));
    }
    else if (labelValueDef.severity === 'inform') {
        if (pref === 'hide') {
            return _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Show badge and filter from feeds"], ["Show badge and filter from feeds"]))));
        }
        return _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Show badge"], ["Show badge"]))));
    }
    else {
        if (pref === 'hide') {
            return _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Filter from feeds"], ["Filter from feeds"]))));
        }
        return _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Disabled"], ["Disabled"]))));
    }
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20;
