import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getTabState, TabState } from '#/lib/routes/helpers';
export function useTabFocusEffect(tabName, cb) {
    var _a = useState(false), isInside = _a[0], setIsInside = _a[1];
    // get root navigator state
    var nav = useNavigation();
    while (nav.getParent()) {
        nav = nav.getParent();
    }
    var state = nav.getState();
    useEffect(function () {
        // check if inside
        var v = getTabState(state, tabName) !== TabState.Outside;
        if (v !== isInside) {
            // fire
            setIsInside(v);
            cb(v);
        }
    }, [state, isInside, setIsInside, tabName, cb]);
}
