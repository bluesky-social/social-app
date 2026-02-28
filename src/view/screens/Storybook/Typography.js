import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { atoms as a } from '#/alf';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
export function Typography() {
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(Text, { selectable: true, style: [a.text_5xl], children: "atoms.text_5xl" }), _jsx(Text, { style: [a.text_4xl], children: "atoms.text_4xl" }), _jsx(Text, { style: [a.text_3xl], children: "atoms.text_3xl" }), _jsx(Text, { style: [a.text_2xl], children: "atoms.text_2xl" }), _jsx(Text, { style: [a.text_xl], children: "atoms.text_xl" }), _jsx(Text, { style: [a.text_lg], children: "atoms.text_lg" }), _jsx(Text, { style: [a.text_md], children: "atoms.text_md" }), _jsx(Text, { style: [a.text_sm], children: "atoms.text_sm" }), _jsx(Text, { style: [a.text_xs], children: "atoms.text_xs" }), _jsx(Text, { style: [a.text_2xs], children: "atoms.text_2xs" }), _jsx(Text, { style: [a.text_xl], children: "This is regular text" }), _jsx(Text, { style: [a.text_xl, a.italic], children: "This is regular italic text" }), _jsx(Text, { style: [a.text_xl, a.font_medium], children: "This is medium text" }), _jsx(Text, { style: [a.text_xl, a.font_medium, a.italic], children: "This is medium italic text" }), _jsx(Text, { style: [a.text_xl, a.font_semi_bold], children: "This is bold text" }), _jsx(Text, { style: [a.text_xl, a.font_semi_bold, a.italic], children: "This is bold italic text" }), _jsx(Text, { style: [a.text_xl, a.font_bold], children: "This is heavy text" }), _jsx(Text, { style: [a.text_xl, a.font_bold, a.italic], children: "This is heavy italic text" }), _jsx(RichText
            // TODO: This only supports already resolved facets.
            // Resolving them on read is bad anyway.
            , { 
                // TODO: This only supports already resolved facets.
                // Resolving them on read is bad anyway.
                value: "This is rich text. It can have mentions like @bsky.app or links like https://bsky.social" }), _jsx(RichText, { selectable: true, 
                // TODO: This only supports already resolved facets.
                // Resolving them on read is bad anyway.
                value: "This is rich text. It can have mentions like @bsky.app or links like https://bsky.social", style: [a.text_xl] })] }));
}
