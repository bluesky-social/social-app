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
import { UITextView } from 'react-native-uitextview';
import { logger } from '#/logger';
import { atoms, useAlf, useTheme, web } from '#/alf';
import { childHasEmoji, normalizeTextStyles, renderChildrenWithEmoji, } from '#/alf/typography';
export { Text as Span } from 'react-native';
/**
 * Our main text component. Use this most of the time.
 */
export function Text(_a) {
    var children = _a.children, emoji = _a.emoji, style = _a.style, selectable = _a.selectable, title = _a.title, dataSet = _a.dataSet, rest = __rest(_a, ["children", "emoji", "style", "selectable", "title", "dataSet"]);
    var _b = useAlf(), fonts = _b.fonts, flags = _b.flags;
    var t = useTheme();
    var s = normalizeTextStyles([atoms.text_sm, t.atoms.text, style], {
        fontScale: fonts.scaleMultiplier,
        fontFamily: fonts.family,
        flags: flags,
    });
    if (__DEV__) {
        if (!emoji && childHasEmoji(children)) {
            logger.warn(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
            "Text: emoji detected but emoji not enabled: \"".concat(children, "\"\n\nPlease add <Text emoji />'"));
        }
    }
    var shared = __assign({ uiTextView: true, selectable: selectable, style: s, dataSet: Object.assign({ tooltip: title }, dataSet || {}) }, rest);
    return (_jsx(UITextView, __assign({}, shared, { children: renderChildrenWithEmoji(children, shared, emoji !== null && emoji !== void 0 ? emoji : false) })));
}
function createHeadingElement(_a) {
    var level = _a.level;
    return function HeadingElement(_a) {
        var style = _a.style, rest = __rest(_a, ["style"]);
        var attr = web({
            role: 'heading',
            'aria-level': level,
        }) || {};
        return _jsx(Text, __assign({}, attr, rest, { style: style }));
    };
}
/*
 * Use semantic components when it's beneficial to the user or to a web scraper
 */
export var H1 = createHeadingElement({ level: 1 });
export var H2 = createHeadingElement({ level: 2 });
export var H3 = createHeadingElement({ level: 3 });
export var H4 = createHeadingElement({ level: 4 });
export var H5 = createHeadingElement({ level: 5 });
export var H6 = createHeadingElement({ level: 6 });
export function P(_a) {
    var style = _a.style, rest = __rest(_a, ["style"]);
    var attr = web({
        role: 'paragraph',
    }) || {};
    return (_jsx(Text, __assign({}, attr, rest, { style: [atoms.text_md, atoms.leading_relaxed, style] })));
}
