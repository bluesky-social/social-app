var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useImperativeHandle, useMemo } from 'react';
import { findNodeHandle, View } from 'react-native';
import { interpretLabelValueDefinitions, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { isLabelerSubscribed, lookupLabelValueDefinition } from '#/lib/moderation';
import { List } from '#/view/com/util/List';
import { atoms as a, ios, tokens, useTheme } from '#/alf';
import { Divider } from '#/components/Divider';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { ListFooter } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import { LabelerLabelPreference } from '#/components/moderation/LabelPreference';
import { Text } from '#/components/Typography';
import { IS_IOS, IS_NATIVE } from '#/env';
import { ErrorState } from '../ErrorState';
export function ProfileLabelsSection(_a) {
    var ref = _a.ref, isLabelerLoading = _a.isLabelerLoading, labelerInfo = _a.labelerInfo, labelerError = _a.labelerError, moderationOpts = _a.moderationOpts, scrollElRef = _a.scrollElRef, headerHeight = _a.headerHeight, isFocused = _a.isFocused, setScrollViewTag = _a.setScrollViewTag;
    var t = useTheme();
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
    }, [scrollElRef, headerHeight]);
    useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    useEffect(function () {
        if (IS_IOS && isFocused && scrollElRef.current) {
            var nativeTag = findNodeHandle(scrollElRef.current);
            setScrollViewTag(nativeTag);
        }
    }, [isFocused, scrollElRef, setScrollViewTag]);
    var isSubscribed = labelerInfo
        ? !!isLabelerSubscribed(labelerInfo, moderationOpts)
        : false;
    var labelValues = useMemo(function () {
        if (isLabelerLoading || !labelerInfo || labelerError)
            return [];
        var customDefs = interpretLabelValueDefinitions(labelerInfo);
        return labelerInfo.policies.labelValues
            .filter(function (val, i, arr) { return arr.indexOf(val) === i; }) // dedupe
            .map(function (val) { return lookupLabelValueDefinition(val, customDefs); })
            .filter(function (def) { return def && (def === null || def === void 0 ? void 0 : def.configurable); });
    }, [labelerInfo, labelerError, isLabelerLoading]);
    var numItems = labelValues.length;
    var renderItem = useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        if (!labelerInfo)
            return null;
        return (_jsxs(View, { style: [
                t.atoms.bg_contrast_25,
                index === 0 && [
                    a.overflow_hidden,
                    {
                        borderTopLeftRadius: tokens.borderRadius.md,
                        borderTopRightRadius: tokens.borderRadius.md,
                    },
                ],
                index === numItems - 1 && [
                    a.overflow_hidden,
                    {
                        borderBottomLeftRadius: tokens.borderRadius.md,
                        borderBottomRightRadius: tokens.borderRadius.md,
                    },
                ],
            ], children: [index !== 0 && _jsx(Divider, {}), _jsx(LabelerLabelPreference, { disabled: isSubscribed ? undefined : true, labelDefinition: item, labelerDid: labelerInfo.creator.did })] }));
    }, [labelerInfo, isSubscribed, numItems, t]);
    return (_jsx(View, { children: _jsx(List, { ref: scrollElRef, data: labelValues, renderItem: renderItem, keyExtractor: keyExtractor, contentContainerStyle: a.px_xl, headerOffset: headerHeight, progressViewOffset: ios(0), ListHeaderComponent: _jsx(LabelerListHeader, { isLabelerLoading: isLabelerLoading, labelerInfo: labelerInfo, labelerError: labelerError, hasValues: labelValues.length !== 0, isSubscribed: isSubscribed }), ListFooterComponent: _jsx(ListFooter, { height: headerHeight + 180, style: a.border_transparent }) }) }));
}
function keyExtractor(item) {
    return item.identifier;
}
export function LabelerListHeader(_a) {
    var _b;
    var isLabelerLoading = _a.isLabelerLoading, labelerError = _a.labelerError, labelerInfo = _a.labelerInfo, hasValues = _a.hasValues, isSubscribed = _a.isSubscribed;
    var t = useTheme();
    var _ = useLingui()._;
    if (isLabelerLoading) {
        return (_jsx(View, { style: [a.w_full, a.align_center, a.py_4xl], children: _jsx(Loader, { size: "xl" }) }));
    }
    if (labelerError || !labelerInfo) {
        return (_jsx(View, { style: [a.w_full, a.align_center, a.py_4xl], children: _jsx(ErrorState, { error: (labelerError === null || labelerError === void 0 ? void 0 : labelerError.toString()) ||
                    _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Something went wrong, please try again."], ["Something went wrong, please try again."])))) }) }));
    }
    return (_jsxs(View, { style: [a.py_xl], children: [_jsx(Text, { style: [t.atoms.text_contrast_high, a.leading_snug, a.text_sm], children: _jsx(Trans, { children: "Labels are annotations on users and content. They can be used to hide, warn, and categorize the network." }) }), ((_b = labelerInfo === null || labelerInfo === void 0 ? void 0 : labelerInfo.creator.viewer) === null || _b === void 0 ? void 0 : _b.blocking) ? (_jsxs(View, { style: [a.flex_row, a.gap_sm, a.align_center, a.mt_md], children: [_jsx(CircleInfo, { size: "sm", fill: t.atoms.text_contrast_medium.color }), _jsx(Text, { style: [t.atoms.text_contrast_high, a.leading_snug, a.text_sm], children: _jsx(Trans, { children: "Blocking does not prevent this labeler from placing labels on your account." }) })] })) : null, !hasValues ? (_jsx(Text, { style: [
                    a.pt_xl,
                    t.atoms.text_contrast_high,
                    a.leading_snug,
                    a.text_sm,
                ], children: _jsx(Trans, { children: "This labeler hasn't declared what labels it publishes, and may not be active." }) })) : !isSubscribed ? (_jsx(Text, { style: [
                    a.pt_xl,
                    t.atoms.text_contrast_high,
                    a.leading_snug,
                    a.text_sm,
                ], children: _jsxs(Trans, { children: ["Subscribe to @", labelerInfo.creator.handle, " to use these labels:"] }) })) : null] }));
}
var templateObject_1;
