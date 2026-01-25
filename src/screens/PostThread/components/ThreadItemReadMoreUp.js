var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH, } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { ArrowTopCircle_Stroke2_Corner0_Rounded as UpIcon } from '#/components/icons/ArrowTopCircle';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
export var ThreadItemReadMoreUp = memo(function ThreadItemReadMoreUp(_a) {
    var item = _a.item;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Continue thread"], ["Continue thread"])))), to: item.href, style: [
            a.gap_xs,
            {
                paddingTop: OUTER_SPACE,
                paddingHorizontal: OUTER_SPACE,
            },
        ], children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            var interacted = hovered || pressed;
            return (_jsxs(View, { children: [_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(View, { style: [
                                    a.align_center,
                                    {
                                        width: LINEAR_AVI_WIDTH,
                                    },
                                ], children: _jsx(UpIcon, { fill: interacted
                                        ? t.atoms.text_contrast_high.color
                                        : t.atoms.text_contrast_low.color, width: 24 }) }), _jsx(Text, { style: [
                                    a.text_sm,
                                    t.atoms.text_contrast_medium,
                                    interacted && [a.underline],
                                ], children: _jsx(Trans, { children: "Continue thread..." }) })] }), _jsx(View, { style: [
                            a.align_center,
                            {
                                width: LINEAR_AVI_WIDTH,
                            },
                        ], children: _jsx(View, { style: [
                                a.mt_xs,
                                {
                                    height: OUTER_SPACE / 2,
                                    width: REPLY_LINE_WIDTH,
                                    backgroundColor: t.atoms.border_contrast_low.borderColor,
                                },
                            ] }) })] }));
        } }));
});
var templateObject_1;
