import { useEffect, useState } from 'react';
import { useSession } from '#/state/session';
import { IS_WEB } from '#/env';
export function useWelcomeModal() {
    var hasSession = useSession().hasSession;
    var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
    var open = function () { return setIsOpen(true); };
    var close = function () {
        setIsOpen(false);
        // Mark that user has actively closed the modal, don't show again this session
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('welcomeModalClosed', 'true');
        }
    };
    useEffect(function () {
        // Only show modal if:
        // 1. User is not logged in
        // 2. We're on the web (this is a web-only feature)
        // 3. We're on the homepage (path is '/' or '/home')
        // 4. User hasn't actively closed the modal in this session
        if (IS_WEB && !hasSession && typeof window !== 'undefined') {
            var currentPath = window.location.pathname;
            var isHomePage = currentPath === '/';
            var hasUserClosedModal = sessionStorage.getItem('welcomeModalClosed') === 'true';
            if (isHomePage && !hasUserClosedModal) {
                // Small delay to ensure the page has loaded
                var timer_1 = setTimeout(function () {
                    open();
                }, 1000);
                return function () { return clearTimeout(timer_1); };
            }
        }
    }, [hasSession]);
    return { isOpen: isOpen, open: open, close: close };
}
