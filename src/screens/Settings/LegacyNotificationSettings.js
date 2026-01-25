import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
export function LegacyNotificationSettingsScreen(_a) {
    var navigation = _a.navigation;
    useFocusEffect(useCallback(function () {
        navigation.replace('NotificationSettings');
    }, [navigation]));
    return null;
}
