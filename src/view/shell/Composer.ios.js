import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Modal, View } from 'react-native';
import { useDialogStateControlContext } from '#/state/dialogs';
import { useComposerState } from '#/state/shell/composer';
import { ComposePost, useComposerCancelRef } from '#/view/com/composer/Composer';
import { atoms as a, useTheme } from '#/alf';
import { SheetCompatProvider as TooltipSheetCompatProvider } from '#/components/Tooltip';
export function Composer(_a) {
    var setFullyExpandedCount = useDialogStateControlContext().setFullyExpandedCount;
    var t = useTheme();
    var state = useComposerState();
    var ref = useComposerCancelRef();
    var open = !!state;
    var prevOpen = React.useRef(open);
    React.useEffect(function () {
        if (open && !prevOpen.current) {
            setFullyExpandedCount(function (c) { return c + 1; });
        }
        else if (!open && prevOpen.current) {
            setFullyExpandedCount(function (c) { return c - 1; });
        }
        prevOpen.current = open;
    }, [open, setFullyExpandedCount]);
    return (_jsx(Modal, { "aria-modal": true, accessibilityViewIsModal: true, visible: open, presentationStyle: "pageSheet", animationType: "slide", onRequestClose: function () { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.onPressCancel(); }, backdropColor: "transparent", children: _jsx(View, { style: [a.flex_1, t.atoms.bg], children: _jsx(TooltipSheetCompatProvider, { children: _jsx(ComposePost, { cancelRef: ref, replyTo: state === null || state === void 0 ? void 0 : state.replyTo, onPost: state === null || state === void 0 ? void 0 : state.onPost, onPostSuccess: state === null || state === void 0 ? void 0 : state.onPostSuccess, quote: state === null || state === void 0 ? void 0 : state.quote, mention: state === null || state === void 0 ? void 0 : state.mention, text: state === null || state === void 0 ? void 0 : state.text, imageUris: state === null || state === void 0 ? void 0 : state.imageUris, videoUri: state === null || state === void 0 ? void 0 : state.videoUri }) }) }) }));
}
