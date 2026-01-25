import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { AppBskyRichtextFacet, RichText as RichTextAPI } from '@atproto/api';
import { toShortUrl } from '#/lib/strings/url-helpers';
import { atoms as a, flatten } from '#/alf';
import { isOnlyEmoji } from '#/alf/typography';
import { InlineLinkText } from '#/components/Link';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { RichTextTag } from '#/components/RichTextTag';
import { Text } from '#/components/Typography';
var WORD_WRAP = { wordWrap: 1 };
// lifted from facet detection in `RichText` impl, _without_ `gm` flags
var URL_REGEX = /(^|\s|\()((https?:\/\/[\S]+)|((?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/i;
export function RichText(_a) {
    var _b, _c;
    var testID = _a.testID, value = _a.value, style = _a.style, numberOfLines = _a.numberOfLines, disableLinks = _a.disableLinks, selectable = _a.selectable, _d = _a.enableTags, enableTags = _d === void 0 ? false : _d, authorHandle = _a.authorHandle, onLinkPress = _a.onLinkPress, interactiveStyle = _a.interactiveStyle, _e = _a.emojiMultiplier, emojiMultiplier = _e === void 0 ? 1.85 : _e, onLayout = _a.onLayout, onTextLayout = _a.onTextLayout, shouldProxyLinks = _a.shouldProxyLinks;
    var richText = React.useMemo(function () {
        return value instanceof RichTextAPI ? value : new RichTextAPI({ text: value });
    }, [value]);
    var plainStyles = [a.leading_snug, style];
    var interactiveStyles = [plainStyles, interactiveStyle];
    var text = richText.text, facets = richText.facets;
    if (!(facets === null || facets === void 0 ? void 0 : facets.length)) {
        if (isOnlyEmoji(text)) {
            var flattenedStyle = (_b = flatten(style)) !== null && _b !== void 0 ? _b : {};
            var fontSize = ((_c = flattenedStyle.fontSize) !== null && _c !== void 0 ? _c : a.text_sm.fontSize) * emojiMultiplier;
            return (_jsx(Text, { emoji: true, selectable: selectable, testID: testID, style: [plainStyles, { fontSize: fontSize }], onLayout: onLayout, onTextLayout: onTextLayout, 
                // @ts-ignore web only -prf
                dataSet: WORD_WRAP, children: text }));
        }
        return (_jsx(Text, { emoji: true, selectable: selectable, testID: testID, style: plainStyles, numberOfLines: numberOfLines, onLayout: onLayout, onTextLayout: onTextLayout, 
            // @ts-ignore web only -prf
            dataSet: WORD_WRAP, children: text }));
    }
    var els = [];
    var key = 0;
    // N.B. must access segments via `richText.segments`, not via destructuring
    for (var _i = 0, _f = richText.segments(); _i < _f.length; _i++) {
        var segment = _f[_i];
        var link = segment.link;
        var mention = segment.mention;
        var tag = segment.tag;
        if (mention &&
            AppBskyRichtextFacet.validateMention(mention).success &&
            !disableLinks) {
            els.push(_jsx(ProfileHoverCard, { did: mention.did, children: _jsx(InlineLinkText, { selectable: selectable, to: "/profile/".concat(mention.did), style: interactiveStyles, 
                    // @ts-ignore TODO
                    dataSet: WORD_WRAP, shouldProxy: shouldProxyLinks, onPress: onLinkPress, children: segment.text }) }, key));
        }
        else if (link && AppBskyRichtextFacet.validateLink(link).success) {
            var isValidLink = URL_REGEX.test(link.uri);
            if (!isValidLink || disableLinks) {
                els.push(toShortUrl(segment.text));
            }
            else {
                els.push(_jsx(InlineLinkText, { selectable: selectable, to: link.uri, style: interactiveStyles, 
                    // @ts-ignore TODO
                    dataSet: WORD_WRAP, shareOnLongPress: true, shouldProxy: shouldProxyLinks, onPress: onLinkPress, emoji: true, children: toShortUrl(segment.text) }, key));
            }
        }
        else if (!disableLinks &&
            enableTags &&
            tag &&
            AppBskyRichtextFacet.validateTag(tag).success) {
            els.push(_jsx(RichTextTag, { display: segment.text, tag: tag.tag, textStyle: interactiveStyles, authorHandle: authorHandle }, key));
        }
        else {
            els.push(segment.text);
        }
        key++;
    }
    return (_jsx(Text, { emoji: true, selectable: selectable, testID: testID, style: plainStyles, numberOfLines: numberOfLines, onLayout: onLayout, onTextLayout: onTextLayout, 
        // @ts-ignore web only -prf
        dataSet: WORD_WRAP, children: els }));
}
