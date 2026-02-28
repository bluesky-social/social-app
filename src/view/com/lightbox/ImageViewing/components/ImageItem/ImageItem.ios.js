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
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
var MAX_ORIGINAL_IMAGE_ZOOM = 2;
var MIN_SCREEN_ZOOM = 2;
var ImageItem = function (_a) {
    var imageSrc = _a.imageSrc, onTap = _a.onTap, onZoom = _a.onZoom, onLoad = _a.onLoad, showControls = _a.showControls, measureSafeArea = _a.measureSafeArea, imageAspect = _a.imageAspect, imageDimensions = _a.imageDimensions, dismissSwipePan = _a.dismissSwipePan, transforms = _a.transforms;
    var scrollViewRef = useAnimatedRef();
    var _b = useState(false), scaled = _b[0], setScaled = _b[1];
    var isDragging = useSharedValue(false);
    var screenSizeDelayedForJSThreadOnly = useSafeAreaFrame();
    var maxZoomScale = Math.max(MIN_SCREEN_ZOOM, imageDimensions
        ? (imageDimensions.width / screenSizeDelayedForJSThreadOnly.width) *
            MAX_ORIGINAL_IMAGE_ZOOM
        : 1);
    var scrollHandler = useAnimatedScrollHandler({
        onScroll: function (e) {
            'worklet';
            var nextIsScaled = e.zoomScale > 1;
            if (scaled !== nextIsScaled) {
                runOnJS(handleZoom)(nextIsScaled);
            }
        },
        onBeginDrag: function () {
            'worklet';
            isDragging.value = true;
        },
        onEndDrag: function () {
            'worklet';
            isDragging.value = false;
        },
    });
    function handleZoom(nextIsScaled) {
        onZoom(nextIsScaled);
        setScaled(nextIsScaled);
    }
    function zoomTo(nextZoomRect) {
        var _a;
        var scrollResponderRef = (_a = scrollViewRef === null || scrollViewRef === void 0 ? void 0 : scrollViewRef.current) === null || _a === void 0 ? void 0 : _a.getScrollResponder();
        // @ts-ignore
        scrollResponderRef === null || scrollResponderRef === void 0 ? void 0 : scrollResponderRef.scrollResponderZoomTo(__assign(__assign({}, nextZoomRect), { animated: true }));
    }
    var singleTap = Gesture.Tap().onEnd(function () {
        'worklet';
        runOnJS(onTap)();
    });
    var doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(function (e) {
        'worklet';
        var screenSize = measureSafeArea();
        var absoluteX = e.absoluteX, absoluteY = e.absoluteY;
        var nextZoomRect = {
            x: 0,
            y: 0,
            width: screenSize.width,
            height: screenSize.height,
        };
        var willZoom = !scaled;
        if (willZoom) {
            nextZoomRect = getZoomRectAfterDoubleTap(imageAspect, absoluteX, absoluteY, screenSize);
        }
        runOnJS(zoomTo)(nextZoomRect);
    });
    var composedGesture = Gesture.Exclusive(dismissSwipePan, doubleTap, singleTap);
    var containerStyle = useAnimatedStyle(function () {
        var _a = transforms.get(), scaleAndMoveTransform = _a.scaleAndMoveTransform, isHidden = _a.isHidden;
        return {
            flex: 1,
            transform: scaleAndMoveTransform,
            opacity: isHidden ? 0 : 1,
        };
    });
    var imageCropStyle = useAnimatedStyle(function () {
        var screenSize = measureSafeArea();
        var cropFrameTransform = transforms.get().cropFrameTransform;
        return {
            overflow: 'hidden',
            transform: cropFrameTransform,
            width: screenSize.width,
            maxHeight: screenSize.height,
            alignSelf: 'center',
            aspectRatio: imageAspect !== null && imageAspect !== void 0 ? imageAspect : 1 /* force onLoad */,
            opacity: imageAspect === undefined ? 0 : 1,
        };
    });
    var imageStyle = useAnimatedStyle(function () {
        var cropContentTransform = transforms.get().cropContentTransform;
        return {
            transform: cropContentTransform,
            width: '100%',
            aspectRatio: imageAspect !== null && imageAspect !== void 0 ? imageAspect : 1 /* force onLoad */,
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
    var scrollViewProps = useAnimatedProps(function () { return ({
        // Don't allow bounce at 1:1 rest so it can be swiped away.
        bounces: scaled || isDragging.value,
    }); });
    return (_jsx(GestureDetector, { gesture: composedGesture, children: _jsxs(Animated.ScrollView
        // @ts-ignore Something's up with the types here
        , { 
            // @ts-ignore Something's up with the types here
            ref: scrollViewRef, pinchGestureEnabled: true, showsHorizontalScrollIndicator: false, showsVerticalScrollIndicator: false, maximumZoomScale: maxZoomScale, onScroll: scrollHandler, style: containerStyle, animatedProps: scrollViewProps, centerContent: true, children: [showLoader && (_jsx(ActivityIndicator, { size: "small", color: "#FFF", style: styles.loading })), _jsx(Animated.View, { style: imageCropStyle, children: _jsx(Animated.View, { style: imageStyle, children: _jsx(Image, { contentFit: "contain", source: { uri: imageSrc.uri }, placeholderContentFit: "contain", placeholder: { uri: imageSrc.thumbUri }, style: { flex: 1, borderRadius: borderRadius }, accessibilityLabel: imageSrc.alt, accessibilityHint: "", enableLiveTextInteraction: showControls && !scaled, accessibilityIgnoresInvertColors: true, onLoad: hasLoaded
                                ? undefined
                                : function (e) {
                                    setHasLoaded(true);
                                    onLoad({ width: e.source.width, height: e.source.height });
                                }, cachePolicy: "memory" }) }) })] }) }));
};
var styles = StyleSheet.create({
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    image: {
        flex: 1,
    },
});
var getZoomRectAfterDoubleTap = function (imageAspect, touchX, touchY, screenSize) {
    'worklet';
    if (!imageAspect) {
        return {
            x: 0,
            y: 0,
            width: screenSize.width,
            height: screenSize.height,
        };
    }
    // First, let's figure out how much we want to zoom in.
    // We want to try to zoom in at least close enough to get rid of black bars.
    var screenAspect = screenSize.width / screenSize.height;
    var zoom = Math.max(imageAspect / screenAspect, screenAspect / imageAspect, MIN_SCREEN_ZOOM);
    // Unlike in the Android version, we don't constrain the *max* zoom level here.
    // Instead, this is done in the ScrollView props so that it constraints pinch too.
    // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
    // We already know the zoom level, so this gives us the rectangle size.
    var rectWidth = screenSize.width / zoom;
    var rectHeight = screenSize.height / zoom;
    // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
    // We don't want to introduce new black bars or make existing black bars unbalanced.
    var minX = 0;
    var minY = 0;
    var maxX = screenSize.width - rectWidth;
    var maxY = screenSize.height - rectHeight;
    if (imageAspect >= screenAspect) {
        // The image has horizontal black bars. Exclude them from the safe area.
        var renderedHeight = screenSize.width / imageAspect;
        var horizontalBarHeight = (screenSize.height - renderedHeight) / 2;
        minY += horizontalBarHeight;
        maxY -= horizontalBarHeight;
    }
    else {
        // The image has vertical black bars. Exclude them from the safe area.
        var renderedWidth = screenSize.height * imageAspect;
        var verticalBarWidth = (screenSize.width - renderedWidth) / 2;
        minX += verticalBarWidth;
        maxX -= verticalBarWidth;
    }
    // Finally, we can position the rect according to its size and the safe area.
    var rectX;
    if (maxX >= minX) {
        // Content fills the screen horizontally so we have horizontal wiggle room.
        // Try to keep the tapped point under the finger after zoom.
        rectX = touchX - touchX / zoom;
        rectX = Math.min(rectX, maxX);
        rectX = Math.max(rectX, minX);
    }
    else {
        // Keep the rect centered on the screen so that black bars are balanced.
        rectX = screenSize.width / 2 - rectWidth / 2;
    }
    var rectY;
    if (maxY >= minY) {
        // Content fills the screen vertically so we have vertical wiggle room.
        // Try to keep the tapped point under the finger after zoom.
        rectY = touchY - touchY / zoom;
        rectY = Math.min(rectY, maxY);
        rectY = Math.max(rectY, minY);
    }
    else {
        // Keep the rect centered on the screen so that black bars are balanced.
        rectY = screenSize.height / 2 - rectHeight / 2;
    }
    return {
        x: rectX,
        y: rectY,
        height: rectHeight,
        width: rectWidth,
    };
};
export default React.memo(ImageItem);
