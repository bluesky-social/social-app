/**
 * This is basically a fork of the Mention plugin from Tiptap.
 *
 * @see https://github.com/ueberdosis/tiptap/blob/025dfff1d9e4796edf3a451f7f53d06a07b95d69/packages/extension-mention/src/mention.ts
 */

import {mergeAttributes, Node} from '@tiptap/core'
import {Node as ProseMirrorNode} from '@tiptap/pm/model'
import {PluginKey} from '@tiptap/pm/state'
import Suggestion, {SuggestionOptions} from '@tiptap/suggestion'

import {findSuggestionMatch} from './utils'

export type TagOptions = {
  HTMLAttributes: Record<string, any>
  renderLabel: (props: {options: TagOptions; node: ProseMirrorNode}) => string
  suggestion: Omit<SuggestionOptions, 'editor'>
}

export const TagsPluginKey = new PluginKey('tags')

export const Tags = Node.create<TagOptions>({
  name: 'tag',

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({node}) {
        return `#${node.attrs.id}`
      },
      suggestion: {
        char: '#',
        allowSpaces: true,
        pluginKey: TagsPluginKey,
        command: ({editor, range, props}) => {
          const {tag, punctuation} = props

          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter
          const overrideSpace = nodeAfter?.text?.startsWith(' ')

          if (overrideSpace) {
            range.to += 1
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: {id: tag},
              },
              {
                type: 'text',
                text: `${punctuation || ''} `,
              },
            ])
            .run()

          window.getSelection()?.collapseToEnd()
        },
        /**
         * This method and `findSuggestionMatch` below both have to return a
         * truthy value, otherwise the suggestiond plugin will call `onExit`
         * and we lose the ability to add a tag
         */
        allow: ({state, range}) => {
          const $from = state.doc.resolve(range.from)
          const type = state.schema.nodes[this.name]
          const allow = !!$from.parent.type.contentMatch.matchType(type)
          return allow
        },
        findSuggestionMatch({$position}) {
          const text = $position.nodeBefore?.isText && $position.nodeBefore.text
          const cursorPosition = $position.pos

          if (!text) {
            return null
          }

          return findSuggestionMatch({text, cursorPosition})
        },
      },
    }
  },

  group: 'inline',

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }

          return {
            'data-id': attributes.id,
          }
        },
      },

      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }

          return {
            'data-label': attributes.label,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({node, HTMLAttributes}) {
    return [
      'span',
      mergeAttributes(
        {'data-type': this.name},
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    ]
  },

  renderText({node}) {
    return this.options.renderLabel({
      options: this.options,
      node,
    })
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({tr, state}) => {
          let isTag = false
          const {selection} = state
          const {empty, anchor} = selection

          if (!empty) {
            return false
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isTag = true
              tr.insertText(
                this.options.suggestion.char || '',
                pos,
                pos + node.nodeSize,
              )

              return false
            }
          })

          return isTag
        }),
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
