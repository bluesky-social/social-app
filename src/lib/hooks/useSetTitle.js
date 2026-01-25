import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { bskyTitle } from '#/lib/strings/headings';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
export function useSetTitle(title) {
    var navigation = useNavigation();
    var numUnread = useUnreadNotifications();
    useEffect(function () {
        if (title) {
            navigation.setOptions({ title: bskyTitle(title, numUnread) });
        }
    }, [title, navigation, numUnread]);
}
