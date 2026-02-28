import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { Trans } from '@lingui/react/macro';
import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH, } from '#/screens/PostThread/const';
import { atoms as a, useTheme } from '#/alf';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Skele from '#/components/Skeleton';
import { Text } from '#/components/Typography';
export function ThreadItemPostNoUnauthenticated(_a) {
    var item = _a.item;
    var t = useTheme();
    return (_jsxs(View, { style: [{ paddingHorizontal: OUTER_SPACE }], children: [_jsx(View, { style: [a.flex_row, { height: 12 }], children: _jsx(View, { style: { width: LINEAR_AVI_WIDTH }, children: item.ui.showParentReplyLine && (_jsx(View, { style: [
                            a.mx_auto,
                            a.flex_1,
                            a.mb_xs,
                            {
                                width: REPLY_LINE_WIDTH,
                                backgroundColor: t.atoms.border_contrast_low.borderColor,
                            },
                        ] })) }) }), _jsxs(Skele.Row, { style: [a.align_center, a.gap_md], children: [_jsx(Skele.Circle, { size: LINEAR_AVI_WIDTH, children: _jsx(LockIcon, { size: "md", fill: t.atoms.text_contrast_medium.color }) }), _jsx(Text, { style: [a.text_md, a.italic, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "This author has chosen to make their posts visible only to people who are signed in." }) })] }), _jsx(View, { style: [
                    a.flex_row,
                    a.justify_center,
                    {
                        height: OUTER_SPACE / 1.5,
                        width: LINEAR_AVI_WIDTH,
                    },
                ], children: item.ui.showChildReplyLine && (_jsx(View, { style: [
                        a.mt_xs,
                        a.h_full,
                        {
                            width: REPLY_LINE_WIDTH,
                            backgroundColor: t.atoms.border_contrast_low.borderColor,
                        },
                    ] })) })] }));
}
