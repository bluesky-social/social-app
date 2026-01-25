var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useEffect } from 'react';
import { AccessibilityInfo, Image as RNImage, StyleSheet, useColorScheme, View, } from 'react-native';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { Logotype } from '#/view/icons/Logotype';
// @ts-ignore
import splashImagePointer from '../assets/splash.png';
// @ts-ignore
import darkSplashImagePointer from '../assets/splash-dark.png';
var splashImageUri = RNImage.resolveAssetSource(splashImagePointer).uri;
var darkSplashImageUri = RNImage.resolveAssetSource(darkSplashImagePointer).uri;
export var Logo = React.forwardRef(function LogoImpl(props, ref) {
    var width = 1000;
    var height = width * (67 / 64);
    return (_jsx(Svg, { fill: "none", 
        // @ts-ignore it's fiiiiine
        ref: ref, viewBox: "0 0 64 66", style: [{ width: width, height: height }, props.style], children: _jsx(Path, { fill: props.fill || '#fff', d: "M13.873 3.77C21.21 9.243 29.103 20.342 32 26.3v15.732c0-.335-.13.043-.41.858-1.512 4.414-7.418 21.642-20.923 7.87-7.111-7.252-3.819-14.503 9.125-16.692-7.405 1.252-15.73-.817-18.014-8.93C1.12 22.804 0 8.431 0 6.488 0-3.237 8.579-.18 13.873 3.77ZM50.127 3.77C42.79 9.243 34.897 20.342 32 26.3v15.732c0-.335.13.043.41.858 1.512 4.414 7.418 21.642 20.923 7.87 7.111-7.252 3.819-14.503-9.125-16.692 7.405 1.252 15.73-.817 18.014-8.93C62.88 22.804 64 8.431 64 6.488 64-3.237 55.422-.18 50.127 3.77Z" }) }));
});
export function Splash(props) {
    'use no memo';
    var _this = this;
    var insets = useSafeAreaInsets();
    var intro = useSharedValue(0);
    var outroLogo = useSharedValue(0);
    var outroApp = useSharedValue(0);
    var outroAppOpacity = useSharedValue(0);
    var _a = React.useState(false), isAnimationComplete = _a[0], setIsAnimationComplete = _a[1];
    var _b = React.useState(false), isImageLoaded = _b[0], setIsImageLoaded = _b[1];
    var _c = React.useState(false), isLayoutReady = _c[0], setIsLayoutReady = _c[1];
    var _d = React.useState(false), reduceMotion = _d[0], setReduceMotion = _d[1];
    var isReady = props.isReady &&
        isImageLoaded &&
        isLayoutReady &&
        reduceMotion !== undefined;
    var colorScheme = useColorScheme();
    var isDarkMode = colorScheme === 'dark';
    var logoAnimation = useAnimatedStyle(function () {
        return {
            transform: [
                {
                    scale: interpolate(intro.get(), [0, 1], [0.8, 1], 'clamp'),
                },
                {
                    scale: interpolate(outroLogo.get(), [0, 0.08, 1], [1, 0.8, 500], 'clamp'),
                },
            ],
            opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
        };
    });
    var bottomLogoAnimation = useAnimatedStyle(function () {
        return {
            opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
        };
    });
    var reducedLogoAnimation = useAnimatedStyle(function () {
        return {
            transform: [
                {
                    scale: interpolate(intro.get(), [0, 1], [0.8, 1], 'clamp'),
                },
            ],
            opacity: interpolate(intro.get(), [0, 1], [0, 1], 'clamp'),
        };
    });
    var logoWrapperAnimation = useAnimatedStyle(function () {
        return {
            opacity: interpolate(outroAppOpacity.get(), [0, 0.1, 0.2, 1], [1, 1, 0, 0], 'clamp'),
        };
    });
    var appAnimation = useAnimatedStyle(function () {
        return {
            transform: [
                {
                    scale: interpolate(outroApp.get(), [0, 1], [1.1, 1], 'clamp'),
                },
            ],
            opacity: interpolate(outroAppOpacity.get(), [0, 0.1, 0.2, 1], [0, 0, 1, 1], 'clamp'),
        };
    });
    var onFinish = useCallback(function () { return setIsAnimationComplete(true); }, []);
    var onLayout = useCallback(function () { return setIsLayoutReady(true); }, []);
    var onLoadEnd = useCallback(function () { return setIsImageLoaded(true); }, []);
    useEffect(function () {
        if (isReady) {
            SplashScreen.hideAsync()
                .then(function () {
                intro.set(function () {
                    return withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            // set these values to check animation at specific point
                            outroLogo.set(function () {
                                return withTiming(1, { duration: 1200, easing: Easing.in(Easing.cubic) }, function () {
                                    runOnJS(onFinish)();
                                });
                            });
                            outroApp.set(function () {
                                return withTiming(1, {
                                    duration: 1200,
                                    easing: Easing.inOut(Easing.cubic),
                                });
                            });
                            outroAppOpacity.set(function () {
                                return withTiming(1, {
                                    duration: 1200,
                                    easing: Easing.in(Easing.cubic),
                                });
                            });
                            return [2 /*return*/];
                        });
                    }); });
                });
            })
                .catch(function () { });
        }
    }, [onFinish, intro, outroLogo, outroApp, outroAppOpacity, isReady]);
    useEffect(function () {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }, []);
    var logoAnimations = reduceMotion === true ? reducedLogoAnimation : logoAnimation;
    // special off-spec color for dark mode
    var logoBg = isDarkMode ? '#0F1824' : '#fff';
    return (_jsxs(View, { style: { flex: 1 }, onLayout: onLayout, children: [!isAnimationComplete && (_jsxs(View, { style: StyleSheet.absoluteFillObject, children: [_jsx(Image, { accessibilityIgnoresInvertColors: true, onLoadEnd: onLoadEnd, source: { uri: isDarkMode ? darkSplashImageUri : splashImageUri }, style: StyleSheet.absoluteFillObject }), _jsx(Animated.View, { style: [
                            bottomLogoAnimation,
                            {
                                position: 'absolute',
                                bottom: insets.bottom + 40,
                                left: 0,
                                right: 0,
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                            },
                        ], children: _jsx(Logotype, { fill: "#fff", width: 90 }) })] })), isReady && (_jsxs(_Fragment, { children: [_jsx(Animated.View, { style: [{ flex: 1 }, appAnimation], children: props.children }), !isAnimationComplete && (_jsx(Animated.View, { style: [
                            StyleSheet.absoluteFillObject,
                            logoWrapperAnimation,
                            {
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                transform: [{ translateY: -(insets.top / 2) }, { scale: 0.1 }], // scale from 1000px to 100px
                            },
                        ], children: _jsx(Animated.View, { style: [logoAnimations], children: _jsx(Logo, { fill: logoBg }) }) }))] }))] }));
}
