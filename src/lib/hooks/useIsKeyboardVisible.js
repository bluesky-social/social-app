import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { IS_IOS } from '#/env';
export function useIsKeyboardVisible(_a) {
    var _b = _a === void 0 ? {} : _a, iosUseWillEvents = _b.iosUseWillEvents;
    var _c = useState(false), isKeyboardVisible = _c[0], setKeyboardVisible = _c[1];
    // NOTE
    // only iOS supports the "will" events
    // -prf
    var showEvent = IS_IOS && iosUseWillEvents ? 'keyboardWillShow' : 'keyboardDidShow';
    var hideEvent = IS_IOS && iosUseWillEvents ? 'keyboardWillHide' : 'keyboardDidHide';
    useEffect(function () {
        var keyboardShowListener = Keyboard.addListener(showEvent, function () {
            return setKeyboardVisible(true);
        });
        var keyboardHideListener = Keyboard.addListener(hideEvent, function () {
            return setKeyboardVisible(false);
        });
        return function () {
            keyboardHideListener.remove();
            keyboardShowListener.remove();
        };
    }, [showEvent, hideEvent]);
    return [isKeyboardVisible];
}
