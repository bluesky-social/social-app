var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { TouchableWithoutFeedback, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { CenteredView } from '#/view/com/util/Views';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { ModerationDetailsDialog, useModerationDetailsDialogControl, } from '#/components/moderation/ModerationDetailsDialog';
import { Text } from '#/components/Typography';
export function ScreenHider(_a) {
    var testID = _a.testID, screenDescription = _a.screenDescription, modui = _a.modui, style = _a.style, containerStyle = _a.containerStyle, children = _a.children;
    var t = useTheme();
    var _ = useLingui()._;
    var _b = React.useState(false), override = _b[0], setOverride = _b[1];
    var navigation = useNavigation();
    var isMobile = useWebMediaQueries().isMobile;
    var control = useModerationDetailsDialogControl();
    var blur = modui.blurs[0];
    var desc = useModerationCauseDescription(blur);
    if (!blur || override) {
        return (_jsx(View, { testID: testID, style: style, children: children }));
    }
    var isNoPwi = !!modui.blurs.find(function (cause) {
        return cause.type === 'label' &&
            cause.labelDef.identifier === '!no-unauthenticated';
    });
    return (_jsxs(CenteredView, { style: [
            a.flex_1,
            {
                paddingTop: 100,
                paddingBottom: 150,
            },
            t.atoms.bg,
            containerStyle,
        ], sideBorders: true, children: [_jsx(View, { style: [a.align_center, a.mb_md], children: _jsx(View, { style: [
                        t.atoms.bg_contrast_975,
                        a.align_center,
                        a.justify_center,
                        {
                            borderRadius: 25,
                            width: 50,
                            height: 50,
                        },
                    ], children: _jsx(desc.icon, { width: 24, fill: t.atoms.bg.backgroundColor }) }) }), _jsx(Text, { style: [
                    a.text_4xl,
                    a.font_semi_bold,
                    a.text_center,
                    a.mb_md,
                    t.atoms.text,
                ], children: isNoPwi ? (_jsx(Trans, { children: "Sign-in Required" })) : (_jsx(Trans, { children: "Content Warning" })) }), _jsxs(Text, { style: [
                    a.text_lg,
                    a.mb_md,
                    a.px_lg,
                    a.text_center,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                ], children: [isNoPwi ? (_jsx(Trans, { children: "This account has requested that users sign in to view their profile." })) : (_jsxs(_Fragment, { children: [_jsxs(Trans, { children: ["This ", screenDescription, " has been flagged:"] }), ' ', _jsxs(Text, { style: [
                                    a.text_lg,
                                    a.font_semi_bold,
                                    a.leading_snug,
                                    t.atoms.text,
                                    a.ml_xs,
                                ], children: [desc.name, ".", ' '] }), _jsx(TouchableWithoutFeedback, { onPress: function () {
                                    control.open();
                                }, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Learn more about this warning"], ["Learn more about this warning"])))), accessibilityHint: "", children: _jsx(Text, { style: [
                                        a.text_lg,
                                        a.leading_snug,
                                        {
                                            color: t.palette.primary_500,
                                        },
                                        web({
                                            cursor: 'pointer',
                                        }),
                                    ], children: _jsx(Trans, { children: "Learn More" }) }) }), _jsx(ModerationDetailsDialog, { control: control, modcause: blur })] })), ' '] }), isMobile && _jsx(View, { style: a.flex_1 }), _jsxs(View, { style: [a.flex_row, a.justify_center, a.my_md, a.gap_md], children: [_jsx(Button, { variant: "solid", color: "primary", size: "large", style: [a.rounded_full], label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Go back"], ["Go back"])))), onPress: function () {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            }
                            else {
                                navigation.navigate('Home');
                            }
                        }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Go back" }) }) }), !modui.noOverride && (_jsx(Button, { variant: "solid", color: "secondary", size: "large", style: [a.rounded_full], label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Show anyway"], ["Show anyway"])))), onPress: function () { return setOverride(function (v) { return !v; }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Show anyway" }) }) }))] })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
