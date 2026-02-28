import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { Trans } from '@lingui/react/macro';
import { atoms as a, useTheme } from '#/alf';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as Skele from '#/components/Skeleton';
import { Text } from '#/components/Typography';
export function ThreadItemAnchorNoUnauthenticated() {
    var t = useTheme();
    return (_jsxs(View, { style: [a.p_lg, a.gap_md], children: [_jsxs(Skele.Row, { style: [a.align_center, a.gap_md], children: [_jsx(Skele.Circle, { size: 42, children: _jsx(LockIcon, { size: "md", fill: t.atoms.text_contrast_medium.color }) }), _jsxs(Skele.Col, { children: [_jsx(Skele.Text, { style: [a.text_lg, { width: '20%' }] }), _jsx(Skele.Text, { blend: true, style: [a.text_md, { width: '40%' }] })] })] }), _jsx(View, { style: [a.py_sm], children: _jsx(Text, { style: [a.text_xl, a.italic, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "This author has chosen to make their posts visible only to people who are signed in." }) }) })] }));
}
