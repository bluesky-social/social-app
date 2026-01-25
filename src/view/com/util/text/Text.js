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
import React from 'react';
import { StyleSheet } from 'react-native';
import { UITextView } from 'react-native-uitextview';
import { lh, s } from '#/lib/styles';
import { useTheme } from '#/lib/ThemeContext';
import { logger } from '#/logger';
import { applyFonts, useAlf } from '#/alf';
import { childHasEmoji, renderChildrenWithEmoji, } from '#/alf/typography';
import { IS_IOS, IS_WEB } from '#/env';
export { Text_DEPRECATED as Text };
/**
 * @deprecated use Text from `#/components/Typography.tsx` instead
 */
function Text_DEPRECATED(_a) {
    var _b = _a.type, type = _b === void 0 ? 'md' : _b, children = _a.children, emoji = _a.emoji, lineHeight = _a.lineHeight, style = _a.style, title = _a.title, dataSet = _a.dataSet, selectable = _a.selectable, props = __rest(_a, ["type", "children", "emoji", "lineHeight", "style", "title", "dataSet", "selectable"]);
    var theme = useTheme();
    var fonts = useAlf().fonts;
    if (__DEV__) {
        if (!emoji && childHasEmoji(children)) {
            logger.warn(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
            "Text: emoji detected but emoji not enabled: \"".concat(children, "\"\n\nPlease add <Text emoji />'"));
        }
    }
    var textProps = React.useMemo(function () {
        var typography = theme.typography[type];
        var lineHeightStyle = lineHeight ? lh(theme, type, lineHeight) : undefined;
        var flattened = StyleSheet.flatten([
            s.black,
            typography,
            lineHeightStyle,
            style,
        ]);
        applyFonts(flattened, fonts.family);
        // should always be defined on `typography`
        // @ts-ignore
        if (flattened.fontSize) {
            // @ts-ignore
            flattened.fontSize = Math.round(
            // @ts-ignore
            flattened.fontSize * fonts.scaleMultiplier);
        }
        return __assign({ uiTextView: selectable && IS_IOS, selectable: selectable, style: flattened, dataSet: IS_WEB
                ? Object.assign({ tooltip: title }, dataSet || {})
                : undefined }, props);
    }, [
        dataSet,
        fonts.family,
        fonts.scaleMultiplier,
        lineHeight,
        props,
        selectable,
        style,
        theme,
        title,
        type,
    ]);
    return (_jsx(UITextView, __assign({}, textProps, { children: renderChildrenWithEmoji(children, textProps, emoji !== null && emoji !== void 0 ? emoji : false) })));
}
