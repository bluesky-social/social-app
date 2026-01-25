import React from 'react';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useDialogStateContext } from '#/state/dialogs';
import { useLightbox } from '#/state/lightbox';
import { useModals } from '#/state/modals';
import { useSession } from '#/state/session';
import { useIsDrawerOpen } from '#/state/shell/drawer-open';
/**
 * Based on {@link https://github.com/jaywcjlove/hotkeys-js/blob/b0038773f3b902574f22af747f3bb003a850f1da/src/index.js#L51C1-L64C2}
 */
function shouldIgnore(event) {
    var target = event.target || event.srcElement;
    if (!target)
        return false;
    var tagName = target.tagName;
    if (!tagName)
        return false;
    var isInput = tagName === 'INPUT' &&
        ![
            'checkbox',
            'radio',
            'range',
            'button',
            'file',
            'reset',
            'submit',
            'color',
        ].includes(target.type);
    // ignore: isContentEditable === 'true', <input> and <textarea> when readOnly state is false, <select>
    if (target.isContentEditable ||
        ((isInput || tagName === 'TEXTAREA' || tagName === 'SELECT') &&
            !target.readOnly)) {
        return true;
    }
    return false;
}
export function useComposerKeyboardShortcut() {
    var openComposer = useOpenComposer().openComposer;
    var openDialogs = useDialogStateContext().openDialogs;
    var isModalActive = useModals().isModalActive;
    var activeLightbox = useLightbox().activeLightbox;
    var isDrawerOpen = useIsDrawerOpen();
    var hasSession = useSession().hasSession;
    React.useEffect(function () {
        if (!hasSession) {
            return;
        }
        function handler(event) {
            if (shouldIgnore(event))
                return;
            if ((openDialogs === null || openDialogs === void 0 ? void 0 : openDialogs.current.size) > 0 ||
                isModalActive ||
                activeLightbox ||
                isDrawerOpen)
                return;
            if (event.key === 'n' || event.key === 'N') {
                openComposer({});
            }
        }
        document.addEventListener('keydown', handler);
        return function () { return document.removeEventListener('keydown', handler); };
    }, [
        openComposer,
        isModalActive,
        openDialogs,
        activeLightbox,
        isDrawerOpen,
        hasSession,
    ]);
}
