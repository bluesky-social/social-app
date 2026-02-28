var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useLayoutEffect, useState } from 'react';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { usePreventRemove } from '@react-navigation/native';
import { useSetMinimalShellMode } from '#/state/shell';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { FindContactsFlow } from '#/components/contacts/FindContactsFlow';
import { useFindContactsFlowState } from '#/components/contacts/state';
import * as Layout from '#/components/Layout';
import { ScreenTransition } from '#/components/ScreenTransition';
import { IS_NATIVE } from '#/env';
export function FindContactsFlowScreen(_a) {
    var navigation = _a.navigation;
    var _ = useLingui()._;
    var _b = useFindContactsFlowState(), state = _b[0], dispatch = _b[1];
    var _c = useState('Forward'), transitionDirection = _c[0], setTransitionDirection = _c[1];
    var overrideGoBack = state.step === '2: verify number';
    usePreventRemove(overrideGoBack, function () {
        setTransitionDirection('Backward');
        dispatch({ type: 'BACK' });
        setTimeout(function () {
            setTransitionDirection('Forward');
        });
    });
    var setMinimalShellMode = useSetMinimalShellMode();
    var effect = useCallback(function () {
        setMinimalShellMode(true);
        return function () { return setMinimalShellMode(false); };
    }, [setMinimalShellMode]);
    useLayoutEffect(effect);
    return (_jsx(Layout.Screen, { children: IS_NATIVE ? (_jsx(LayoutAnimationConfig, { skipEntering: true, skipExiting: true, children: _jsx(ScreenTransition, { direction: transitionDirection, children: _jsx(FindContactsFlow, { state: state, dispatch: dispatch, onCancel: function () {
                        return navigation.canGoBack()
                            ? navigation.goBack()
                            : navigation.navigate('FindContactsFlow', undefined, {
                                pop: true,
                            });
                    }, context: "Standalone" }) }, state.step) })) : (_jsx(ErrorScreen, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Not available on this platform."], ["Not available on this platform."])))), message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please use the native app to sync your contacts."], ["Please use the native app to sync your contacts."])))), showHeader: true })) }));
}
var templateObject_1, templateObject_2;
