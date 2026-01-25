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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { useAvatar } from '#/screens/Onboarding/StepProfile/index';
import { atoms as a } from '#/alf';
var LazyViewShot = React.lazy(
// @ts-expect-error dynamic import
function () { return import('react-native-view-shot/src/index'); });
var SIZE_MULTIPLIER = 5;
// This component is supposed to be invisible to the user. We only need this for ViewShot to have something to
// "screenshot".
export var PlaceholderCanvas = React.forwardRef(function PlaceholderCanvas(_a, ref) {
    var _this = this;
    var avatar = useAvatar().avatar;
    var viewshotRef = React.useRef(null);
    var Icon = avatar.placeholder.component;
    var styles = React.useMemo(function () { return ({
        container: [a.absolute, { top: -2000 }],
        imageContainer: [
            a.align_center,
            a.justify_center,
            { height: 150 * SIZE_MULTIPLIER, width: 150 * SIZE_MULTIPLIER },
        ],
    }); }, []);
    React.useImperativeHandle(ref, function () { return ({
        capture: function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = viewshotRef.current) === null || _a === void 0 ? void 0 : _a.capture)) return [3 /*break*/, 2];
                        return [4 /*yield*/, viewshotRef.current.capture()];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2: return [2 /*return*/];
                }
            });
        }); },
    }); });
    return (_jsx(View, { style: styles.container, children: _jsx(React.Suspense, { fallback: null, children: _jsx(LazyViewShot
            // @ts-ignore this library doesn't have types
            , { 
                // @ts-ignore this library doesn't have types
                ref: viewshotRef, options: {
                    fileName: 'placeholderAvatar',
                    format: 'jpg',
                    quality: 0.8,
                    height: 150 * SIZE_MULTIPLIER,
                    width: 150 * SIZE_MULTIPLIER,
                }, children: _jsx(View, { style: [
                        styles.imageContainer,
                        { backgroundColor: avatar.backgroundColor },
                    ], collapsable: false, children: _jsx(Icon, { height: 85 * SIZE_MULTIPLIER, width: 85 * SIZE_MULTIPLIER, style: { color: 'white' } }) }) }) }) }));
});
