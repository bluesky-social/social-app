var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { logger } from '#/logger';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { CC_Stroke2_Corner0_Rounded as CCIcon } from '#/components/icons/CC';
export function SubtitleFilePicker(_a) {
    var onSelectFile = _a.onSelectFile, disabled = _a.disabled;
    var _ = useLingui()._;
    var ref = useRef(null);
    var handleClick = function () {
        var _a;
        (_a = ref.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var handlePick = function (evt) {
        var _a;
        var selectedFile = (_a = evt.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (selectedFile) {
            if (selectedFile.type === 'text/vtt' ||
                // HACK: sometimes the mime type is just straight-up missing
                // best we can do is check the file extension and hope for the best
                selectedFile.name.endsWith('.vtt')) {
                onSelectFile(selectedFile);
            }
            else {
                logger.error('Invalid subtitle file type', {
                    safeMessage: "File: ".concat(selectedFile.name, " (").concat(selectedFile.type, ")"),
                });
                Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Only WebVTT (.vtt) files are supported"], ["Only WebVTT (.vtt) files are supported"])))));
            }
        }
    };
    return (_jsxs(View, { style: a.gap_lg, children: [_jsx("input", { type: "file", accept: ".vtt", ref: ref, style: a.hidden, onChange: handlePick, disabled: disabled, "aria-disabled": disabled }), _jsx(View, { style: a.flex_row, children: _jsxs(Button, { onPress: handleClick, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Select subtitle file (.vtt)"], ["Select subtitle file (.vtt)"])))), size: "large", color: "primary", variant: "solid", disabled: disabled, children: [_jsx(ButtonIcon, { icon: CCIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Select subtitle file (.vtt)" }) })] }) })] }));
}
var templateObject_1, templateObject_2;
