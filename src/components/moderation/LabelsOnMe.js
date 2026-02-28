var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { useSession } from '#/state/session';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText, } from '#/components/Button';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { LabelsOnMeDialog, useLabelsOnMeDialogControl, } from '#/components/moderation/LabelsOnMeDialog';
export function LabelsOnMe(_a) {
    var type = _a.type, labels = _a.labels, size = _a.size, style = _a.style;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var control = useLabelsOnMeDialogControl();
    if (!labels || !currentAccount) {
        return null;
    }
    labels = labels.filter(function (l) { return !l.val.startsWith('!'); });
    if (!labels.length) {
        return null;
    }
    return (_jsxs(View, { style: [a.flex_row, style], children: [_jsx(LabelsOnMeDialog, { control: control, labels: labels, type: type }), _jsxs(Button, { variant: "solid", color: "secondary", size: size || 'small', label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View information about these labels"], ["View information about these labels"])))), onPress: function () {
                    control.open();
                }, children: [_jsx(ButtonIcon, { position: "left", icon: CircleInfo }), _jsx(ButtonText, { style: [a.leading_snug], children: type === 'account' ? (_jsxs(Trans, { children: [_jsx(Plural, { value: labels.length, one: "# label has", other: "# labels have" }), ' ', "been placed on this account"] })) : (_jsxs(Trans, { children: [_jsx(Plural, { value: labels.length, one: "# label has", other: "# labels have" }), ' ', "been placed on this content"] })) })] })] }));
}
export function LabelsOnMyPost(_a) {
    var post = _a.post, style = _a.style;
    var currentAccount = useSession().currentAccount;
    if (post.author.did !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
        return null;
    }
    return (_jsx(LabelsOnMe, { type: "content", labels: post.labels, size: "tiny", style: style }));
}
var templateObject_1;
