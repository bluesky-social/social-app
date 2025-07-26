import {Extension} from '@tiptap/core'
import {type Node as ProsemirrorNode} from '@tiptap/pm/model'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'
import Graphemer from 'graphemer'

import {MAX_GRAPHEME_LENGTH} from '#/lib/constants'

export const CharacterLimitDecorator = Extension.create({
  name: 'characterLimit',

  addProseMirrorPlugins() {
    return [characterLimitPlugin()]
  },
})

function getDecorations(doc: ProsemirrorNode, splitter: Graphemer) {
  const decorations: Decoration[] = []

  // Calculate the actual text content including mentions
  let fullText = ''
  doc.descendants(node => {
    if (node.isText) {
      fullText += node.text || ''
    } else if (node.type.name === 'mention') {
      fullText += `@${node.attrs?.id || ''}`
    }
  })

  const graphemes = splitter.splitGraphemes(fullText)

  if (graphemes.length > MAX_GRAPHEME_LENGTH) {
    // Find the string position where the limit is exceeded
    const validText = graphemes.slice(0, MAX_GRAPHEME_LENGTH).join('')
    const limitPos = validText.length

    let currentPos = 0

    // Walk through the document to find text nodes and mentions
    doc.descendants((node, pos) => {
      if (node.isText) {
        const nodeText = node.text || ''
        const nodeStart = currentPos
        const nodeEnd = currentPos + nodeText.length

        // Check if this text node contains over-limit characters
        if (nodeEnd > limitPos) {
          const overLimitStart = Math.max(0, limitPos - nodeStart)
          const overLimitEnd = nodeText.length

          if (overLimitStart < overLimitEnd) {
            // Create decoration for the over-limit portion
            const from = pos + overLimitStart
            const to = pos + overLimitEnd

            decorations.push(
              Decoration.inline(from, to, {
                style: 'background-color: rgba(248, 113, 113, 0.3);',
                class: 'character-limit-exceeded',
              }),
            )
          }
        }

        currentPos = nodeEnd
      } else if (node.type.name === 'mention') {
        // Handle mention nodes - they contribute to the text length
        const mentionText = `@${node.attrs?.id || ''}`
        const nodeStart = currentPos
        const nodeEnd = currentPos + mentionText.length

        // Check if this mention is over the limit
        if (nodeStart >= limitPos) {
          // Entire mention is over the limit
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              style: 'background-color: rgba(248, 113, 113, 0.3);',
              class: 'character-limit-exceeded',
            }),
          )
        }

        currentPos = nodeEnd
      }
    })
  }

  return DecorationSet.create(doc, decorations)
}

function characterLimitPlugin() {
  const splitter = new Graphemer()

  const characterLimitPlugin: Plugin = new Plugin({
    key: new PluginKey('characterLimit'),

    state: {
      init: (_, {doc}) => getDecorations(doc, splitter),
      apply: (transaction, decorationSet) => {
        if (transaction.docChanged) {
          return getDecorations(transaction.doc, splitter)
        }
        return decorationSet.map(transaction.mapping, transaction.doc)
      },
    },

    props: {
      decorations(state) {
        return characterLimitPlugin.getState(state)
      },
    },
  })
  return characterLimitPlugin
}
