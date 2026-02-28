import { useCallback, useEffect, useRef, useState, useSyncExternalStore, } from 'react';
import { IS_WEB, IS_WEB_FIREFOX, IS_WEB_SAFARI } from '#/env';
function fullscreenSubscribe(onChange) {
    document.addEventListener('fullscreenchange', onChange);
    return function () { return document.removeEventListener('fullscreenchange', onChange); };
}
export function useFullscreen(ref) {
    if (!IS_WEB)
        throw new Error("'useFullscreen' is a web-only hook");
    var isFullscreen = useSyncExternalStore(fullscreenSubscribe, function () {
        return Boolean(document.fullscreenElement);
    });
    var scrollYRef = useRef(null);
    var _a = useState(isFullscreen), prevIsFullscreen = _a[0], setPrevIsFullscreen = _a[1];
    var toggleFullscreen = useCallback(function () {
        if (isFullscreen) {
            document.exitFullscreen();
        }
        else {
            if (!ref)
                throw new Error('No ref provided');
            if (!ref.current)
                return;
            scrollYRef.current = window.scrollY;
            ref.current.requestFullscreen();
        }
    }, [isFullscreen, ref]);
    useEffect(function () {
        if (prevIsFullscreen === isFullscreen)
            return;
        setPrevIsFullscreen(isFullscreen);
        // Chrome has an issue where it doesn't scroll back to the top after exiting fullscreen
        // Let's play it safe and do it if not FF or Safari, since anything else will probably be chromium
        if (prevIsFullscreen && !IS_WEB_FIREFOX && !IS_WEB_SAFARI) {
            setTimeout(function () {
                if (scrollYRef.current !== null) {
                    window.scrollTo(0, scrollYRef.current);
                    scrollYRef.current = null;
                }
            }, 100);
        }
    }, [isFullscreen, prevIsFullscreen]);
    return [isFullscreen, toggleFullscreen];
}
