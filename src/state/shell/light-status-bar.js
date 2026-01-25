import { useEffect } from 'react';
import { SystemBars } from 'react-native-edge-to-edge';
export function useSetLightStatusBar(enabled) {
    useEffect(function () {
        if (enabled) {
            var entry_1 = SystemBars.pushStackEntry({
                style: {
                    statusBar: 'light',
                },
            });
            return function () {
                SystemBars.popStackEntry(entry_1);
            };
        }
    }, [enabled]);
}
