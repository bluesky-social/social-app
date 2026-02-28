import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useInterestsDisplayNames } from '#/lib/interests';
import { capitalize } from '#/lib/strings/capitalize';
import { atoms as a, native, useTheme } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';
export function InterestButton(_a) {
    var interest = _a.interest;
    var t = useTheme();
    var interestsDisplayNames = useInterestsDisplayNames();
    var ctx = Toggle.useItemContext();
    var styles = React.useMemo(function () {
        var hovered = [
            {
                backgroundColor: t.name === 'light' ? t.palette.contrast_200 : t.palette.contrast_50,
            },
        ];
        var focused = [];
        var pressed = [];
        var selected = [
            {
                backgroundColor: t.palette.contrast_900,
            },
        ];
        var selectedHover = [
            {
                backgroundColor: t.palette.contrast_800,
            },
        ];
        var textSelected = [
            {
                color: t.palette.contrast_100,
            },
        ];
        return {
            hovered: hovered,
            focused: focused,
            pressed: pressed,
            selected: selected,
            selectedHover: selectedHover,
            textSelected: textSelected,
        };
    }, [t]);
    return (_jsx(View, { style: [
            {
                backgroundColor: t.palette.contrast_100,
                paddingVertical: 15,
            },
            a.rounded_full,
            a.px_2xl,
            ctx.hovered ? styles.hovered : {},
            ctx.focused ? styles.hovered : {},
            ctx.pressed ? styles.hovered : {},
            ctx.selected ? styles.selected : {},
            ctx.selected && (ctx.hovered || ctx.focused || ctx.pressed)
                ? styles.selectedHover
                : {},
        ], children: _jsx(Text, { style: [
                {
                    color: t.palette.contrast_900,
                },
                a.font_semi_bold,
                native({ paddingTop: 2 }),
                ctx.selected ? styles.textSelected : {},
            ], children: interestsDisplayNames[interest] || capitalize(interest) }) }));
}
