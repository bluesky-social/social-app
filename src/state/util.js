import { useCallback } from 'react';
import { useDialogStateControlContext } from '#/state/dialogs';
import { useLightboxControls } from './lightbox';
import { useModalControls } from './modals';
import { useComposerControls } from './shell/composer';
import { useSetDrawerOpen } from './shell/drawer-open';
/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
    var closeLightbox = useLightboxControls().closeLightbox;
    var closeModal = useModalControls().closeModal;
    var closeComposer = useComposerControls().closeComposer;
    var closeAllDialogs = useDialogStateControlContext().closeAllDialogs;
    var setDrawerOpen = useSetDrawerOpen();
    return useCallback(function () {
        if (closeLightbox()) {
            return true;
        }
        if (closeModal()) {
            return true;
        }
        if (closeAllDialogs()) {
            return true;
        }
        if (closeComposer()) {
            return true;
        }
        setDrawerOpen(false);
        return false;
    }, [closeLightbox, closeModal, closeComposer, setDrawerOpen, closeAllDialogs]);
}
/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
    var closeLightbox = useLightboxControls().closeLightbox;
    var closeAllModals = useModalControls().closeAllModals;
    var closeComposer = useComposerControls().closeComposer;
    var closeAlfDialogs = useDialogStateControlContext().closeAllDialogs;
    var setDrawerOpen = useSetDrawerOpen();
    return useCallback(function () {
        closeLightbox();
        closeAllModals();
        closeComposer();
        closeAlfDialogs();
        setDrawerOpen(false);
    }, [
        closeLightbox,
        closeAllModals,
        closeComposer,
        closeAlfDialogs,
        setDrawerOpen,
    ]);
}
