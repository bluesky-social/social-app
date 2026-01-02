/**
 * TipTap is a stateful rich-text editor, which is extremely useful
 * when you _want_ it to be stateful formatting such as bold and italics.
 *
 * However we also use "stateless" behaviors, specifically for URLs
 * where the text itself drives the formatting.
 *
 * This plugin detect facets and highlights facets (a <span> with the
 * "facet" class). That avoids adding any stateful formatting to
 * TipTap's document model.
 *
 * We then run the URI detection again when constructing the
 * RichText object from TipTap's output and merge their features into
 * the facet-set.
 */

import {RichText} from '@atproto/api'
import {Mark} from '@tiptap/core'
import {type Node as ProsemirrorNode} from '@tiptap/pm/model'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

export const FacetDecorator = Mark.create({
  name: 'facet-decorator',
  priority: 1000,
  keepOnSplit: false,
  inclusive() {
    return true
  },
  addProseMirrorPlugins() {
    return [facetDecoratorPlugin]
  },
})

const facetDecoratorPlugin: Plugin = new Plugin({
  key: new PluginKey('facet-decorator'),

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
      return facetDecoratorPlugin.getState(state)
    },
  },
})

function getDecorations(doc: ProsemirrorNode) {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return
    }

    const rt = new RichText({text: node.text})
    rt.detectFacetsWithoutResolution()
    if (!rt.facets) {
      return
    }

    for (const facet of rt.facets) {
      decorations.push(
        Decoration.inline(
          pos + rt.unicodeText.slice(0, facet.index.byteStart).length,
          pos + rt.unicodeText.slice(0, facet.index.byteEnd).length,
          {
            class: 'facet',
          },
        ),
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}
