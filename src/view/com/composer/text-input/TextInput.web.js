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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppBskyRichtextFacet, RichText } from '@atproto/api';
import { Trans } from '@lingui/macro';
import { Document } from '@tiptap/extension-document';
import Hardbreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import { Mention } from '@tiptap/extension-mention';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Text as TiptapText } from '@tiptap/extension-text';
import { generateJSON } from '@tiptap/html';
import { Fragment, Node, Slice } from '@tiptap/pm/model';
import { EditorContent, useEditor } from '@tiptap/react';
import { splitGraphemes } from 'unicode-segmenter/grapheme';
import { useColorSchemeStyle } from '#/lib/hooks/useColorSchemeStyle';
import { blobToDataUri, isUriImage } from '#/lib/media/util';
import { useActorAutocompleteFn } from '#/state/queries/actor-autocomplete';
import { suggestLinkCardUri, } from '#/view/com/composer/text-input/text-input-util';
import { textInputWebEmitter } from '#/view/com/composer/text-input/textInputWebEmitter';
import { atoms as a, useAlf } from '#/alf';
import { normalizeTextStyles } from '#/alf/typography';
import { Portal } from '#/components/Portal';
import { Text } from '#/components/Typography';
import { createSuggestion } from './web/Autocomplete';
import { LinkDecorator } from './web/LinkDecorator';
import { TagDecorator } from './web/TagDecorator';
export function TextInput(_a) {
    var ref = _a.ref, richtext = _a.richtext, placeholder = _a.placeholder, webForceMinHeight = _a.webForceMinHeight, hasRightPadding = _a.hasRightPadding, isActive = _a.isActive, setRichText = _a.setRichText, onPhotoPasted = _a.onPhotoPasted, onPressPublish = _a.onPressPublish, onNewLink = _a.onNewLink, onFocus = _a.onFocus;
    var _b = useAlf(), t = _b.theme, fonts = _b.fonts;
    var autocomplete = useActorAutocompleteFn();
    var modeClass = useColorSchemeStyle('ProseMirror-light', 'ProseMirror-dark');
    var _c = useState(false), isDropping = _c[0], setIsDropping = _c[1];
    var autocompleteRef = useRef(null);
    var extensions = useMemo(function () { return [
        Document,
        LinkDecorator,
        TagDecorator,
        Mention.configure({
            HTMLAttributes: {
                class: 'mention',
            },
            suggestion: createSuggestion({ autocomplete: autocomplete, autocompleteRef: autocompleteRef }),
        }),
        Paragraph,
        Placeholder.configure({
            placeholder: placeholder,
        }),
        TiptapText,
        History,
        Hardbreak,
    ]; }, [autocomplete, placeholder]);
    useEffect(function () {
        if (!isActive) {
            return;
        }
        textInputWebEmitter.addListener('publish', onPressPublish);
        return function () {
            textInputWebEmitter.removeListener('publish', onPressPublish);
        };
    }, [onPressPublish, isActive]);
    useEffect(function () {
        if (!isActive) {
            return;
        }
        textInputWebEmitter.addListener('media-pasted', onPhotoPasted);
        return function () {
            textInputWebEmitter.removeListener('media-pasted', onPhotoPasted);
        };
    }, [isActive, onPhotoPasted]);
    useEffect(function () {
        if (!isActive) {
            return;
        }
        var handleDrop = function (event) {
            var transfer = event.dataTransfer;
            if (transfer) {
                var items = transfer.items;
                getImageOrVideoFromUri(items, function (uri) {
                    textInputWebEmitter.emit('media-pasted', uri);
                });
            }
            event.preventDefault();
            setIsDropping(false);
        };
        var handleDragEnter = function (event) {
            var transfer = event.dataTransfer;
            event.preventDefault();
            if (transfer && transfer.types.includes('Files')) {
                setIsDropping(true);
            }
        };
        var handleDragLeave = function (event) {
            event.preventDefault();
            setIsDropping(false);
        };
        document.body.addEventListener('drop', handleDrop);
        document.body.addEventListener('dragenter', handleDragEnter);
        document.body.addEventListener('dragover', handleDragEnter);
        document.body.addEventListener('dragleave', handleDragLeave);
        return function () {
            document.body.removeEventListener('drop', handleDrop);
            document.body.removeEventListener('dragenter', handleDragEnter);
            document.body.removeEventListener('dragover', handleDragEnter);
            document.body.removeEventListener('dragleave', handleDragLeave);
        };
    }, [setIsDropping, isActive]);
    var pastSuggestedUris = useRef(new Set());
    var prevDetectedUris = useRef(new Map());
    var editor = useEditor({
        extensions: extensions,
        coreExtensionOptions: {
            clipboardTextSerializer: {
                blockSeparator: '\n',
            },
        },
        onFocus: function () {
            onFocus === null || onFocus === void 0 ? void 0 : onFocus();
        },
        editorProps: {
            attributes: {
                class: modeClass,
            },
            clipboardTextParser: function (text, context) {
                var blocks = text.split(/(?:\r\n?|\n)/);
                var nodes = blocks.map(function (line) {
                    return Node.fromJSON(context.doc.type.schema, line.length > 0
                        ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
                        : { type: 'paragraph', content: [] });
                });
                var fragment = Fragment.fromArray(nodes);
                return Slice.maxOpen(fragment);
            },
            handlePaste: function (view, event) {
                var clipboardData = event.clipboardData;
                var preventDefault = false;
                if (clipboardData) {
                    if (clipboardData.types.includes('text/html')) {
                        // Rich-text formatting is pasted, try retrieving plain text
                        var text = clipboardData.getData('text/plain');
                        // `pasteText` will invoke this handler again, but `clipboardData` will be null.
                        view.pasteText(text);
                        preventDefault = true;
                    }
                    getImageOrVideoFromUri(clipboardData.items, function (uri) {
                        textInputWebEmitter.emit('media-pasted', uri);
                    });
                    if (preventDefault) {
                        // Return `true` to prevent ProseMirror's default paste behavior.
                        return true;
                    }
                }
            },
            handleKeyDown: function (view, event) {
                if ((event.metaKey || event.ctrlKey) && event.code === 'Enter') {
                    textInputWebEmitter.emit('publish');
                    return true;
                }
                if (event.code === 'Backspace' &&
                    !(event.metaKey || event.altKey || event.ctrlKey)) {
                    var isNotSelection = view.state.selection.empty;
                    if (isNotSelection) {
                        var cursorPosition = view.state.selection.$anchor.pos;
                        var textBefore = view.state.doc.textBetween(0, cursorPosition, 
                        // important - use \n as a block separator, otherwise
                        // all the lines get mushed together -sfn
                        '\n');
                        var graphemes = __spreadArray([], splitGraphemes(textBefore), true);
                        if (graphemes.length > 0) {
                            var lastGrapheme = graphemes[graphemes.length - 1];
                            // deleteRange doesn't work on newlines, because tiptap
                            // treats them as separate 'blocks' and we're using \n
                            // as a stand-in. bail out if the last grapheme is a newline
                            // to let the default behavior handle it -sfn
                            if (lastGrapheme !== '\n') {
                                // otherwise, delete the last grapheme using deleteRange,
                                // so that emojis are deleted as a whole
                                var deleteFrom = cursorPosition - lastGrapheme.length;
                                editor === null || editor === void 0 ? void 0 : editor.commands.deleteRange({
                                    from: deleteFrom,
                                    to: cursorPosition,
                                });
                                return true;
                            }
                        }
                    }
                }
            },
        },
        content: generateJSON(richtext.text.toString(), extensions, {
            preserveWhitespace: 'full',
        }),
        autofocus: 'end',
        editable: true,
        injectCSS: true,
        shouldRerenderOnTransaction: false,
        onCreate: function (_a) {
            var editorProp = _a.editor;
            // HACK
            // the 'enter' animation sometimes causes autofocus to fail
            // (see Composer.web.tsx in shell)
            // so we wait 200ms (the anim is 150ms) and then focus manually
            // -prf
            setTimeout(function () {
                editorProp.chain().focus('end').run();
            }, 200);
        },
        onUpdate: function (_a) {
            var _b;
            var editorProp = _a.editor;
            var json = editorProp.getJSON();
            var newText = editorJsonToText(json);
            var isPaste = ((_b = window.event) === null || _b === void 0 ? void 0 : _b.type) === 'paste';
            var newRt = new RichText({ text: newText });
            newRt.detectFacetsWithoutResolution();
            setRichText(newRt);
            var nextDetectedUris = new Map();
            if (newRt.facets) {
                for (var _i = 0, _c = newRt.facets; _i < _c.length; _i++) {
                    var facet = _c[_i];
                    for (var _d = 0, _e = facet.features; _d < _e.length; _d++) {
                        var feature = _e[_d];
                        if (AppBskyRichtextFacet.isLink(feature)) {
                            nextDetectedUris.set(feature.uri, { facet: facet, rt: newRt });
                        }
                    }
                }
            }
            var suggestedUri = suggestLinkCardUri(isPaste, nextDetectedUris, prevDetectedUris.current, pastSuggestedUris.current);
            prevDetectedUris.current = nextDetectedUris;
            if (suggestedUri) {
                onNewLink(suggestedUri);
            }
        },
    }, [modeClass]);
    var onEmojiInserted = useCallback(function (emoji) {
        editor === null || editor === void 0 ? void 0 : editor.chain().focus().insertContent(emoji.native).run();
    }, [editor]);
    useEffect(function () {
        if (!isActive) {
            return;
        }
        textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted);
        return function () {
            textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted);
        };
    }, [onEmojiInserted, isActive]);
    useImperativeHandle(ref, function () { return ({
        focus: function () {
            editor === null || editor === void 0 ? void 0 : editor.chain().focus();
        },
        blur: function () {
            editor === null || editor === void 0 ? void 0 : editor.chain().blur();
        },
        getCursorPosition: function () {
            var pos = editor === null || editor === void 0 ? void 0 : editor.state.selection.$anchor.pos;
            return pos ? editor === null || editor === void 0 ? void 0 : editor.view.coordsAtPos(pos) : undefined;
        },
        maybeClosePopup: function () { var _a, _b; return (_b = (_a = autocompleteRef.current) === null || _a === void 0 ? void 0 : _a.maybeClose()) !== null && _b !== void 0 ? _b : false; },
    }); });
    var inputStyle = useMemo(function () {
        var style = normalizeTextStyles([a.text_lg, a.leading_snug, t.atoms.text], {
            fontScale: fonts.scaleMultiplier,
            fontFamily: fonts.family,
            flags: {},
        });
        /*
         * TipTap component isn't a RN View and while it seems to convert
         * `fontSize` to `px`, it doesn't convert `lineHeight`.
         *
         * `lineHeight` should always be defined here, this is defensive.
         */
        style.lineHeight = style.lineHeight
            ? (style.lineHeight + 'px')
            : undefined;
        style.minHeight = webForceMinHeight ? 140 : undefined;
        return style;
    }, [t, fonts, webForceMinHeight]);
    return (_jsxs(_Fragment, { children: [_jsx(View, { style: [styles.container, hasRightPadding && styles.rightPadding], children: _jsx(EditorContent, { editor: editor, style: inputStyle }) }), isDropping && (_jsx(Portal, { children: _jsx(Animated.View, { style: styles.dropContainer, entering: FadeIn.duration(80), exiting: FadeOut.duration(80), children: _jsx(View, { style: [
                            t.atoms.bg,
                            t.atoms.border_contrast_low,
                            styles.dropModal,
                        ], children: _jsx(Text, { style: [
                                a.text_lg,
                                a.font_semi_bold,
                                t.atoms.text_contrast_medium,
                                t.atoms.border_contrast_high,
                                styles.dropText,
                            ], children: _jsx(Trans, { children: "Drop to add images" }) }) }) }) }))] }));
}
function editorJsonToText(json, isLastDocumentChild) {
    var _a, _b, _c;
    if (isLastDocumentChild === void 0) { isLastDocumentChild = false; }
    var text = '';
    if (json.type === 'doc') {
        if ((_a = json.content) === null || _a === void 0 ? void 0 : _a.length) {
            for (var i = 0; i < json.content.length; i++) {
                var node = json.content[i];
                var isLastNode = i === json.content.length - 1;
                text += editorJsonToText(node, isLastNode);
            }
        }
    }
    else if (json.type === 'paragraph') {
        if ((_b = json.content) === null || _b === void 0 ? void 0 : _b.length) {
            for (var i = 0; i < json.content.length; i++) {
                var node = json.content[i];
                text += editorJsonToText(node);
            }
        }
        if (!isLastDocumentChild) {
            text += '\n';
        }
    }
    else if (json.type === 'hardBreak') {
        text += '\n';
    }
    else if (json.type === 'text') {
        text += json.text || '';
    }
    else if (json.type === 'mention') {
        text += "@".concat(((_c = json.attrs) === null || _c === void 0 ? void 0 : _c.id) || '');
    }
    return text;
}
var styles = StyleSheet.create({
    container: {
        flex: 1,
        alignSelf: 'flex-start',
        padding: 5,
        marginLeft: 8,
        marginBottom: 10,
    },
    rightPadding: {
        paddingRight: 32,
    },
    dropContainer: {
        backgroundColor: '#0007',
        pointerEvents: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore web only -prf
        position: 'fixed',
        padding: 16,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    dropModal: {
        // @ts-ignore web only
        boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
        padding: 8,
        borderWidth: 1,
        borderRadius: 16,
    },
    dropText: {
        paddingVertical: 44,
        paddingHorizontal: 36,
        borderStyle: 'dashed',
        borderRadius: 8,
        borderWidth: 2,
    },
});
function getImageOrVideoFromUri(items, callback) {
    var _this = this;
    for (var index = 0; index < items.length; index++) {
        var item = items[index];
        var type = item.type;
        if (type === 'text/plain') {
            item.getAsString(function (itemString) { return __awaiter(_this, void 0, void 0, function () {
                var response, blob;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!isUriImage(itemString)) return [3 /*break*/, 3];
                            return [4 /*yield*/, fetch(itemString)];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.blob()];
                        case 2:
                            blob = _a.sent();
                            if (blob.type.startsWith('image/')) {
                                blobToDataUri(blob).then(callback, function (err) { return console.error(err); });
                            }
                            if (blob.type.startsWith('video/')) {
                                blobToDataUri(blob).then(callback, function (err) { return console.error(err); });
                            }
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
        }
        else if (type.startsWith('image/')) {
            var file = item.getAsFile();
            if (file) {
                blobToDataUri(file).then(callback, function (err) { return console.error(err); });
            }
        }
        else if (type.startsWith('video/')) {
            var file = item.getAsFile();
            if (file) {
                blobToDataUri(file).then(callback, function (err) { return console.error(err); });
            }
        }
    }
}
