import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
export function Splash(_a) {
    var isReady = _a.isReady, children = _a.children;
    useEffect(function () {
        if (isReady) {
            SplashScreen.hideAsync();
        }
    }, [isReady]);
    if (isReady) {
        return children;
    }
}
