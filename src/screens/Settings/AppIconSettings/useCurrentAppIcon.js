import { useCallback, useMemo, useState } from 'react';
import * as DynamicAppIcon from '@mozzius/expo-dynamic-app-icon';
import { useFocusEffect } from '@react-navigation/native';
import { useAppIconSets } from '#/screens/Settings/AppIconSettings/useAppIconSets';
export function useCurrentAppIcon() {
    var appIconSets = useAppIconSets();
    var _a = useState(function () {
        return DynamicAppIcon.getAppIcon();
    }), currentAppIcon = _a[0], setCurrentAppIcon = _a[1];
    // refresh current icon when screen is focused
    useFocusEffect(useCallback(function () {
        setCurrentAppIcon(DynamicAppIcon.getAppIcon());
    }, []));
    return useMemo(function () {
        var _a, _b;
        return ((_b = (_a = appIconSets.defaults.find(function (i) { return i.id === currentAppIcon; })) !== null && _a !== void 0 ? _a : appIconSets.core.find(function (i) { return i.id === currentAppIcon; })) !== null && _b !== void 0 ? _b : appIconSets.defaults[0]);
    }, [appIconSets, currentAppIcon]);
}
