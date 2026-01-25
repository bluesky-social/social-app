var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { createHitslop } from '#/lib/constants';
var HIT_SLOP = createHitslop(16);
var ImageDefaultHeader = function (_a) {
    var onRequestClose = _a.onRequestClose;
    var _ = useLingui()._;
    return (_jsx(SafeAreaView, { style: styles.root, children: _jsx(TouchableOpacity, { style: [styles.closeButton, styles.blurredBackground], onPress: onRequestClose, hitSlop: HIT_SLOP, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close image"], ["Close image"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Closes viewer for header image"], ["Closes viewer for header image"])))), onAccessibilityEscape: onRequestClose, children: _jsx(FontAwesomeIcon, { icon: "close", color: '#fff', size: 22 }) }) }));
};
var styles = StyleSheet.create({
    root: {
        alignItems: 'flex-end',
        pointerEvents: 'box-none',
    },
    closeButton: {
        marginRight: 10,
        marginTop: 10,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: '#00000077',
    },
    blurredBackground: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
    },
});
export default ImageDefaultHeader;
var templateObject_1, templateObject_2;
