import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useSharedValue, withSpring, } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { applyRounding, createTransform, prependPan, prependPinch, prependTransform, readTransform, } from '../../transforms';
var MIN_SCREEN_ZOOM = 2;
var MAX_ORIGINAL_IMAGE_ZOOM = 2;
var initialTransform = createTransform();
var ImageItem = function (_a) {
    var imageSrc = _a.imageSrc, onTap = _a.onTap, onZoom = _a.onZoom, onLoad = _a.onLoad, isScrollViewBeingDragged = _a.isScrollViewBeingDragged, measureSafeArea = _a.measureSafeArea, imageAspect = _a.imageAspect, imageDimensions = _a.imageDimensions, dismissSwipePan = _a.dismissSwipePan, transforms = _a.transforms;
    var _b = useState(false), isScaled = _b[0], setIsScaled = _b[1];
    var committedTransform = useSharedValue(initialTransform);
    var panTranslation = useSharedValue({ x: 0, y: 0 });
    var pinchOrigin = useSharedValue({ x: 0, y: 0 });
    var pinchScale = useSharedValue(1);
    var pinchTranslation = useSharedValue({ x: 0, y: 0 });
    var containerRef = useAnimatedRef();
    // Keep track of when we're entering or leaving scaled rendering.
    // Note: DO NOT move any logic reading animated values outside this function.
    useAnimatedReaction(function () {
        if (pinchScale.get() !== 1) {
            // We're currently pinching.
            return true;
        }
        var _a = readTransform(committedTransform.get()), committedScale = _a[2];
        if (committedScale !== 1) {
            // We started from a pinched in state.
            return true;
        }
        // We're at rest.
        return false;
    }, function (nextIsScaled, prevIsScaled) {
        if (nextIsScaled !== prevIsScaled) {
            runOnJS(handleZoom)(nextIsScaled);
        }
    });
    function handleZoom(nextIsScaled) {
        setIsScaled(nextIsScaled);
        onZoom(nextIsScaled);
    }
    // On Android, stock apps prevent going "out of bounds" on pan or pinch. You should "bump" into edges.
    // If the user tried to pan too hard, this function will provide the negative panning to stay in bounds.
    function getExtraTranslationToStayInBounds(candidateTransform, screenSize) {
        'worklet';
        if (!imageAspect) {
            return [0, 0];
        }
        var _a = readTransform(candidateTransform), nextTranslateX = _a[0], nextTranslateY = _a[1], nextScale = _a[2];
        var scaledDimensions = getScaledDimensions(imageAspect, nextScale, screenSize);
        var clampedTranslateX = clampTranslation(nextTranslateX, scaledDimensions.width, screenSize.width);
        var clampedTranslateY = clampTranslation(nextTranslateY, scaledDimensions.height, screenSize.height);
        var dx = clampedTranslateX - nextTranslateX;
        var dy = clampedTranslateY - nextTranslateY;
        return [dx, dy];
    }
    var pinch = Gesture.Pinch()
        .onStart(function (e) {
        'worklet';
        var screenSize = measureSafeArea();
        pinchOrigin.set({
            x: e.focalX - screenSize.width / 2,
            y: e.focalY - screenSize.height / 2,
        });
    })
        .onChange(function (e) {
        'worklet';
        var screenSize = measureSafeArea();
        if (!imageDimensions) {
            return;
        }
        // Don't let the picture zoom in so close that it gets blurry.
        // Also, like in stock Android apps, don't let the user zoom out further than 1:1.
        var _a = readTransform(committedTransform.get()), committedScale = _a[2];
        var maxCommittedScale = Math.max(MIN_SCREEN_ZOOM, (imageDimensions.width / screenSize.width) * MAX_ORIGINAL_IMAGE_ZOOM);
        var minPinchScale = 1 / committedScale;
        var maxPinchScale = maxCommittedScale / committedScale;
        var nextPinchScale = Math.min(Math.max(minPinchScale, e.scale), maxPinchScale);
        pinchScale.set(nextPinchScale);
        // Zooming out close to the corner could push us out of bounds, which we don't want on Android.
        // Calculate where we'll end up so we know how much to translate back to stay in bounds.
        var t = createTransform();
        prependPan(t, panTranslation.get());
        prependPinch(t, nextPinchScale, pinchOrigin.get(), pinchTranslation.get());
        prependTransform(t, committedTransform.get());
        var _b = getExtraTranslationToStayInBounds(t, screenSize), dx = _b[0], dy = _b[1];
        if (dx !== 0 || dy !== 0) {
            var pt = pinchTranslation.get();
            pinchTranslation.set({
                x: pt.x + dx,
                y: pt.y + dy,
            });
        }
    })
        .onEnd(function () {
        'worklet';
        // Commit just the pinch.
        var t = createTransform();
        prependPinch(t, pinchScale.get(), pinchOrigin.get(), pinchTranslation.get());
        prependTransform(t, committedTransform.get());
        applyRounding(t);
        committedTransform.set(t);
        // Reset just the pinch.
        pinchScale.set(1);
        pinchOrigin.set({ x: 0, y: 0 });
        pinchTranslation.set({ x: 0, y: 0 });
    });
    var pan = Gesture.Pan()
        .averageTouches(true)
        // Unlike .enabled(isScaled), this ensures that an initial pinch can turn into a pan midway:
        .minPointers(isScaled ? 1 : 2)
        .onChange(function (e) {
        'worklet';
        var screenSize = measureSafeArea();
        if (!imageDimensions) {
            return;
        }
        var nextPanTranslation = { x: e.translationX, y: e.translationY };
        var t = createTransform();
        prependPan(t, nextPanTranslation);
        prependPinch(t, pinchScale.get(), pinchOrigin.get(), pinchTranslation.get());
        prependTransform(t, committedTransform.get());
        // Prevent panning from going out of bounds.
        var _a = getExtraTranslationToStayInBounds(t, screenSize), dx = _a[0], dy = _a[1];
        nextPanTranslation.x += dx;
        nextPanTranslation.y += dy;
        panTranslation.set(nextPanTranslation);
    })
        .onEnd(function () {
        'worklet';
        // Commit just the pan.
        var t = createTransform();
        prependPan(t, panTranslation.get());
        prependTransform(t, committedTransform.get());
        applyRounding(t);
        committedTransform.set(t);
        // Reset just the pan.
        panTranslation.set({ x: 0, y: 0 });
    });
    var singleTap = Gesture.Tap().onEnd(function () {
        'worklet';
        runOnJS(onTap)();
    });
    var doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(function (e) {
        'worklet';
        var screenSize = measureSafeArea();
        if (!imageDimensions || !imageAspect) {
            return;
        }
        var _a = readTransform(committedTransform.get()), committedScale = _a[2];
        if (committedScale !== 1) {
            // Go back to 1:1 using the identity vector.
            var t = createTransform();
            committedTransform.set(withClampedSpring(t));
            return;
        }
        // Try to zoom in so that we get rid of the black bars (whatever the orientation was).
        var screenAspect = screenSize.width / screenSize.height;
        var candidateScale = Math.max(imageAspect / screenAspect, screenAspect / imageAspect, MIN_SCREEN_ZOOM);
        // But don't zoom in so close that the picture gets blurry.
        var maxScale = Math.max(MIN_SCREEN_ZOOM, (imageDimensions.width / screenSize.width) * MAX_ORIGINAL_IMAGE_ZOOM);
        var scale = Math.min(candidateScale, maxScale);
        // Calculate where we would be if the user pinched into the double tapped point.
        // We won't use this transform directly because it may go out of bounds.
        var candidateTransform = createTransform();
        var origin = {
            x: e.absoluteX - screenSize.width / 2,
            y: e.absoluteY - screenSize.height / 2,
        };
        prependPinch(candidateTransform, scale, origin, { x: 0, y: 0 });
        // Now we know how much we went out of bounds, so we can shoot correctly.
        var _b = getExtraTranslationToStayInBounds(candidateTransform, screenSize), dx = _b[0], dy = _b[1];
        var finalTransform = createTransform();
        prependPinch(finalTransform, scale, origin, { x: dx, y: dy });
        committedTransform.set(withClampedSpring(finalTransform));
    });
    var composedGesture = isScrollViewBeingDragged
        ? // If the parent is not at rest, provide a no-op gesture.
            Gesture.Manual()
        : Gesture.Exclusive(dismissSwipePan, Gesture.Simultaneous(pinch, pan), doubleTap, singleTap);
    var containerStyle = useAnimatedStyle(function () {
        var _a = transforms.get(), scaleAndMoveTransform = _a.scaleAndMoveTransform, isHidden = _a.isHidden;
        // Apply the active adjustments on top of the committed transform before the gestures.
        // This is matrix multiplication, so operations are applied in the reverse order.
        var t = createTransform();
        prependPan(t, panTranslation.get());
        prependPinch(t, pinchScale.get(), pinchOrigin.get(), pinchTranslation.get());
        prependTransform(t, committedTransform.get());
        var _b = readTransform(t), translateX = _b[0], translateY = _b[1], scale = _b[2];
        var manipulationTransform = [
            { translateX: translateX },
            { translateY: translateY },
            { scale: scale },
        ];
        var screenSize = measureSafeArea();
        return {
            opacity: isHidden ? 0 : 1,
            transform: scaleAndMoveTransform.concat(manipulationTransform),
            width: screenSize.width,
            maxHeight: screenSize.height,
            alignSelf: 'center',
            aspectRatio: imageAspect !== null && imageAspect !== void 0 ? imageAspect : 1 /* force onLoad */,
        };
    });
    var imageCropStyle = useAnimatedStyle(function () {
        var cropFrameTransform = transforms.get().cropFrameTransform;
        return {
            flex: 1,
            overflow: 'hidden',
            transform: cropFrameTransform,
        };
    });
    var imageStyle = useAnimatedStyle(function () {
        var cropContentTransform = transforms.get().cropContentTransform;
        return {
            flex: 1,
            transform: cropContentTransform,
            opacity: imageAspect === undefined ? 0 : 1,
        };
    });
    var _c = useState(false), showLoader = _c[0], setShowLoader = _c[1];
    var _d = useState(false), hasLoaded = _d[0], setHasLoaded = _d[1];
    useAnimatedReaction(function () {
        return transforms.get().isResting && !hasLoaded;
    }, function (show, prevShow) {
        if (!prevShow && show) {
            runOnJS(setShowLoader)(true);
        }
        else if (prevShow && !show) {
            runOnJS(setShowLoader)(false);
        }
    });
    var type = imageSrc.type;
    var borderRadius = type === 'circle-avi' ? 1e5 : type === 'rect-avi' ? 20 : 0;
    return (_jsx(GestureDetector, { gesture: composedGesture, children: _jsx(Animated.View, { ref: containerRef, style: [styles.container], renderToHardwareTextureAndroid: true, children: _jsxs(Animated.View, { style: containerStyle, children: [showLoader && (_jsx(ActivityIndicator, { size: "small", color: "#FFF", style: styles.loading })), _jsx(Animated.View, { style: imageCropStyle, children: _jsx(Animated.View, { style: imageStyle, children: _jsx(Image, { contentFit: "contain", source: { uri: imageSrc.uri }, placeholderContentFit: "contain", placeholder: { uri: imageSrc.thumbUri }, accessibilityLabel: imageSrc.alt, onLoad: hasLoaded
                                    ? undefined
                                    : function (e) {
                                        setHasLoaded(true);
                                        onLoad({ width: e.source.width, height: e.source.height });
                                    }, style: { flex: 1, borderRadius: borderRadius }, accessibilityHint: "", accessibilityIgnoresInvertColors: true, cachePolicy: "memory" }) }) })] }) }) }));
};
var styles = StyleSheet.create({
    container: {
        height: '100%',
        overflow: 'hidden',
        justifyContent: 'center',
    },
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
});
function getScaledDimensions(imageAspect, scale, screenSize) {
    'worklet';
    var screenAspect = screenSize.width / screenSize.height;
    var isLandscape = imageAspect > screenAspect;
    if (isLandscape) {
        return {
            width: scale * screenSize.width,
            height: (scale * screenSize.width) / imageAspect,
        };
    }
    else {
        return {
            width: scale * screenSize.height * imageAspect,
            height: scale * screenSize.height,
        };
    }
}
function clampTranslation(value, scaledSize, screenSize) {
    'worklet';
    // Figure out how much the user should be allowed to pan, and constrain the translation.
    var panDistance = Math.max(0, (scaledSize - screenSize) / 2);
    var clampedValue = Math.min(Math.max(-panDistance, value), panDistance);
    return clampedValue;
}
function withClampedSpring(value) {
    'worklet';
    return withSpring(value, { overshootClamping: true });
}
export default React.memo(ImageItem);
