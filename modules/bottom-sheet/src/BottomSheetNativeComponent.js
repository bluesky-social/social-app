var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Dimensions, Platform, useWindowDimensions, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import { IS_IOS } from '#/env';
import { BottomSheetPortalProvider, Context as PortalContext, } from './BottomSheetPortal';
var NativeView = requireNativeViewManager('BottomSheet');
var NativeModule = requireNativeModule('BottomSheet');
var IS_IOS15 = Platform.OS === 'ios' &&
    // semvar - can be 3 segments, so can't use Number(Platform.Version)
    Number(Platform.Version.split('.').at(0)) < 16;
var BottomSheetNativeComponent = /** @class */ (function (_super) {
    __extends(BottomSheetNativeComponent, _super);
    function BottomSheetNativeComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.ref = React.createRef();
        _this.onStateChange = function (event) {
            var _b, _c;
            var state = event.nativeEvent.state;
            var isOpen = state !== 'closed';
            _this.setState({ open: isOpen });
            (_c = (_b = _this.props).onStateChange) === null || _c === void 0 ? void 0 : _c.call(_b, event);
        };
        _this.updateLayout = function () {
            var _b;
            (_b = _this.ref.current) === null || _b === void 0 ? void 0 : _b.updateLayout();
        };
        _this.state = {
            open: false,
        };
        return _this;
    }
    BottomSheetNativeComponent.prototype.present = function () {
        this.setState({ open: true });
    };
    BottomSheetNativeComponent.prototype.dismiss = function () {
        var _b;
        (_b = this.ref.current) === null || _b === void 0 ? void 0 : _b.dismiss();
    };
    BottomSheetNativeComponent.prototype.render = function () {
        var _this = this;
        var _b;
        var Portal = this.context;
        if (!Portal) {
            throw new Error('BottomSheet: You need to wrap your component tree with a <BottomSheetPortalProvider> to use the bottom sheet.');
        }
        if (!this.state.open) {
            return null;
        }
        var extraStyles;
        if (IS_IOS15 && this.state.viewHeight) {
            var screenHeight = Dimensions.get('screen').height;
            var viewHeight = this.state.viewHeight;
            var cornerRadius = (_b = this.props.cornerRadius) !== null && _b !== void 0 ? _b : 0;
            if (viewHeight < screenHeight / 2) {
                extraStyles = {
                    height: viewHeight,
                    marginTop: screenHeight / 2 - viewHeight,
                    borderTopLeftRadius: cornerRadius,
                    borderTopRightRadius: cornerRadius,
                };
            }
        }
        return (_jsx(Portal, { children: _jsx(BottomSheetNativeComponentInner, __assign({}, this.props, { nativeViewRef: this.ref, onStateChange: this.onStateChange, extraStyles: extraStyles, onLayout: function (e) {
                    if (IS_IOS15) {
                        var height = e.nativeEvent.layout.height;
                        _this.setState({ viewHeight: height });
                    }
                    if (Platform.OS === 'android') {
                        // TEMP HACKFIX: I had to timebox this, but this is Bad.
                        // On Android, if you run updateLayout() immediately,
                        // it will take ages to actually run on the native side.
                        // However, adding literally any delay will fix this, including
                        // a console.log() - just sending the log to the CLI is enough.
                        // TODO: Get to the bottom of this and fix it properly! -sfn
                        setTimeout(function () { return _this.updateLayout(); });
                    }
                    else {
                        _this.updateLayout();
                    }
                } })) }));
    };
    var _a;
    _a = BottomSheetNativeComponent;
    BottomSheetNativeComponent.contextType = PortalContext;
    BottomSheetNativeComponent.dismissAll = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(_a, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, NativeModule.dismissAll()];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return BottomSheetNativeComponent;
}(React.Component));
export { BottomSheetNativeComponent };
function BottomSheetNativeComponentInner(_b) {
    var _c;
    var children = _b.children, backgroundColor = _b.backgroundColor, onLayout = _b.onLayout, onStateChange = _b.onStateChange, nativeViewRef = _b.nativeViewRef, extraStyles = _b.extraStyles, rest = __rest(_b, ["children", "backgroundColor", "onLayout", "onStateChange", "nativeViewRef", "extraStyles"]);
    var insets = useSafeAreaInsets();
    var cornerRadius = (_c = rest.cornerRadius) !== null && _c !== void 0 ? _c : 0;
    var screenHeight = useWindowDimensions().height;
    var sheetHeight = IS_IOS ? screenHeight - insets.top : screenHeight;
    return (_jsx(NativeView, __assign({}, rest, { onStateChange: onStateChange, ref: nativeViewRef, style: {
            position: 'absolute',
            height: sheetHeight,
            width: '100%',
        }, containerBackgroundColor: backgroundColor, children: _jsx(View, { style: [
                {
                    flex: 1,
                    backgroundColor: backgroundColor,
                },
                Platform.OS === 'android' && {
                    borderTopLeftRadius: cornerRadius,
                    borderTopRightRadius: cornerRadius,
                    overflow: 'hidden',
                },
                extraStyles,
            ], children: _jsx(View, { onLayout: onLayout, children: _jsx(BottomSheetPortalProvider, { children: children }) }) }) })));
}
