import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pressable, View } from 'react-native';
import { show as deprecatedShow } from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Globe_Stroke2_Corner0_Rounded as GlobeIcon } from '#/components/icons/Globe';
import * as Toast from '#/components/Toast';
import { H1 } from '#/components/Typography';
function DefaultToast(_a) {
    var content = _a.content, _b = _a.type, type = _b === void 0 ? 'default' : _b;
    return (_jsx(Toast.ToastConfigProvider, { id: "default-toast", type: type, children: _jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, { icon: GlobeIcon }), _jsx(Toast.Text, { children: content })] }) }));
}
function ToastWithAction() {
    return (_jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, { icon: GlobeIcon }), _jsx(Toast.Text, { children: "This toast has an action button" }), _jsx(Toast.Action, { label: "Action", onPress: function () { return console.log('Action clicked!'); }, children: "Action" })] }));
}
function LongToastWithAction() {
    return (_jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, { icon: GlobeIcon }), _jsx(Toast.Text, { children: "This is a longer message to test how the toast handles multiple lines of text content." }), _jsx(Toast.Action, { label: "Action", onPress: function () { return console.log('Action clicked!'); }, children: "Action" })] }));
}
export function Toasts() {
    return (_jsxs(View, { style: [a.gap_md], children: [_jsx(H1, { children: "Toast Examples" }), _jsxs(View, { style: [a.gap_md], children: [_jsx(Pressable, { accessibilityRole: "button", onPress: function () { return Toast.show(_jsx(ToastWithAction, {}), { type: 'success' }); }, children: _jsx(ToastWithAction, {}) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () { return Toast.show(_jsx(ToastWithAction, {}), { type: 'error' }); }, children: _jsx(ToastWithAction, {}) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () { return Toast.show(_jsx(LongToastWithAction, {})); }, children: _jsx(LongToastWithAction, {}) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () { return Toast.show("Hey I'm a toast!"); }, children: _jsx(DefaultToast, { content: "Hey I'm a toast!" }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return Toast.show("This toast will disappear after 6 seconds", {
                                duration: 6e3,
                            });
                        }, children: _jsx(DefaultToast, { content: "This toast will disappear after 6 seconds" }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return Toast.show("This is a longer message to test how the toast handles multiple lines of text content.");
                        }, children: _jsx(DefaultToast, { content: "This is a longer message to test how the toast handles multiple lines of text content." }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return Toast.show("Success! Yayyyyyyy :)", {
                                type: 'success',
                            });
                        }, children: _jsx(DefaultToast, { content: "Success! Yayyyyyyy :)", type: "success" }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return Toast.show("I'm providing info!", {
                                type: 'info',
                            });
                        }, children: _jsx(DefaultToast, { content: "I'm providing info!", type: "info" }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return Toast.show("This is a warning toast", {
                                type: 'warning',
                            });
                        }, children: _jsx(DefaultToast, { content: "This is a warning toast", type: "warning" }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return Toast.show("This is an error toast :(", {
                                type: 'error',
                            });
                        }, children: _jsx(DefaultToast, { content: "This is an error toast :(", type: "error" }) }), _jsx(Pressable, { accessibilityRole: "button", onPress: function () {
                            return deprecatedShow("This is a test of the deprecated API", 'exclamation-circle');
                        }, children: _jsx(DefaultToast, { content: "This is a test of the deprecated API", type: "warning" }) })] })] }));
}
