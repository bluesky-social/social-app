var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { FocusGuards, FocusScope } from 'radix-ui/internal';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { useA11y } from '#/state/a11y';
import { useLightbox, useLightboxControls } from '#/state/lightbox';
import { atoms as a, flatten, ThemeProvider, useBreakpoints, useTheme, } from '#/alf';
import { Button } from '#/components/Button';
import { Backdrop } from '#/components/Dialog';
import { ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon, ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon, } from '#/components/icons/Chevron';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
export function Lightbox() {
    var activeLightbox = useLightbox().activeLightbox;
    var closeLightbox = useLightboxControls().closeLightbox;
    var isActive = !!activeLightbox;
    if (!isActive) {
        return null;
    }
    var initialIndex = activeLightbox.index;
    var imgs = activeLightbox.images;
    return (_jsx(ThemeProvider, { theme: "dark", children: _jsx(LightboxContainer, { handleBackgroundPress: closeLightbox, children: _jsx(LightboxGallery, { imgs: imgs, initialIndex: initialIndex, onClose: closeLightbox }, activeLightbox.id) }) }));
}
function LightboxContainer(_a) {
    var children = _a.children, handleBackgroundPress = _a.handleBackgroundPress;
    var _ = useLingui()._;
    FocusGuards.useFocusGuards();
    return (_jsxs(Pressable, { accessibilityHint: undefined, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close image viewer"], ["Close image viewer"])))), onPress: handleBackgroundPress, style: [a.fixed, a.inset_0, a.z_10], children: [_jsx(Backdrop, {}), _jsx(RemoveScrollBar, {}), _jsx(FocusScope.FocusScope, { loop: true, trapped: true, asChild: true, children: _jsx("div", { role: "dialog", "aria-modal": "true", "aria-label": _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Image viewer"], ["Image viewer"])))), style: { position: 'absolute', inset: 0 }, children: children }) })] }));
}
function LightboxGallery(_a) {
    var imgs = _a.imgs, _b = _a.initialIndex, initialIndex = _b === void 0 ? 0 : _b, onClose = _a.onClose;
    var t = useTheme();
    var _ = useLingui()._;
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    var _c = useState(initialIndex), index = _c[0], setIndex = _c[1];
    var _d = useState(false), hasAnyLoaded = _d[0], setAnyHasLoaded = _d[1];
    var _e = useState(false), isAltExpanded = _e[0], setAltExpanded = _e[1];
    var gtPhone = useBreakpoints().gtPhone;
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
    // Push a history entry so the browser back button closes the lightbox
    // instead of navigating away from the page.
    var closedByPopStateRef = useRef(false);
    useEffect(function () {
        history.pushState({ lightbox: true }, '');
        var handlePopState = function () {
            closedByPopStateRef.current = true;
            onClose();
        };
        window.addEventListener('popstate', handlePopState);
        return function () {
            var _a;
            window.removeEventListener('popstate', handlePopState);
            // Only pop our entry if it's still the current one. If navigation
            // already pushed a new entry on top, leave the orphaned entry —
            // it shares the same URL so traversing through it is harmless.
            if (!closedByPopStateRef.current &&
                ((_a = history.state) === null || _a === void 0 ? void 0 : _a.lightbox)) {
                history.back();
            }
        };
    }, [onClose]);
    var delayedFadeInAnim = !reduceMotionEnabled && [
        a.fade_in,
        { animationDelay: '0.2s', animationFillMode: 'both' },
    ];
    var img = imgs[index];
    return (_jsxs(View, { style: [a.absolute, a.inset_0], children: [_jsxs(View, { style: [a.flex_1, a.justify_center, a.align_center], children: [_jsx(LightboxGalleryItem, { source: img.uri, alt: img.alt, type: img.type, hasAnyLoaded: hasAnyLoaded, onLoad: function () { return setAnyHasLoaded(true); } }, index), canGoLeft && (_jsx(Button, { onPress: onPressLeft, style: [
                            a.absolute,
                            styles.leftBtn,
                            styles.blurredBackdrop,
                            a.transition_color,
                            delayedFadeInAnim,
                        ], hoverStyle: styles.blurredBackdropHover, color: "secondary", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Previous image"], ["Previous image"])))), shape: "round", size: gtPhone ? 'large' : 'small', children: _jsx(ChevronLeftIcon, { size: gtPhone ? 'md' : 'sm', style: { color: t.palette.white } }) })), canGoRight && (_jsx(Button, { onPress: onPressRight, style: [
                            a.absolute,
                            styles.rightBtn,
                            styles.blurredBackdrop,
                            a.transition_color,
                            delayedFadeInAnim,
                        ], hoverStyle: styles.blurredBackdropHover, color: "secondary", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Next image"], ["Next image"])))), shape: "round", size: gtPhone ? 'large' : 'small', children: _jsx(ChevronRightIcon, { size: gtPhone ? 'md' : 'sm', style: { color: t.palette.white } }) }))] }), img.alt ? (_jsx(View, { style: [a.px_4xl, a.py_2xl, t.atoms.bg, delayedFadeInAnim], children: _jsx(Pressable, { accessibilityLabel: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Expand alt text"], ["Expand alt text"])))), accessibilityHint: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["If alt text is long, toggles alt text expanded state"], ["If alt text is long, toggles alt text expanded state"])))), onPress: function () {
                        setAltExpanded(!isAltExpanded);
                    }, children: _jsx(Text, { style: [a.text_md, a.leading_snug], numberOfLines: isAltExpanded ? 0 : 3, ellipsizeMode: "tail", children: img.alt }) }) })) : null, imgs.length > 1 && (_jsx("div", { "aria-live": "polite", "aria-atomic": "true", style: a.sr_only, children: _jsx(Text, { children: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Image ", " of ", ""], ["Image ", " of ", ""])), index + 1, imgs.length)) }) })), _jsx(Button, { onPress: onClose, style: [
                    a.absolute,
                    styles.closeBtn,
                    styles.blurredBackdrop,
                    a.transition_color,
                    delayedFadeInAnim,
                ], hoverStyle: styles.blurredBackdropHover, color: "secondary", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Close image viewer"], ["Close image viewer"])))), shape: "round", size: gtPhone ? 'large' : 'small', children: _jsx(XIcon, { size: gtPhone ? 'md' : 'sm', style: { color: t.palette.white } }) })] }));
}
function LightboxGalleryItem(_a) {
    var source = _a.source, alt = _a.alt, type = _a.type, onLoad = _a.onLoad, hasAnyLoaded = _a.hasAnyLoaded;
    var reduceMotionEnabled = useA11y().reduceMotionEnabled;
    var _b = useState(false), hasLoaded = _b[0], setHasLoaded = _b[1];
    var isFirstToLoad = useState(!hasAnyLoaded)[0];
    /**
     * We want to show a zoom/fade in animation when the lightbox first opens.
     * To avoid showing it as we switch between images, we keep track in the parent
     * whether any image has loaded yet. We then save what the value of this is on first
     * render (as when it changes, we don't want to then *remove* then animation). when
     * the image loads, if this is the first image to load, we play the animation.
     *
     * We also use this `hasLoaded` state to show a loading indicator. This is on a 1s
     * delay and then a slow fade in to avoid flicker. -sfn
     */
    var zoomInWhenReady = !reduceMotionEnabled &&
        isFirstToLoad &&
        (hasAnyLoaded
            ? [a.zoom_fade_in, { animationDuration: '0.5s' }]
            : { opacity: 0 });
    var handleLoad = function () {
        setHasLoaded(true);
        onLoad();
    };
    var image = null;
    switch (type) {
        case 'circle-avi':
        case 'rect-avi':
            image = (_jsx("img", { src: source, style: flatten([
                    styles.avi,
                    {
                        borderRadius: type === 'circle-avi' ? '50%' : type === 'rect-avi' ? '10%' : 0,
                    },
                    zoomInWhenReady,
                ]), alt: alt, onLoad: handleLoad }));
            break;
        case 'image':
            image = (_jsx(Image, { source: { uri: source }, alt: alt, style: [a.w_full, a.h_full, zoomInWhenReady], onLoad: handleLoad, contentFit: "contain", accessibilityIgnoresInvertColors: true }));
            break;
    }
    return (_jsxs(_Fragment, { children: [image, !hasLoaded && (_jsx(View, { style: [
                    a.absolute,
                    a.inset_0,
                    a.justify_center,
                    a.align_center,
                    a.fade_in,
                    {
                        opacity: 0,
                        animationDuration: '500ms',
                        animationDelay: '1s',
                        animationFillMode: 'both',
                    },
                ], children: _jsx(Loader, { size: "xl" }) }))] }));
}
var styles = StyleSheet.create({
    avi: {
        // @ts-ignore web-only
        maxWidth: "calc(min(400px, 100vw))",
        // @ts-ignore web-only
        maxHeight: "calc(min(400px, 100vh))",
        padding: 16,
        boxSizing: 'border-box',
    },
    closeBtn: {
        top: 20,
        right: 20,
    },
    leftBtn: {
        left: 20,
        right: 'auto',
        top: '50%',
    },
    rightBtn: {
        right: 20,
        left: 'auto',
        top: '50%',
    },
    blurredBackdrop: {
        backgroundColor: '#00000077',
        // @ts-expect-error web only -sfn
        backdropFilter: 'blur(10px)',
    },
    blurredBackdropHover: {
        backgroundColor: '#00000088',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
