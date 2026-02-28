import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { TouchableWithoutFeedback, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { atoms as a, useTheme } from '#/alf';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useDevMode } from '#/storage/hooks/dev-mode';
/**
 * Internal-use component to display debug information supplied by the appview.
 * The `debug` field only exists on some API views, and is only visible for
 * internal users in dev mode. As such, none of these strings need to be
 * translated.
 *
 * This component can be removed at any time if we don't find it useful.
 */
export function DebugFieldDisplay(_a) {
    var subject = _a.subject;
    var t = useTheme();
    var devMode = useDevMode()[0];
    var prompt = Prompt.usePromptControl();
    if (!devMode)
        return;
    if (!subject.debug)
        return;
    return (_jsxs(_Fragment, { children: [_jsx(Prompt.Basic, { control: prompt, title: "Debug", description: JSON.stringify(subject.debug, null, 2), cancelButtonCta: "Close", confirmButtonCta: "Copy", onConfirm: function () {
                    Clipboard.setStringAsync(JSON.stringify(subject.debug, null, 2));
                    Toast.show('Copied to clipboard', { type: 'success' });
                } }), _jsx(TouchableWithoutFeedback, { accessibilityRole: "button", onPress: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    prompt.open();
                    return false;
                }, children: _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs, a.pt_sm, a.pb_xs], children: [_jsx(View, { style: [a.py_xs, a.px_sm, a.rounded_sm, t.atoms.bg_contrast_25], children: _jsx(Text, { style: [a.font_bold, a.text_xs, t.atoms.text_contrast_medium], children: "Debug" }) }), _jsx(Text, { numberOfLines: 1, style: [
                                a.flex_1,
                                a.text_xs,
                                a.leading_tight,
                                { fontFamily: 'monospace' },
                                t.atoms.text_contrast_low,
                            ], children: JSON.stringify(subject.debug) })] }) })] }));
}
