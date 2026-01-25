var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { LayoutAnimation } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_10 } from '#/lib/constants';
import { atoms as a, flatten, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { Text } from '#/components/Typography';
export function ShowMoreTextButton(_a) {
    var onPressProp = _a.onPress, style = _a.style;
    var t = useTheme();
    var _ = useLingui()._;
    var onPress = useCallback(function () {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onPressProp();
    }, [onPressProp]);
    var textStyle = useMemo(function () {
        return flatten([a.leading_snug, a.text_sm, style]);
    }, [style]);
    return (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Expand post text"], ["Expand post text"])))), onPress: onPress, style: [
            a.self_start,
            {
                paddingBottom: textStyle.fontSize / 3,
            },
        ], hitSlop: HITSLOP_10, children: function (_a) {
            var pressed = _a.pressed, hovered = _a.hovered;
            return (_jsx(Text, { style: [
                    textStyle,
                    {
                        color: t.palette.primary_500,
                        opacity: pressed ? 0.6 : 1,
                        textDecorationLine: hovered ? 'underline' : undefined,
                    },
                ], children: _jsx(Trans, { children: "Show More" }) }));
        } }));
}
var templateObject_1;
