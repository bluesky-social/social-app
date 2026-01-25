var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Picker from '@emoji-mart/react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { DismissableLayer, FocusScope } from 'radix-ui/internal';
import { textInputWebEmitter } from '#/view/com/composer/text-input/textInputWebEmitter';
import { atoms as a, flatten } from '#/alf';
import { Portal } from '#/components/Portal';
var HEIGHT_OFFSET = 40;
var WIDTH_OFFSET = 100;
var PICKER_HEIGHT = 435 + HEIGHT_OFFSET;
var PICKER_WIDTH = 350 + WIDTH_OFFSET;
export function EmojiPicker(_a) {
    var _this = this;
    var state = _a.state, close = _a.close, pinToTop = _a.pinToTop;
    var _ = useLingui()._;
    var _b = useWindowDimensions(), height = _b.height, width = _b.width;
    var isShiftDown = React.useRef(false);
    var position = React.useMemo(function () {
        if (pinToTop) {
            return {
                top: state.pos.top - PICKER_HEIGHT + HEIGHT_OFFSET - 10,
                left: state.pos.left,
            };
        }
        var fitsBelow = state.pos.top + PICKER_HEIGHT < height;
        var fitsAbove = PICKER_HEIGHT < state.pos.top;
        var placeOnLeft = PICKER_WIDTH < state.pos.left;
        var screenYMiddle = height / 2 - PICKER_HEIGHT / 2;
        if (fitsBelow) {
            return {
                top: state.pos.top + HEIGHT_OFFSET,
            };
        }
        else if (fitsAbove) {
            return {
                bottom: height - state.pos.bottom + HEIGHT_OFFSET,
            };
        }
        else {
            return {
                top: screenYMiddle,
                left: placeOnLeft ? state.pos.left - PICKER_WIDTH : undefined,
                right: !placeOnLeft
                    ? width - state.pos.right - PICKER_WIDTH
                    : undefined,
            };
        }
    }, [state.pos, height, width, pinToTop]);
    React.useEffect(function () {
        if (!state.isOpen)
            return;
        var onKeyDown = function (e) {
            if (e.key === 'Shift') {
                isShiftDown.current = true;
            }
        };
        var onKeyUp = function (e) {
            if (e.key === 'Shift') {
                isShiftDown.current = false;
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
        return function () {
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('keyup', onKeyUp, true);
        };
    }, [state.isOpen]);
    var onInsert = function (emoji) {
        textInputWebEmitter.emit('emoji-inserted', emoji);
        if (!isShiftDown.current) {
            close();
        }
    };
    if (!state.isOpen)
        return null;
    return (_jsx(Portal, { children: _jsxs(FocusScope.FocusScope, { loop: true, trapped: true, onUnmountAutoFocus: function (e) {
                var nextFocusRef = state.pos.nextFocusRef;
                var node = nextFocusRef === null || nextFocusRef === void 0 ? void 0 : nextFocusRef.current;
                if (node) {
                    e.preventDefault();
                    node.focus();
                }
            }, children: [_jsx(Pressable, { accessible: true, accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close emoji picker"], ["Close emoji picker"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Closes the emoji picker"], ["Closes the emoji picker"])))), onPress: close, style: [a.fixed, a.inset_0] }), _jsx(View, { style: flatten([
                        a.fixed,
                        a.w_full,
                        a.h_full,
                        a.align_center,
                        a.z_10,
                        {
                            top: 0,
                            left: 0,
                            right: 0,
                        },
                    ]), children: _jsx(View, { style: [{ position: 'absolute' }, position], children: _jsx(DismissableLayer.DismissableLayer, { onFocusOutside: function (evt) { return evt.preventDefault(); }, onDismiss: close, children: _jsx(Picker, { data: function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, import('./EmojiPickerData.json')];
                                            case 1: return [2 /*return*/, (_a.sent()).default];
                                        }
                                    });
                                }); }, onEmojiSelect: onInsert, autoFocus: true }) }) }) }), _jsx(Pressable, { accessible: true, accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Close emoji picker"], ["Close emoji picker"])))), accessibilityHint: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Closes the emoji picker"], ["Closes the emoji picker"])))), onPress: close, style: [a.fixed, a.inset_0] })] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
