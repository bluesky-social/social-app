import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback } from 'react';
import { shareImageModal } from '#/lib/media/manip';
import { useSaveImageToMediaLibrary } from '#/lib/media/save-image';
import { useLightbox, useLightboxControls } from '#/state/lightbox';
import ImageView from './ImageViewing';
export function Lightbox() {
    var activeLightbox = useLightbox().activeLightbox;
    var closeLightbox = useLightboxControls().closeLightbox;
    var onClose = useCallback(function () {
        closeLightbox();
    }, [closeLightbox]);
    var saveImageToAlbum = useSaveImageToMediaLibrary();
    return (_jsx(ImageView, { lightbox: activeLightbox, onRequestClose: onClose, onPressSave: saveImageToAlbum, onPressShare: function (uri) { return shareImageModal({ uri: uri }); } }));
}
