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
import 'react-image-crop/dist/ReactCrop.css';
import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import ReactCrop from 'react-image-crop';
import { manipulateImage, } from '#/state/gallery';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
export function EditImageDialog(props) {
    return (_jsxs(Dialog.Outer, { control: props.control, webOptions: { alignCenter: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, __assign({}, props))] }));
}
function DialogInner(_a) {
    var _this = this;
    var control = _a.control, image = _a.image, onChange = _a.onChange, circularCrop = _a.circularCrop, aspectRatio = _a.aspectRatio;
    var _ = useLingui()._;
    var _b = useState(false), pending = _b[0], setPending = _b[1];
    var ref = useRef(null);
    var cancelButton = useCallback(function () { return (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cancel"], ["Cancel"])))), disabled: pending, onPress: function () { return control.close(); }, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], testID: "cropImageCancelBtn", children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Cancel" }) }) })); }, [control, _, pending]);
    var saveButton = useCallback(function () { return (_jsxs(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Save"], ["Save"])))), onPress: function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setPending(true);
                        return [4 /*yield*/, ((_a = ref.current) === null || _a === void 0 ? void 0 : _a.save())];
                    case 1:
                        _b.sent();
                        setPending(false);
                        return [2 /*return*/];
                }
            });
        }); }, disabled: pending, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], testID: "cropImageSaveBtn", children: [_jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Save" }) }), pending && _jsx(ButtonIcon, { icon: Loader })] })); }, [_, pending]);
    return (_jsx(Dialog.Inner, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Edit image"], ["Edit image"])))), header: _jsx(Dialog.Header, { renderLeft: cancelButton, renderRight: saveButton, children: _jsx(Dialog.HeaderText, { children: _jsx(Trans, { children: "Edit image" }) }) }), children: image && (_jsx(EditImageInner, { saveRef: ref, image: image, onChange: onChange, circularCrop: circularCrop, aspectRatio: aspectRatio }, image.source.id)) }));
}
function EditImageInner(_a) {
    var _this = this;
    var image = _a.image, onChange = _a.onChange, saveRef = _a.saveRef, _b = _a.circularCrop, circularCrop = _b === void 0 ? false : _b, aspectRatio = _a.aspectRatio;
    var t = useTheme();
    var _c = useState(false), isDragging = _c[0], setIsDragging = _c[1];
    var control = Dialog.useDialogContext();
    var source = image.source;
    var initialCrop = getInitialCrop(source, image.manips);
    var _d = useState(initialCrop), crop = _d[0], setCrop = _d[1];
    var onPressSubmit = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, manipulateImage(image, {
                        crop: crop && (crop.width || crop.height) !== 0
                            ? {
                                originX: (crop.x * source.width) / 100,
                                originY: (crop.y * source.height) / 100,
                                width: (crop.width * source.width) / 100,
                                height: (crop.height * source.height) / 100,
                            }
                            : undefined,
                    })];
                case 1:
                    result = _a.sent();
                    control.close(function () {
                        onChange(result);
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [crop, image, source, control, onChange]);
    useImperativeHandle(saveRef, function () { return ({
        save: onPressSubmit,
    }); }, [onPressSubmit]);
    return (_jsxs(View, { style: [
            a.mx_auto,
            a.border,
            t.atoms.border_contrast_low,
            a.rounded_xs,
            a.overflow_hidden,
            a.align_center,
        ], children: [_jsx(ReactCrop, { crop: crop, aspect: aspectRatio, circularCrop: circularCrop, onChange: function (_pixelCrop, percentCrop) { return setCrop(percentCrop); }, className: "ReactCrop--no-animate", onDragStart: function () { return setIsDragging(true); }, onDragEnd: function () { return setIsDragging(false); }, children: _jsx("img", { src: source.path, style: { maxHeight: "50vh" } }) }), isDragging && _jsx(View, { style: [a.fixed, a.inset_0] })] }));
}
var getInitialCrop = function (source, manips) {
    var initialArea = manips === null || manips === void 0 ? void 0 : manips.crop;
    if (initialArea) {
        return {
            unit: '%',
            x: (initialArea.originX / source.width) * 100,
            y: (initialArea.originY / source.height) * 100,
            width: (initialArea.width / source.width) * 100,
            height: (initialArea.height / source.height) * 100,
        };
    }
};
var templateObject_1, templateObject_2, templateObject_3;
