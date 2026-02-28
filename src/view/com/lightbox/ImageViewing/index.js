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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, PixelRatio, StyleSheet, useWindowDimensions, View, } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { Gesture } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import Animated, { cancelAnimation, interpolate, measure, ReduceMotion, runOnJS, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue, withDecay, withSpring, } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Trans } from '@lingui/react/macro';
import { colors, s } from '#/lib/styles';
import { Button } from '#/view/com/util/forms/Button';
import { Text } from '#/view/com/util/text/Text';
import { ScrollView } from '#/view/com/util/Views';
import { useTheme } from '#/alf';
import { setSystemUITheme } from '#/alf/util/systemUI';
import { IS_IOS } from '#/env';
import { PlatformInfo } from '../../../../../modules/expo-bluesky-swiss-army';
import ImageDefaultHeader from './components/ImageDefaultHeader';
import ImageItem from './components/ImageItem/ImageItem';
var PORTRAIT_UP = ScreenOrientation.OrientationLock.PORTRAIT_UP;
var PIXEL_RATIO = PixelRatio.get();
var SLOW_SPRING = {
    mass: IS_IOS ? 1.25 : 0.75,
    damping: 300,
    stiffness: 800,
    restDisplacementThreshold: 0.001,
};
var FAST_SPRING = {
    mass: IS_IOS ? 1.25 : 0.75,
    damping: 150,
    stiffness: 900,
    restDisplacementThreshold: 0.001,
};
function canAnimate(lightbox) {
    return (!PlatformInfo.getIsReducedMotionEnabled() &&
        lightbox.images.every(function (img) { return img.thumbRect && (img.dimensions || img.thumbDimensions); }));
}
export default function ImageViewRoot(_a) {
    'use no memo';
    var nextLightbox = _a.lightbox, onRequestClose = _a.onRequestClose, onPressSave = _a.onPressSave, onPressShare = _a.onPressShare;
    var ref = useAnimatedRef();
    var _b = useState(nextLightbox), activeLightbox = _b[0], setActiveLightbox = _b[1];
    var _c = useState('portrait'), orientation = _c[0], setOrientation = _c[1];
    var openProgress = useSharedValue(0);
    if (!activeLightbox && nextLightbox) {
        setActiveLightbox(nextLightbox);
    }
    React.useEffect(function () {
        if (!nextLightbox) {
            return;
        }
        var isAnimated = canAnimate(nextLightbox);
        // https://github.com/software-mansion/react-native-reanimated/issues/6677
        rAF_FIXED(function () {
            openProgress.set(function () {
                return isAnimated ? withClampedSpring(1, SLOW_SPRING) : 1;
            });
        });
        return function () {
            // https://github.com/software-mansion/react-native-reanimated/issues/6677
            rAF_FIXED(function () {
                openProgress.set(function () {
                    return isAnimated ? withClampedSpring(0, SLOW_SPRING) : 0;
                });
            });
        };
    }, [nextLightbox, openProgress]);
    useAnimatedReaction(function () { return openProgress.get() === 0; }, function (isGone, wasGone) {
        if (isGone && !wasGone) {
            runOnJS(setActiveLightbox)(null);
        }
    });
    // Delay the unlock until after we've finished the scale up animation.
    // It's complicated to do the same for locking it back so we don't attempt that.
    useAnimatedReaction(function () { return openProgress.get() === 1; }, function (isOpen, wasOpen) {
        if (isOpen && !wasOpen) {
            runOnJS(ScreenOrientation.unlockAsync)();
        }
        else if (!isOpen && wasOpen) {
            // default is PORTRAIT_UP - set via config plugin in app.config.js -sfn
            runOnJS(ScreenOrientation.lockAsync)(PORTRAIT_UP);
        }
    });
    var onFlyAway = React.useCallback(function () {
        'worklet';
        openProgress.set(0);
        runOnJS(onRequestClose)();
    }, [onRequestClose, openProgress]);
    return (
    // Keep it always mounted to avoid flicker on the first frame.
    _jsx(View, { style: [styles.screen, !activeLightbox && styles.screenHidden], "aria-modal": true, accessibilityViewIsModal: true, "aria-hidden": !activeLightbox, children: _jsx(Animated.View, { ref: ref, style: { flex: 1 }, collapsable: false, onLayout: function (e) {
                var layout = e.nativeEvent.layout;
                setOrientation(layout.height > layout.width ? 'portrait' : 'landscape');
            }, children: activeLightbox && (_jsx(ImageView, { lightbox: activeLightbox, orientation: orientation, onRequestClose: onRequestClose, onPressSave: onPressSave, onPressShare: onPressShare, onFlyAway: onFlyAway, safeAreaRef: ref, openProgress: openProgress }, activeLightbox.id + '-' + orientation)) }) }));
}
function ImageView(_a) {
    var lightbox = _a.lightbox, orientation = _a.orientation, onRequestClose = _a.onRequestClose, onPressSave = _a.onPressSave, onPressShare = _a.onPressShare, onFlyAway = _a.onFlyAway, safeAreaRef = _a.safeAreaRef, openProgress = _a.openProgress;
    var images = lightbox.images, initialImageIndex = lightbox.index;
    var isAnimated = useMemo(function () { return canAnimate(lightbox); }, [lightbox]);
    var _b = useState(false), isScaled = _b[0], setIsScaled = _b[1];
    var _c = useState(false), isDragging = _c[0], setIsDragging = _c[1];
    var _d = useState(initialImageIndex), imageIndex = _d[0], setImageIndex = _d[1];
    var _e = useState(true), showControls = _e[0], setShowControls = _e[1];
    var _f = React.useState(false), isAltExpanded = _f[0], setAltExpanded = _f[1];
    var dismissSwipeTranslateY = useSharedValue(0);
    var isFlyingAway = useSharedValue(false);
    var containerStyle = useAnimatedStyle(function () {
        if (openProgress.get() < 1) {
            return {
                pointerEvents: 'none',
                opacity: isAnimated ? 1 : 0,
            };
        }
        if (isFlyingAway.get()) {
            return {
                pointerEvents: 'none',
                opacity: 1,
            };
        }
        return { pointerEvents: 'auto', opacity: 1 };
    });
    var backdropStyle = useAnimatedStyle(function () {
        var screenSize = measure(safeAreaRef);
        var opacity = 1;
        var openProgressValue = openProgress.get();
        if (openProgressValue < 1) {
            opacity = Math.sqrt(openProgressValue);
        }
        else if (screenSize && orientation === 'portrait') {
            var dragProgress = Math.min(Math.abs(dismissSwipeTranslateY.get()) / (screenSize.height / 2), 1);
            opacity -= dragProgress;
        }
        var factor = IS_IOS ? 100 : 50;
        return {
            opacity: Math.round(opacity * factor) / factor,
        };
    });
    var animatedHeaderStyle = useAnimatedStyle(function () {
        var show = showControls && dismissSwipeTranslateY.get() === 0;
        return {
            pointerEvents: show ? 'box-none' : 'none',
            opacity: withClampedSpring(show && openProgress.get() === 1 ? 1 : 0, FAST_SPRING),
            transform: [
                {
                    translateY: withClampedSpring(show ? 0 : -30, FAST_SPRING),
                },
            ],
        };
    });
    var animatedFooterStyle = useAnimatedStyle(function () {
        var show = showControls && dismissSwipeTranslateY.get() === 0;
        return {
            flexGrow: 1,
            pointerEvents: show ? 'box-none' : 'none',
            opacity: withClampedSpring(show && openProgress.get() === 1 ? 1 : 0, FAST_SPRING),
            transform: [
                {
                    translateY: withClampedSpring(show ? 0 : 30, FAST_SPRING),
                },
            ],
        };
    });
    var onTap = useCallback(function () {
        setShowControls(function (show) { return !show; });
    }, []);
    var onZoom = useCallback(function (nextIsScaled) {
        setIsScaled(nextIsScaled);
        if (nextIsScaled) {
            setShowControls(false);
        }
    }, []);
    useAnimatedReaction(function () {
        var screenSize = measure(safeAreaRef);
        return (!screenSize ||
            Math.abs(dismissSwipeTranslateY.get()) > screenSize.height);
    }, function (isOut, wasOut) {
        if (isOut && !wasOut) {
            // Stop the animation from blocking the screen forever.
            cancelAnimation(dismissSwipeTranslateY);
            onFlyAway();
        }
    });
    // style system ui on android
    var t = useTheme();
    useEffect(function () {
        setSystemUITheme('lightbox', t);
        return function () {
            setSystemUITheme('theme', t);
        };
    }, [t]);
    return (_jsxs(Animated.View, { style: [styles.container, containerStyle], children: [_jsx(SystemBars, { style: { statusBar: 'light', navigationBar: 'light' }, hidden: {
                    statusBar: isScaled || !showControls,
                    navigationBar: false,
                } }), _jsx(Animated.View, { style: [styles.backdrop, backdropStyle], renderToHardwareTextureAndroid: true }), _jsx(PagerView, { scrollEnabled: !isScaled, initialPage: initialImageIndex, onPageSelected: function (e) {
                    setImageIndex(e.nativeEvent.position);
                    setIsScaled(false);
                }, onPageScrollStateChanged: function (e) {
                    setIsDragging(e.nativeEvent.pageScrollState !== 'idle');
                }, overdrag: true, style: styles.pager, children: images.map(function (imageSrc, i) { return (_jsx(View, { children: _jsx(LightboxImage, { onTap: onTap, onZoom: onZoom, imageSrc: imageSrc, onRequestClose: onRequestClose, isScrollViewBeingDragged: isDragging, showControls: showControls, safeAreaRef: safeAreaRef, isScaled: isScaled, isFlyingAway: isFlyingAway, isActive: i === imageIndex, dismissSwipeTranslateY: dismissSwipeTranslateY, openProgress: openProgress }) }, imageSrc.uri)); }) }), _jsxs(View, { style: styles.controls, children: [_jsx(Animated.View, { style: animatedHeaderStyle, renderToHardwareTextureAndroid: true, children: _jsx(ImageDefaultHeader, { onRequestClose: onRequestClose }) }), _jsx(Animated.View, { style: animatedFooterStyle, renderToHardwareTextureAndroid: !isAltExpanded, children: _jsx(LightboxFooter, { images: images, index: imageIndex, isAltExpanded: isAltExpanded, toggleAltExpanded: function () { return setAltExpanded(function (e) { return !e; }); }, onPressSave: onPressSave, onPressShare: onPressShare }) })] })] }));
}
function LightboxImage(_a) {
    var _b;
    var imageSrc = _a.imageSrc, onTap = _a.onTap, onZoom = _a.onZoom, onRequestClose = _a.onRequestClose, isScrollViewBeingDragged = _a.isScrollViewBeingDragged, isScaled = _a.isScaled, isFlyingAway = _a.isFlyingAway, isActive = _a.isActive, showControls = _a.showControls, safeAreaRef = _a.safeAreaRef, openProgress = _a.openProgress, dismissSwipeTranslateY = _a.dismissSwipeTranslateY;
    var _c = React.useState(null), fetchedDims = _c[0], setFetchedDims = _c[1];
    var dims = (_b = fetchedDims !== null && fetchedDims !== void 0 ? fetchedDims : imageSrc.dimensions) !== null && _b !== void 0 ? _b : imageSrc.thumbDimensions;
    var imageAspect;
    if (dims) {
        imageAspect = dims.width / dims.height;
        if (Number.isNaN(imageAspect)) {
            imageAspect = undefined;
        }
    }
    var _d = useWindowDimensions(), widthDelayedForJSThreadOnly = _d.width, heightDelayedForJSThreadOnly = _d.height;
    var measureSafeArea = React.useCallback(function () {
        'worklet';
        var safeArea = measure(safeAreaRef);
        if (!safeArea) {
            if (_WORKLET) {
                console.error('Expected to always be able to measure safe area.');
            }
            safeArea = {
                x: 0,
                y: 0,
                width: widthDelayedForJSThreadOnly,
                height: heightDelayedForJSThreadOnly,
            };
        }
        return safeArea;
    }, [safeAreaRef, heightDelayedForJSThreadOnly, widthDelayedForJSThreadOnly]);
    var thumbRect = imageSrc.thumbRect;
    var transforms = useDerivedValue(function () {
        'worklet';
        var safeArea = measureSafeArea();
        var openProgressValue = openProgress.get();
        var dismissTranslateY = isActive && openProgressValue === 1 ? dismissSwipeTranslateY.get() : 0;
        if (openProgressValue === 0 && isFlyingAway.get()) {
            return {
                isHidden: true,
                isResting: false,
                scaleAndMoveTransform: [],
                cropFrameTransform: [],
                cropContentTransform: [],
            };
        }
        if (isActive && thumbRect && imageAspect && openProgressValue < 1) {
            return interpolateTransform(openProgressValue, thumbRect, safeArea, imageAspect);
        }
        return {
            isHidden: false,
            isResting: dismissTranslateY === 0,
            scaleAndMoveTransform: [{ translateY: dismissTranslateY }],
            cropFrameTransform: [],
            cropContentTransform: [],
        };
    });
    var dismissSwipePan = Gesture.Pan()
        .enabled(isActive && !isScaled)
        .activeOffsetY([-10, 10])
        .failOffsetX([-10, 10])
        .maxPointers(1)
        .onUpdate(function (e) {
        'worklet';
        if (openProgress.get() !== 1 || isFlyingAway.get()) {
            return;
        }
        dismissSwipeTranslateY.set(e.translationY);
    })
        .onEnd(function (e) {
        'worklet';
        if (openProgress.get() !== 1 || isFlyingAway.get()) {
            return;
        }
        if (Math.abs(e.velocityY) > 200) {
            isFlyingAway.set(true);
            if (dismissSwipeTranslateY.get() === 0) {
                // HACK: If the initial value is 0, withDecay() animation doesn't start.
                // This is a bug in Reanimated, but for now we'll work around it like this.
                dismissSwipeTranslateY.set(1);
            }
            dismissSwipeTranslateY.set(function () {
                'worklet';
                return withDecay({
                    velocity: e.velocityY,
                    velocityFactor: Math.max(3500 / Math.abs(e.velocityY), 1), // Speed up if it's too slow.
                    deceleration: 1, // Danger! This relies on the reaction below stopping it.
                    reduceMotion: ReduceMotion.Never, // If this animation doesn't run, the image gets stuck - therefore override Reduce Motion
                });
            });
        }
        else {
            dismissSwipeTranslateY.set(function () {
                'worklet';
                return withSpring(0, {
                    stiffness: 700,
                    damping: 50,
                    reduceMotion: ReduceMotion.Never,
                });
            });
        }
    });
    return (_jsx(ImageItem, { imageSrc: imageSrc, onTap: onTap, onZoom: onZoom, onRequestClose: onRequestClose, onLoad: setFetchedDims, isScrollViewBeingDragged: isScrollViewBeingDragged, showControls: showControls, measureSafeArea: measureSafeArea, imageAspect: imageAspect, imageDimensions: dims !== null && dims !== void 0 ? dims : undefined, dismissSwipePan: dismissSwipePan, transforms: transforms }));
}
function LightboxFooter(_a) {
    var images = _a.images, index = _a.index, isAltExpanded = _a.isAltExpanded, toggleAltExpanded = _a.toggleAltExpanded, onPressSave = _a.onPressSave, onPressShare = _a.onPressShare;
    var _b = images[index], altText = _b.alt, uri = _b.uri;
    var isMomentumScrolling = React.useRef(false);
    return (_jsx(ScrollView, { style: styles.footerScrollView, scrollEnabled: isAltExpanded, onMomentumScrollBegin: function () {
            isMomentumScrolling.current = true;
        }, onMomentumScrollEnd: function () {
            isMomentumScrolling.current = false;
        }, contentContainerStyle: {
            paddingVertical: 12,
            paddingHorizontal: 24,
        }, children: _jsxs(SafeAreaView, { edges: ['bottom'], children: [altText ? (_jsx(View, { accessibilityRole: "button", style: styles.footerText, children: _jsx(Text, { style: [s.gray3], numberOfLines: isAltExpanded ? undefined : 3, selectable: true, onPress: function () {
                            if (isMomentumScrolling.current) {
                                return;
                            }
                            LayoutAnimation.configureNext({
                                duration: 450,
                                update: { type: 'spring', springDamping: 1 },
                            });
                            toggleAltExpanded();
                        }, onLongPress: function () { }, emoji: true, children: altText }) })) : null, _jsxs(View, { style: styles.footerBtns, children: [_jsxs(Button, { type: "primary-outline", style: styles.footerBtn, onPress: function () { return onPressSave(uri); }, children: [_jsx(FontAwesomeIcon, { icon: ['far', 'floppy-disk'], style: s.white }), _jsx(Text, { type: "xl", style: s.white, children: _jsx(Trans, { context: "action", children: "Save" }) })] }), _jsxs(Button, { type: "primary-outline", style: styles.footerBtn, onPress: function () { return onPressShare(uri); }, children: [_jsx(FontAwesomeIcon, { icon: "arrow-up-from-bracket", style: s.white }), _jsx(Text, { type: "xl", style: s.white, children: _jsx(Trans, { context: "action", children: "Share" }) })] })] })] }) }));
}
var styles = StyleSheet.create({
    screen: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    screenHidden: {
        opacity: 0,
        pointerEvents: 'none',
    },
    container: {
        flex: 1,
    },
    backdrop: {
        backgroundColor: '#000',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    controls: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        gap: 20,
        zIndex: 1,
        pointerEvents: 'box-none',
    },
    pager: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        width: '100%',
        top: 0,
        pointerEvents: 'box-none',
    },
    footer: {
        position: 'absolute',
        width: '100%',
        maxHeight: '100%',
        bottom: 0,
    },
    footerScrollView: {
        backgroundColor: '#000d',
        flex: 1,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        maxHeight: '100%',
    },
    footerText: {
        paddingBottom: IS_IOS ? 20 : 16,
    },
    footerBtns: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    footerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'transparent',
        borderColor: colors.white,
    },
});
function interpolatePx(px, inputRange, outputRange) {
    'worklet';
    var value = interpolate(px, inputRange, outputRange);
    return Math.round(value * PIXEL_RATIO) / PIXEL_RATIO;
}
function interpolateTransform(progress, thumbnailDims, safeArea, imageAspect) {
    'worklet';
    var thumbAspect = thumbnailDims.width / thumbnailDims.height;
    var uncroppedInitialWidth;
    var uncroppedInitialHeight;
    if (imageAspect > thumbAspect) {
        uncroppedInitialWidth = thumbnailDims.height * imageAspect;
        uncroppedInitialHeight = thumbnailDims.height;
    }
    else {
        uncroppedInitialWidth = thumbnailDims.width;
        uncroppedInitialHeight = thumbnailDims.width / imageAspect;
    }
    var safeAreaAspect = safeArea.width / safeArea.height;
    var finalWidth;
    var finalHeight;
    if (safeAreaAspect > imageAspect) {
        finalWidth = safeArea.height * imageAspect;
        finalHeight = safeArea.height;
    }
    else {
        finalWidth = safeArea.width;
        finalHeight = safeArea.width / imageAspect;
    }
    var initialScale = Math.min(uncroppedInitialWidth / finalWidth, uncroppedInitialHeight / finalHeight);
    var croppedFinalWidth = thumbnailDims.width / initialScale;
    var croppedFinalHeight = thumbnailDims.height / initialScale;
    var screenCenterX = safeArea.width / 2;
    var screenCenterY = safeArea.height / 2;
    var thumbnailSafeAreaX = thumbnailDims.pageX - safeArea.x;
    var thumbnailSafeAreaY = thumbnailDims.pageY - safeArea.y;
    var thumbnailCenterX = thumbnailSafeAreaX + thumbnailDims.width / 2;
    var thumbnailCenterY = thumbnailSafeAreaY + thumbnailDims.height / 2;
    var initialTranslateX = thumbnailCenterX - screenCenterX;
    var initialTranslateY = thumbnailCenterY - screenCenterY;
    var scale = interpolate(progress, [0, 1], [initialScale, 1]);
    var translateX = interpolatePx(progress, [0, 1], [initialTranslateX, 0]);
    var translateY = interpolatePx(progress, [0, 1], [initialTranslateY, 0]);
    var cropScaleX = interpolate(progress, [0, 1], [croppedFinalWidth / finalWidth, 1]);
    var cropScaleY = interpolate(progress, [0, 1], [croppedFinalHeight / finalHeight, 1]);
    return {
        isHidden: false,
        isResting: progress === 1,
        scaleAndMoveTransform: [{ translateX: translateX }, { translateY: translateY }, { scale: scale }],
        cropFrameTransform: [{ scaleX: cropScaleX }, { scaleY: cropScaleY }],
        cropContentTransform: [{ scaleX: 1 / cropScaleX }, { scaleY: 1 / cropScaleY }],
    };
}
function withClampedSpring(value, config) {
    'worklet';
    return withSpring(value, __assign(__assign({}, config), { overshootClamping: true }));
}
// We have to do this because we can't trust RN's rAF to fire in order.
// https://github.com/facebook/react-native/issues/48005
var isFrameScheduled = false;
var pendingFrameCallbacks = [];
function rAF_FIXED(callback) {
    pendingFrameCallbacks.push(callback);
    if (!isFrameScheduled) {
        isFrameScheduled = true;
        requestAnimationFrame(function () {
            var callbacks = pendingFrameCallbacks.slice();
            isFrameScheduled = false;
            pendingFrameCallbacks = [];
            var hasError = false;
            var error;
            for (var i = 0; i < callbacks.length; i++) {
                try {
                    callbacks[i]();
                }
                catch (e) {
                    hasError = true;
                    error = e;
                }
            }
            if (hasError) {
                throw error;
            }
        });
    }
}
