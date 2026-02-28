var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { atoms as a } from '#/alf';
import { MessageContextMenu } from '#/components/dms/MessageContextMenu';
export function ActionsWrapper(_a) {
    var message = _a.message, isFromSelf = _a.isFromSelf, children = _a.children;
    var _ = useLingui()._;
    return (_jsx(MessageContextMenu, { message: message, children: function (trigger) {
            // will always be true, since this file is platform split
            return trigger.IS_NATIVE && (_jsx(View, { style: [a.flex_1, a.relative], children: _jsx(View, { style: [
                        { maxWidth: '80%' },
                        isFromSelf
                            ? [a.self_end, a.align_end]
                            : [a.self_start, a.align_start],
                    ], accessible: true, accessibilityActions: [
                        { name: 'activate', label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Open message options"], ["Open message options"])))) },
                    ], onAccessibilityAction: function () { return trigger.control.open('full'); }, children: children }) }));
        } }));
}
var templateObject_1;
