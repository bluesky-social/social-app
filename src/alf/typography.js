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
import { createElement as _createElement } from "react";
import { Children } from 'react';
import { UITextView } from 'react-native-uitextview';
import createEmojiRegex from 'emoji-regex';
import { applyFonts, atoms, flatten } from '#/alf';
import { IS_NATIVE } from '#/env';
import { IS_IOS } from '#/env';
/**
 * Ensures that `lineHeight` defaults to a relative value of `1`, or applies
 * other relative leading atoms.
 *
 * If the `lineHeight` value is > 2, we assume it's an absolute value and
 * returns it as-is.
 */
export function normalizeTextStyles(styles, _a) {
    var _b;
    var fontScale = _a.fontScale, fontFamily = _a.fontFamily;
    var s = (_b = flatten(styles)) !== null && _b !== void 0 ? _b : {};
    // should always be defined on these components
    s.fontSize = (s.fontSize || atoms.text_md.fontSize) * fontScale;
    if (s === null || s === void 0 ? void 0 : s.lineHeight) {
        if (s.lineHeight !== 0 && s.lineHeight <= 2) {
            s.lineHeight = Math.round(s.fontSize * s.lineHeight);
        }
    }
    else if (!IS_NATIVE) {
        s.lineHeight = s.fontSize;
    }
    applyFonts(s, fontFamily);
    return s;
}
var EMOJI = createEmojiRegex();
export function childHasEmoji(children) {
    var hasEmoji = false;
    Children.forEach(children, function (child) {
        if (typeof child === 'string' && createEmojiRegex().test(child)) {
            hasEmoji = true;
        }
    });
    return hasEmoji;
}
export function renderChildrenWithEmoji(children, props, emoji) {
    if (props === void 0) { props = {}; }
    if (!IS_IOS || !emoji) {
        return children;
    }
    return Children.map(children, function (child) {
        if (typeof child !== 'string')
            return child;
        var emojis = child.match(EMOJI);
        if (emojis === null) {
            return child;
        }
        return child.split(EMOJI).map(function (stringPart, index) { return [
            stringPart,
            emojis[index] ? (_createElement(UITextView, __assign({}, props, { style: [props === null || props === void 0 ? void 0 : props.style, { fontFamily: 'System' }], key: index }), emojis[index])) : null,
        ]; });
    });
}
var SINGLE_EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u;
export function isOnlyEmoji(text) {
    return text.length <= 15 && SINGLE_EMOJI_RE.test(text);
}
