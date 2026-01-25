import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
export function useRefreshOnFocus(refetch) {
    var firstTimeRef = useRef(true);
    useFocusEffect(useCallback(function () {
        if (firstTimeRef.current) {
            firstTimeRef.current = false;
            return;
        }
        refetch();
    }, [refetch]));
}
