import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSetThemePrefs } from '#/state/shell';
import { ListContained } from '#/view/screens/Storybook/ListContained';
import { atoms as a, ThemeProvider } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { useDeviceGeolocationApi, useRequestDeviceGeolocation, } from '#/geolocation';
import { Admonitions } from './Admonitions';
import { Breakpoints } from './Breakpoints';
import { Buttons } from './Buttons';
import { Dialogs } from './Dialogs';
import { Forms } from './Forms';
import { Icons } from './Icons';
import { Links } from './Links';
import { Menus } from './Menus';
import { Settings } from './Settings';
import { Shadows } from './Shadows';
import { Spacing } from './Spacing';
import { Theming } from './Theming';
import { Toasts } from './Toasts';
import { Typography } from './Typography';
export default function Storybook() {
    var _a = useSetThemePrefs(), setColorMode = _a.setColorMode, setDarkTheme = _a.setDarkTheme;
    var _b = React.useState(false), showContainedList = _b[0], setShowContainedList = _b[1];
    var navigation = useNavigation();
    var requestDeviceGeolocation = useRequestDeviceGeolocation();
    var setDeviceGeolocation = useDeviceGeolocationApi().setDeviceGeolocation;
    return (_jsx(_Fragment, { children: _jsx(View, { style: [a.p_xl, a.gap_5xl, { paddingBottom: 100 }], children: !showContainedList ? (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, a.align_start, a.gap_md], children: [_jsx(Button, { color: "primary", size: "small", label: 'Set theme to "system"', onPress: function () { return setColorMode('system'); }, children: _jsx(ButtonText, { children: "System" }) }), _jsx(Button, { color: "secondary", size: "small", label: 'Set theme to "light"', onPress: function () { return setColorMode('light'); }, children: _jsx(ButtonText, { children: "Light" }) }), _jsx(Button, { color: "secondary", size: "small", label: 'Set theme to "dim"', onPress: function () {
                                    setColorMode('dark');
                                    setDarkTheme('dim');
                                }, children: _jsx(ButtonText, { children: "Dim" }) }), _jsx(Button, { color: "secondary", size: "small", label: 'Set theme to "dark"', onPress: function () {
                                    setColorMode('dark');
                                    setDarkTheme('dark');
                                }, children: _jsx(ButtonText, { children: "Dark" }) })] }), _jsx(Button, { color: "primary", size: "small", onPress: function () { return navigation.navigate('SharedPreferencesTester'); }, label: "two", testID: "sharedPrefsTestOpenBtn", children: _jsx(ButtonText, { children: "Open Shared Prefs Tester" }) }), _jsx(Button, { color: "primary_subtle", size: "large", onPress: function () {
                            return requestDeviceGeolocation().then(function (req) {
                                if (req.granted && req.location) {
                                    setDeviceGeolocation(req.location);
                                }
                            });
                        }, label: "crash", children: _jsx(ButtonText, { children: "Get GPS Location" }) }), _jsx(ThemeProvider, { theme: "light", children: _jsx(Theming, {}) }), _jsx(ThemeProvider, { theme: "dim", children: _jsx(Theming, {}) }), _jsx(ThemeProvider, { theme: "dark", children: _jsx(Theming, {}) }), _jsx(Toasts, {}), _jsx(Buttons, {}), _jsx(Forms, {}), _jsx(Typography, {}), _jsx(Spacing, {}), _jsx(Shadows, {}), _jsx(Icons, {}), _jsx(Links, {}), _jsx(Dialogs, {}), _jsx(Menus, {}), _jsx(Breakpoints, {}), _jsx(Dialogs, {}), _jsx(Admonitions, {}), _jsx(Settings, {}), _jsx(Button, { color: "primary", size: "large", label: "Switch to Contained List", onPress: function () { return setShowContainedList(true); }, children: _jsx(ButtonText, { children: "Switch to Contained List" }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { color: "primary", size: "large", label: "Switch to Storybook", onPress: function () { return setShowContainedList(false); }, children: _jsx(ButtonText, { children: "Switch to Storybook" }) }), _jsx(ListContained, {})] })) }) }));
}
