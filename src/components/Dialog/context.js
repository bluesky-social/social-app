import { createContext, useContext, useEffect, useId, useMemo, useRef, } from 'react';
import { useDialogStateContext } from '#/state/dialogs';
import { IS_DEV } from '#/env';
import { BottomSheetSnapPoint } from '../../../modules/bottom-sheet/src/BottomSheet.types';
export var Context = createContext({
    close: function () { },
    isNativeDialog: false,
    nativeSnapPoint: BottomSheetSnapPoint.Hidden,
    disableDrag: false,
    setDisableDrag: function () { },
    isWithinDialog: false,
});
Context.displayName = 'DialogContext';
export function useDialogContext() {
    return useContext(Context);
}
export function useDialogControl() {
    var id = useId();
    var control = useRef({
        open: function () { },
        close: function () { },
    });
    var activeDialogs = useDialogStateContext().activeDialogs;
    useEffect(function () {
        activeDialogs.current.set(id, control);
        return function () {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            activeDialogs.current.delete(id);
        };
    }, [id, activeDialogs]);
    return useMemo(function () { return ({
        id: id,
        ref: control,
        open: function () {
            if (control.current) {
                control.current.open();
            }
            else {
                if (IS_DEV) {
                    console.warn('Attemped to open a dialog control that was not attached to a dialog!\n' +
                        'Please ensure that the Dialog is mounted when calling open/close');
                }
            }
        },
        close: function (cb) {
            if (control.current) {
                control.current.close(cb);
            }
            else {
                if (IS_DEV) {
                    console.warn('Attemped to close a dialog control that was not attached to a dialog!\n' +
                        'Please ensure that the Dialog is mounted when calling open/close');
                }
            }
        },
    }); }, [id, control]);
}
