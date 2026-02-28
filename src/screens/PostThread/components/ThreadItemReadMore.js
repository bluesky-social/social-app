var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { LINEAR_AVI_WIDTH, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT, } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { CirclePlus_Stroke2_Corner0_Rounded as CirclePlus } from '#/components/icons/CirclePlus';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
export var ThreadItemReadMore = memo(function ThreadItemReadMore(_a) {
    var item = _a.item, view = _a.view;
    var t = useTheme();
    var _ = useLingui()._;
    var isTreeView = view === 'tree';
    var indent = Math.max(0, item.depth - 1);
    var spacers = isTreeView
        ? Array.from(Array(indent)).map(function (_, n) {
            var isSkipped = item.skippedIndentIndices.has(n);
            return (_jsx(View, { style: [
                    t.atoms.border_contrast_low,
                    {
                        borderRightWidth: isSkipped ? 0 : REPLY_LINE_WIDTH,
                        width: TREE_INDENT + TREE_AVI_WIDTH / 2,
                        left: 1,
                    },
                ] }, "".concat(item.key, "-padding-").concat(n)));
        })
        : null;
    return (_jsxs(View, { style: [a.flex_row], children: [spacers, _jsx(View, { style: [
                    t.atoms.border_contrast_low,
                    {
                        marginLeft: isTreeView
                            ? TREE_INDENT + TREE_AVI_WIDTH / 2 - 1
                            : (LINEAR_AVI_WIDTH - REPLY_LINE_WIDTH) / 2 + 16,
                        borderLeftWidth: 2,
                        borderBottomWidth: 2,
                        borderBottomLeftRadius: a.rounded_sm.borderRadius,
                        height: 18, // magic, Link below is 38px tall
                        width: isTreeView ? TREE_INDENT : LINEAR_AVI_WIDTH / 2 + 10,
                    },
                ] }), _jsx(Link, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Read more replies"], ["Read more replies"])))), to: item.href, style: [a.pt_sm, a.pb_md, a.gap_xs], children: function (_a) {
                    var hovered = _a.hovered, pressed = _a.pressed;
                    var interacted = hovered || pressed;
                    return (_jsxs(_Fragment, { children: [_jsx(CirclePlus, { fill: interacted
                                    ? t.atoms.text_contrast_high.color
                                    : t.atoms.text_contrast_low.color, width: 18 }), _jsx(Text, { style: [
                                    a.text_sm,
                                    t.atoms.text_contrast_medium,
                                    interacted && a.underline,
                                ], children: _jsxs(Trans, { children: ["Read", ' ', _jsx(Plural, { one: "# more reply", other: "# more replies", value: item.moreReplies })] }) })] }));
                } })] }));
});
var templateObject_1;
