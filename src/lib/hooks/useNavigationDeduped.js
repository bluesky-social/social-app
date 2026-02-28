import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/core';
import { useDedupe } from '#/lib/hooks/useDedupe';
export function useNavigationDeduped() {
    var navigation = useNavigation();
    var dedupe = useDedupe();
    return useMemo(function () { return ({
        push: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            dedupe(function () { return navigation.push.apply(navigation, args); });
        },
        navigate: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            dedupe(function () { return navigation.navigate.apply(navigation, args); });
        },
        replace: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            dedupe(function () { return navigation.replace.apply(navigation, args); });
        },
        dispatch: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            dedupe(function () { return navigation.dispatch.apply(navigation, args); });
        },
        popToTop: function () {
            dedupe(function () { return navigation.popToTop(); });
        },
        popTo: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            dedupe(function () { return navigation.popTo.apply(navigation, args); });
        },
        pop: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            dedupe(function () { return navigation.pop.apply(navigation, args); });
        },
        goBack: function () {
            dedupe(function () { return navigation.goBack(); });
        },
        canGoBack: function () {
            return navigation.canGoBack();
        },
        getState: function () {
            return navigation.getState();
        },
        getParent: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return navigation.getParent.apply(navigation, args);
        },
    }); }, [dedupe, navigation]);
}
