var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View, } from 'react-native';
import { FontAwesomeIcon, } from '@fortawesome/react-native-fontawesome';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { colors, s } from '#/lib/styles';
import { useLightbox, useLightboxControls } from '#/state/lightbox';
import { Text } from '../util/text/Text';
import ImageDefaultHeader from './ImageViewing/components/ImageDefaultHeader';
export function Lightbox() {
    var activeLightbox = useLightbox().activeLightbox;
    var closeLightbox = useLightboxControls().closeLightbox;
    var isActive = !!activeLightbox;
    if (!isActive) {
        return null;
    }
    var initialIndex = activeLightbox.index;
    var imgs = activeLightbox.images;
    return (_jsxs(_Fragment, { children: [_jsx(RemoveScrollBar, {}), _jsx(LightboxInner, { imgs: imgs, initialIndex: initialIndex, onClose: closeLightbox })] }));
}
function LightboxInner(_a) {
    var imgs = _a.imgs, _b = _a.initialIndex, initialIndex = _b === void 0 ? 0 : _b, onClose = _a.onClose;
    var _ = useLingui()._;
    var _c = useState(initialIndex), index = _c[0], setIndex = _c[1];
    var _d = useState(false), isAltExpanded = _d[0], setAltExpanded = _d[1];
    var canGoLeft = index >= 1;
    var canGoRight = index < imgs.length - 1;
    var onPressLeft = useCallback(function () {
        if (canGoLeft) {
            setIndex(index - 1);
        }
    }, [index, canGoLeft]);
    var onPressRight = useCallback(function () {
        if (canGoRight) {
            setIndex(index + 1);
        }
    }, [index, canGoRight]);
    var onKeyDown = useCallback(function (e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
        else if (e.key === 'ArrowLeft') {
            onPressLeft();
        }
        else if (e.key === 'ArrowRight') {
            onPressRight();
        }
    }, [onClose, onPressLeft, onPressRight]);
    useEffect(function () {
        window.addEventListener('keydown', onKeyDown);
        return function () { return window.removeEventListener('keydown', onKeyDown); };
    }, [onKeyDown]);
    var isTabletOrDesktop = useWebMediaQueries().isTabletOrDesktop;
    var btnStyle = React.useMemo(function () {
        return isTabletOrDesktop ? styles.btnTablet : styles.btnMobile;
    }, [isTabletOrDesktop]);
    var iconSize = React.useMemo(function () {
        return isTabletOrDesktop ? 32 : 24;
    }, [isTabletOrDesktop]);
    var img = imgs[index];
    var isAvi = img.type === 'circle-avi' || img.type === 'rect-avi';
    return (_jsxs(View, { style: styles.mask, children: [_jsx(TouchableWithoutFeedback, { onPress: onClose, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close image viewer"], ["Close image viewer"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Exits image view"], ["Exits image view"])))), onAccessibilityEscape: onClose, children: isAvi ? (_jsx(View, { style: styles.aviCenterer, children: _jsx("img", { src: img.uri, 
                        // @ts-ignore web-only
                        style: __assign(__assign({}, styles.avi), { borderRadius: img.type === 'circle-avi'
                                ? '50%'
                                : img.type === 'rect-avi'
                                    ? '10%'
                                    : 0 }), alt: img.alt }) })) : (_jsxs(View, { style: styles.imageCenterer, children: [_jsx(Image, { accessibilityIgnoresInvertColors: true, source: img, style: styles.image, accessibilityLabel: img.alt, accessibilityHint: "" }), canGoLeft && (_jsx(TouchableOpacity, { onPress: onPressLeft, style: [
                                styles.btn,
                                btnStyle,
                                styles.leftBtn,
                                styles.blurredBackground,
                            ], accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Previous image"], ["Previous image"])))), accessibilityHint: "", children: _jsx(FontAwesomeIcon, { icon: "angle-left", style: styles.icon, size: iconSize }) })), canGoRight && (_jsx(TouchableOpacity, { onPress: onPressRight, style: [
                                styles.btn,
                                btnStyle,
                                styles.rightBtn,
                                styles.blurredBackground,
                            ], accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Next image"], ["Next image"])))), accessibilityHint: "", children: _jsx(FontAwesomeIcon, { icon: "angle-right", style: styles.icon, size: iconSize }) }))] })) }), img.alt ? (_jsx(View, { style: styles.footer, children: _jsx(Pressable, { accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Expand alt text"], ["Expand alt text"])))), accessibilityHint: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["If alt text is long, toggles alt text expanded state"], ["If alt text is long, toggles alt text expanded state"])))), onPress: function () {
                        setAltExpanded(!isAltExpanded);
                    }, children: _jsx(Text, { style: s.white, numberOfLines: isAltExpanded ? 0 : 3, ellipsizeMode: "tail", children: img.alt }) }) })) : null, _jsx(View, { style: styles.closeBtn, children: _jsx(ImageDefaultHeader, { onRequestClose: onClose }) })] }));
}
var styles = StyleSheet.create({
    mask: {
        // @ts-ignore
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000c',
    },
    imageCenterer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    aviCenterer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avi: {
        // @ts-ignore web-only
        maxWidth: "calc(min(400px, 100vw))",
        // @ts-ignore web-only
        maxHeight: "calc(min(400px, 100vh))",
        padding: 16,
        boxSizing: 'border-box',
    },
    icon: {
        color: colors.white,
    },
    closeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    btn: {
        position: 'absolute',
        backgroundColor: '#00000077',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnTablet: {
        width: 50,
        height: 50,
        borderRadius: 25,
        left: 30,
        right: 30,
    },
    btnMobile: {
        width: 44,
        height: 44,
        borderRadius: 22,
        left: 20,
        right: 20,
    },
    leftBtn: {
        right: 'auto',
        top: '50%',
    },
    rightBtn: {
        left: 'auto',
        top: '50%',
    },
    footer: {
        paddingHorizontal: 32,
        paddingVertical: 24,
        backgroundColor: colors.black,
    },
    blurredBackground: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
