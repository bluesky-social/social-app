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

import {TAG_REGEX, TRAILING_PUNCTUATION_REGEX} from '@atproto/api'
import {Mark} from '@tiptap/core'
import {Node as ProsemirrorNode} from '@tiptap/pm/model'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

function getDecorations(doc: ProsemirrorNode) {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const regex = TAG_REGEX
      const textContent = node.textContent

      let match
      while ((match = regex.exec(textContent))) {
        const [matchedString, _, tag] = match

        if (!tag || tag.replace(TRAILING_PUNCTUATION_REGEX, '').length > 64)
          continue

        const [trailingPunc = ''] = tag.match(TRAILING_PUNCTUATION_REGEX) || []
        const matchedFrom = match.index + matchedString.indexOf(tag)
        const matchedTo = matchedFrom + (tag.length - trailingPunc.length)

        /*
         * The match is exclusive of `#` so we need to adjust the start of the
         * highlight by -1 to include the `#`
         */
        const start = pos + matchedFrom - 1
        const end = pos + matchedTo

        decorations.push(
          Decoration.inline(start, end, {
            class: 'autolink',
          }),
        )
      }
    }
  })

  return DecorationSet.create(doc, decorations)
}

const tagDecoratorPlugin: Plugin = new Plugin({
  key: new PluginKey('link-decorator'),

  state: {
    init: (_, {doc}) => getDecorations(doc),
    apply: (transaction, decorationSet) => {
      if (transaction.docChanged) {
        return getDecorations(transaction.doc)
      }
      return decorationSet.map(transaction.mapping, transaction.doc)
    },
  },

  props: {
    decorations(state) {
      return tagDecoratorPlugin.getState(state)
    },
  },
})

export const TagDecorator = Mark.create({
  name: 'tag-decorator',
  priority: 1000,
  keepOnSplit: false,
  inclusive() {
    return true
  },
  addProseMirrorPlugins() {
    return [tagDecoratorPlugin]
  },
})
