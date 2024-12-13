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

import {URL_REGEX} from '@atproto/api'
import {Mark} from '@tiptap/core'
import {Node as ProsemirrorNode} from '@tiptap/pm/model'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'

import {isValidDomain} from '#/lib/strings/url-helpers'

export const LinkDecorator = Mark.create({
  name: 'link-decorator',
  priority: 1000,
  keepOnSplit: false,
  inclusive() {
    return true
  },
  addProseMirrorPlugins() {
    return [linkDecorator()]
  },
})

function getDecorations(doc: ProsemirrorNode) {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const textContent = node.textContent

      // links
      iterateUris(textContent, (from, to) => {
        decorations.push(
          Decoration.inline(pos + from, pos + to, {
            class: 'autolink',
          }),
        )
      })
    }
  })

  return DecorationSet.create(doc, decorations)
}

function linkDecorator() {
  const linkDecoratorPlugin: Plugin = new Plugin({
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
        return linkDecoratorPlugin.getState(state)
      },
    },
  })
  return linkDecoratorPlugin
}

function iterateUris(str: string, cb: (from: number, to: number) => void) {
  let match
  const re = URL_REGEX
  while ((match = re.exec(str))) {
    let uri = match[2]
    if (!uri.startsWith('http')) {
      const domain = match.groups?.domain
      if (!domain || !isValidDomain(domain)) {
        continue
      }
      uri = `https://${uri}`
    }
    let from = str.indexOf(match[2], match.index)
    let to = from + match[2].length
    // strip ending puncuation
    if (/[.,;!?]$/.test(uri)) {
      uri = uri.slice(0, -1)
      to--
    }
    if (/[)]$/.test(uri) && !uri.includes('(')) {
      uri = uri.slice(0, -1)
      to--
    }
    cb(from, to)
  }
}
