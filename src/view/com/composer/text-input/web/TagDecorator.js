/**
 * TipTap is a stateful rich-text editor, which is extremely useful
 * when you _want_ it to be stateful formatting such as bold and italics.
 *
 * However we also use "stateless" behaviors, specifically for URLs
 * where the text itself drives the formatting.
 *
 * This plugin uses a regex to detect URIs and then applies
 * link decorations (a <span> with the "autolink") class. That avoids
 * adding any stateful formatting to TipTap's document model.
 *
 * We then run the URI detection again when constructing the
 * RichText object from TipTap's output and merge their features into
 * the facet-set.
 */
import { CASHTAG_REGEX, TAG_REGEX, TRAILING_PUNCTUATION_REGEX, } from '@atproto/api';
import { Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
function getDecorations(doc) {
    var decorations = [];
    doc.descendants(function (node, pos) {
        if (node.isText && node.text) {
            var regex = TAG_REGEX;
            var textContent = node.textContent;
            // Detect hashtags
            var match = void 0;
            while ((match = regex.exec(textContent))) {
                var matchedString = match[0], __ = match[1], tag = match[2];
                if (!tag || tag.replace(TRAILING_PUNCTUATION_REGEX, '').length > 64)
                    continue;
                var _a = (tag.match(TRAILING_PUNCTUATION_REGEX) || [])[0], trailingPunc = _a === void 0 ? '' : _a;
                var matchedFrom = match.index + matchedString.indexOf(tag);
                var matchedTo = matchedFrom + (tag.length - trailingPunc.length);
                /*
                 * The match is exclusive of `#` so we need to adjust the start of the
                 * highlight by -1 to include the `#`
                 */
                var start = pos + matchedFrom - 1;
                var end = pos + matchedTo;
                decorations.push(Decoration.inline(start, end, {
                    class: 'autolink',
                }));
            }
            // Detect cashtags
            var cashtagRegex = new RegExp(CASHTAG_REGEX.source, 'gu');
            while ((match = cashtagRegex.exec(textContent))) {
                var _fullMatch = match[0], leading = match[1], ticker = match[2];
                if (!ticker)
                    continue;
                // Calculate positions: leading char + $ + ticker
                var matchedFrom = match.index + leading.length;
                var matchedTo = matchedFrom + 1 + ticker.length; // +1 for $
                var start = pos + matchedFrom;
                var end = pos + matchedTo;
                decorations.push(Decoration.inline(start, end, {
                    class: 'autolink',
                }));
            }
        }
    });
    return DecorationSet.create(doc, decorations);
}
var tagDecoratorPlugin = new Plugin({
    key: new PluginKey('link-decorator'),
    state: {
        init: function (_, _a) {
            var doc = _a.doc;
            return getDecorations(doc);
        },
        apply: function (transaction, decorationSet) {
            if (transaction.docChanged) {
                return getDecorations(transaction.doc);
            }
            return decorationSet.map(transaction.mapping, transaction.doc);
        },
    },
    props: {
        decorations: function (state) {
            return tagDecoratorPlugin.getState(state);
        },
    },
});
export var TagDecorator = Mark.create({
    name: 'tag-decorator',
    priority: 1000,
    keepOnSplit: false,
    inclusive: function () {
        return true;
    },
    addProseMirrorPlugins: function () {
        return [tagDecoratorPlugin];
    },
});
