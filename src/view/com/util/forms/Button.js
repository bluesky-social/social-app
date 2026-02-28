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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, } from 'react-native';
import { choose } from '#/lib/functions';
import { useTheme } from '#/lib/ThemeContext';
import { Text } from '../text/Text';
/**
 * @deprecated use Button from `#/components/Button.tsx` instead
 */
export function Button(_a) {
    var _this = this;
    var _b = _a.type, type = _b === void 0 ? 'primary' : _b, label = _a.label, style = _a.style, labelContainerStyle = _a.labelContainerStyle, labelStyle = _a.labelStyle, onPress = _a.onPress, children = _a.children, testID = _a.testID, accessibilityLabel = _a.accessibilityLabel, accessibilityHint = _a.accessibilityHint, accessibilityLabelledBy = _a.accessibilityLabelledBy, onAccessibilityEscape = _a.onAccessibilityEscape, _c = _a.withLoading, withLoading = _c === void 0 ? false : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d;
    var theme = useTheme();
    var typeOuterStyle = choose(type, {
        primary: {
            backgroundColor: theme.palette.primary.background,
        },
        secondary: {
            backgroundColor: theme.palette.secondary.background,
        },
        default: {
            backgroundColor: theme.palette.default.backgroundLight,
        },
        inverted: {
            backgroundColor: theme.palette.inverted.background,
        },
        'primary-outline': {
            backgroundColor: theme.palette.default.background,
            borderWidth: 1,
            borderColor: theme.palette.primary.border,
        },
        'secondary-outline': {
            backgroundColor: theme.palette.default.background,
            borderWidth: 1,
            borderColor: theme.palette.secondary.border,
        },
        'primary-light': {
            backgroundColor: theme.palette.default.background,
        },
        'secondary-light': {
            backgroundColor: theme.palette.default.background,
        },
        'default-light': {
            backgroundColor: theme.palette.default.background,
        },
    });
    var typeLabelStyle = choose(type, {
        primary: {
            color: theme.palette.primary.text,
            fontWeight: '600',
        },
        secondary: {
            color: theme.palette.secondary.text,
            fontWeight: theme.palette.secondary.isLowContrast ? '600' : undefined,
        },
        default: {
            color: theme.palette.default.text,
        },
        inverted: {
            color: theme.palette.inverted.text,
            fontWeight: '600',
        },
        'primary-outline': {
            color: theme.palette.primary.textInverted,
            fontWeight: theme.palette.primary.isLowContrast ? '600' : undefined,
        },
        'secondary-outline': {
            color: theme.palette.secondary.textInverted,
            fontWeight: theme.palette.secondary.isLowContrast ? '600' : undefined,
        },
        'primary-light': {
            color: theme.palette.primary.textInverted,
            fontWeight: theme.palette.primary.isLowContrast ? '600' : undefined,
        },
        'secondary-light': {
            color: theme.palette.secondary.textInverted,
            fontWeight: theme.palette.secondary.isLowContrast ? '600' : undefined,
        },
        'default-light': {
            color: theme.palette.default.text,
            fontWeight: theme.palette.default.isLowContrast ? '600' : undefined,
        },
    });
    var _e = React.useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var onPressWrapped = React.useCallback(function (event) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.stopPropagation();
                    event.preventDefault();
                    if (withLoading)
                        setIsLoading(true);
                    return [4 /*yield*/, (onPress === null || onPress === void 0 ? void 0 : onPress(event))];
                case 1:
                    _a.sent();
                    if (withLoading)
                        setIsLoading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [onPress, withLoading]);
    var getStyle = React.useCallback(function (state) {
        var arr = [typeOuterStyle, styles.outer, style];
        if (state.pressed) {
            arr.push({ opacity: 0.6 });
        }
        else if (state.hovered) {
            arr.push({ opacity: 0.8 });
        }
        return arr;
    }, [typeOuterStyle, style]);
    var renderChildern = React.useCallback(function () {
        if (!label) {
            return children;
        }
        return (_jsxs(View, { style: [styles.labelContainer, labelContainerStyle], children: [label && withLoading && isLoading ? (_jsx(ActivityIndicator, { size: 12, color: typeLabelStyle.color })) : null, _jsx(Text, { type: "button", style: [typeLabelStyle, labelStyle], children: label })] }));
    }, [
        children,
        label,
        withLoading,
        isLoading,
        labelContainerStyle,
        typeLabelStyle,
        labelStyle,
    ]);
    return (_jsx(Pressable, { style: getStyle, onPress: onPressWrapped, disabled: disabled || isLoading, testID: testID, accessibilityRole: "button", accessibilityLabel: accessibilityLabel, accessibilityHint: accessibilityHint, accessibilityLabelledBy: accessibilityLabelledBy, onAccessibilityEscape: onAccessibilityEscape, children: renderChildern }));
}
var styles = StyleSheet.create({
    outer: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
    },
    labelContainer: {
        flexDirection: 'row',
        gap: 8,
    },
});
