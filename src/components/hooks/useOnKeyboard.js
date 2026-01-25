import React from 'react';
import { Keyboard } from 'react-native';
export function useOnKeyboardDidShow(cb) {
    React.useEffect(function () {
        var subscription = Keyboard.addListener('keyboardDidShow', cb);
        return function () {
            subscription.remove();
        };
    }, [cb]);
}
