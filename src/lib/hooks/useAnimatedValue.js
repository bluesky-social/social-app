import * as React from 'react';
import { Animated } from 'react-native';
export function useAnimatedValue(initialValue) {
    var lazyRef = React.useRef(undefined);
    if (lazyRef.current === undefined) {
        lazyRef.current = new Animated.Value(initialValue);
    }
    return lazyRef.current;
}
