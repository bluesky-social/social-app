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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { Text as RNText, View, } from 'react-native';
import { AppBskyRichtextFacet, RichText } from '@atproto/api';
import PasteInput from '@mattermost/react-native-paste-input';
import { POST_IMG_MAX } from '#/lib/constants';
import { downloadAndResize } from '#/lib/media/manip';
import { isUriImage } from '#/lib/media/util';
import { cleanError } from '#/lib/strings/errors';
import { getMentionAt, insertMentionAt } from '#/lib/strings/mention-manip';
import { useTheme } from '#/lib/ThemeContext';
import { suggestLinkCardUri, } from '#/view/com/composer/text-input/text-input-util';
import { atoms as a, useAlf } from '#/alf';
import { normalizeTextStyles } from '#/alf/typography';
import { IS_ANDROID, IS_NATIVE } from '#/env';
import { Autocomplete } from './mobile/Autocomplete';
export function TextInput(_a) {
    var _this = this;
    var ref = _a.ref, richtext = _a.richtext, placeholder = _a.placeholder, hasRightPadding = _a.hasRightPadding, setRichText = _a.setRichText, onPhotoPasted = _a.onPhotoPasted, onNewLink = _a.onNewLink, onError = _a.onError, props = __rest(_a, ["ref", "richtext", "placeholder", "hasRightPadding", "setRichText", "onPhotoPasted", "onNewLink", "onError"]);
    var _b = useAlf(), t = _b.theme, fonts = _b.fonts;
    var textInput = useRef(null);
    var textInputSelection = useRef({ start: 0, end: 0 });
    var theme = useTheme();
    var _c = useState(''), autocompletePrefix = _c[0], setAutocompletePrefix = _c[1];
    var prevLength = useRef(richtext.length);
    useImperativeHandle(ref, function () { return ({
        focus: function () { var _a; return (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.focus(); },
        blur: function () {
            var _a;
            (_a = textInput.current) === null || _a === void 0 ? void 0 : _a.blur();
        },
        getCursorPosition: function () { return undefined; }, // Not implemented on native
        maybeClosePopup: function () { return false; }, // Not needed on native
    }); });
    var pastSuggestedUris = useRef(new Set());
    var prevDetectedUris = useRef(new Map());
    var onChangeText = useCallback(function (newText) { return __awaiter(_this, void 0, void 0, function () {
        var mayBePaste, newRt, cursorPos, prefix, nextDetectedUris, _i, _a, facet, _b, _c, feature, res, suggestedUri;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    mayBePaste = newText.length > prevLength.current + 1;
                    newRt = new RichText({ text: newText });
                    newRt.detectFacetsWithoutResolution();
                    setRichText(newRt);
                    cursorPos = (_e = (_d = textInputSelection.current) === null || _d === void 0 ? void 0 : _d.start) !== null && _e !== void 0 ? _e : 0;
                    prefix = getMentionAt(newText, Math.min(cursorPos, newText.length));
                    if (prefix) {
                        setAutocompletePrefix(prefix.value);
                    }
                    else if (autocompletePrefix) {
                        setAutocompletePrefix('');
                    }
                    nextDetectedUris = new Map();
                    if (!newRt.facets) return [3 /*break*/, 7];
                    _i = 0, _a = newRt.facets;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    facet = _a[_i];
                    _b = 0, _c = facet.features;
                    _f.label = 2;
                case 2:
                    if (!(_b < _c.length)) return [3 /*break*/, 6];
                    feature = _c[_b];
                    if (!AppBskyRichtextFacet.isLink(feature)) return [3 /*break*/, 5];
                    if (!isUriImage(feature.uri)) return [3 /*break*/, 4];
                    return [4 /*yield*/, downloadAndResize({
                            uri: feature.uri,
                            width: POST_IMG_MAX.width,
                            height: POST_IMG_MAX.height,
                            mode: 'contain',
                            maxSize: POST_IMG_MAX.size,
                            timeout: 15e3,
                        })];
                case 3:
                    res = _f.sent();
                    if (res !== undefined) {
                        onPhotoPasted(res.path);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    nextDetectedUris.set(feature.uri, { facet: facet, rt: newRt });
                    _f.label = 5;
                case 5:
                    _b++;
                    return [3 /*break*/, 2];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    suggestedUri = suggestLinkCardUri(mayBePaste, nextDetectedUris, prevDetectedUris.current, pastSuggestedUris.current);
                    prevDetectedUris.current = nextDetectedUris;
                    if (suggestedUri) {
                        onNewLink(suggestedUri);
                    }
                    prevLength.current = newText.length;
                    return [2 /*return*/];
            }
        });
    }); }, [setRichText, autocompletePrefix, onPhotoPasted, onNewLink]);
    var onPaste = useCallback(function (err, files) { return __awaiter(_this, void 0, void 0, function () {
        var uris, uri;
        return __generator(this, function (_a) {
            if (err) {
                return [2 /*return*/, onError(cleanError(err))];
            }
            uris = files.map(function (f) { return f.uri; });
            uri = uris.find(isUriImage);
            if (uri) {
                onPhotoPasted(uri);
            }
            return [2 /*return*/];
        });
    }); }, [onError, onPhotoPasted]);
    var onSelectionChange = useCallback(function (evt) {
        // NOTE we track the input selection using a ref to avoid excessive renders -prf
        textInputSelection.current = evt.nativeEvent.selection;
    }, [textInputSelection]);
    var onSelectAutocompleteItem = useCallback(function (item) {
        var _a;
        onChangeText(insertMentionAt(richtext.text, ((_a = textInputSelection.current) === null || _a === void 0 ? void 0 : _a.start) || 0, item));
        setAutocompletePrefix('');
    }, [onChangeText, richtext, setAutocompletePrefix]);
    var inputTextStyle = useMemo(function () {
        var style = normalizeTextStyles([a.text_lg, a.leading_snug, t.atoms.text], {
            fontScale: fonts.scaleMultiplier,
            fontFamily: fonts.family,
            flags: {},
        });
        /**
         * PasteInput doesn't like `lineHeight`, results in jumpiness
         */
        if (IS_NATIVE) {
            style.lineHeight = undefined;
        }
        /*
         * Android impl of `PasteInput` doesn't support the array syntax for `fontVariant`
         */
        if (IS_ANDROID) {
            // @ts-ignore
            style.fontVariant = style.fontVariant
                ? style.fontVariant.join(' ')
                : undefined;
        }
        return style;
    }, [t, fonts]);
    var textDecorated = useMemo(function () {
        var i = 0;
        return Array.from(richtext.segments()).map(function (segment) {
            return (_jsx(RNText, { style: [
                    inputTextStyle,
                    {
                        color: segment.facet ? t.palette.primary_500 : t.atoms.text.color,
                        marginTop: -1,
                    },
                ], children: segment.text }, i++));
        });
    }, [t, richtext, inputTextStyle]);
    return (_jsxs(View, { style: [a.flex_1, a.pl_md, hasRightPadding && a.pr_4xl], children: [_jsx(PasteInput, __assign({ testID: "composerTextInput", ref: textInput, onChangeText: onChangeText, onPaste: onPaste, onSelectionChange: onSelectionChange, placeholder: placeholder, placeholderTextColor: t.atoms.text_contrast_low.color, keyboardAppearance: theme.colorScheme, autoFocus: props.autoFocus !== undefined ? props.autoFocus : true, allowFontScaling: true, multiline: true, scrollEnabled: false, numberOfLines: 2, 
                // Note: should be the default value, but as of v1.104
                // it switched to "none" on Android
                autoCapitalize: "sentences" }, props, { style: [
                    inputTextStyle,
                    a.w_full,
                    !autocompletePrefix && a.h_full,
                    {
                        textAlignVertical: 'top',
                        minHeight: 60,
                        includeFontPadding: false,
                    },
                    {
                        borderWidth: 1,
                        borderColor: 'transparent',
                    },
                    props.style,
                ], children: textDecorated })), _jsx(Autocomplete, { prefix: autocompletePrefix, onSelect: onSelectAutocompleteItem })] }));
}
