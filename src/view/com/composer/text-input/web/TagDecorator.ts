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

import {Mark} from '@tiptap/core'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {findChildren} from '@tiptap/core'
import {Node as ProsemirrorNode} from '@tiptap/pm/model'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

const TAG_REGEX = /(?:^|\s)(#[^\d\s]\S*)(?=\s)?/g

function getDecorations(doc: ProsemirrorNode) {
  const decorations: Decoration[] = []

  findChildren(doc, node => node.type.name === 'paragraph').forEach(
    paragraphNode => {
      const textContent = paragraphNode.node.textContent

      let match
      while ((match = TAG_REGEX.exec(textContent))) {
        const [, m] = match
        const tag = m.trim().replace(/\p{P}+$/gu, '')
        if (tag.length > 66) continue
        const from = match.index + 1
        const to = from + tag.length + 1
        decorations.push(
          Decoration.inline(paragraphNode.pos + from, paragraphNode.pos + to, {
            class: 'autolink',
          }),
        )
      }
    },
  )

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
