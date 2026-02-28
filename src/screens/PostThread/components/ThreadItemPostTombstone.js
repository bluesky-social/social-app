var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { LINEAR_AVI_WIDTH, OUTER_SPACE } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Text } from '#/components/Typography';
export function ThreadItemPostTombstone(_a) {
    var type = _a.type;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = useMemo(function () {
        switch (type) {
            case 'blocked':
                return { copy: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Post blocked"], ["Post blocked"])))), Icon: PersonXIcon };
            case 'not-found':
            default:
                return { copy: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Post not found"], ["Post not found"])))), Icon: TrashIcon };
        }
    }, [_, type]), copy = _b.copy, Icon = _b.Icon;
    return (_jsx(View, { style: [
            a.mb_xs,
            {
                paddingHorizontal: OUTER_SPACE,
                paddingTop: OUTER_SPACE / 1.2,
            },
        ], children: _jsxs(View, { style: [
                a.flex_row,
                a.align_center,
                a.rounded_sm,
                t.atoms.bg_contrast_25,
                { paddingVertical: OUTER_SPACE / 1.2 },
            ], children: [_jsx(View, { style: [a.flex_row, a.justify_center, { width: LINEAR_AVI_WIDTH }], children: _jsx(Icon, { style: [t.atoms.text_contrast_medium] }) }), _jsx(Text, { style: [a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium], children: copy })] }) }));
}
var templateObject_1, templateObject_2;
