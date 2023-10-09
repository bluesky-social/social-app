/** @see https://github.com/ueberdosis/tiptap/blob/main/packages/extension-mention/src/mention.ts */

import {mergeAttributes, Node} from '@tiptap/core'
import {Node as ProseMirrorNode} from '@tiptap/pm/model'
import {PluginKey} from '@tiptap/pm/state'
import Suggestion, {SuggestionOptions} from '@tiptap/suggestion'

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
      renderLabel({options, node}) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
      },
      suggestion: {
        char: '#',
        allowSpaces: true,
        pluginKey: TagsPluginKey,
        command: ({editor, range, props}) => {
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
                attrs: props,
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run()

          window.getSelection()?.collapseToEnd()
        },
        allow: ({state, range}) => {
          const $from = state.doc.resolve(range.from)
          const type = state.schema.nodes[this.name]
          const allow = !!$from.parent.type.contentMatch.matchType(type)

          return allow
        },
        findSuggestionMatch({$position}) {
          const text = $position.nodeBefore?.isText && $position.nodeBefore.text

          if (!text) {
            return null
          }

          const regex = /(?:^|\s)(#[^\d\s]\S*)(?=\s)?/g
          const puncRegex = /\p{P}+$/gu
          const match = Array.from(text.matchAll(regex)).pop()

          if (
            !match ||
            match.input === undefined ||
            match.index === undefined
          ) {
            return null
          }

          const cursorPosition = $position.pos
          const startIndex = cursorPosition - text.length
          let [matchedString, tag] = match

          const tagWithoutPunctuation = tag.replace(puncRegex, '')
          // allow for multiple ending punctuation marks
          const punctuationIndexOffset =
            tag.length - tagWithoutPunctuation.length

          if (tagWithoutPunctuation.length > 66) return null

          const from = startIndex + match.index + matchedString.indexOf(tag)
          // `to` should not include ending punctuation
          const to = from + tagWithoutPunctuation.length

          if (
            from < cursorPosition &&
            to >= cursorPosition - punctuationIndexOffset
          ) {
            return {
              range: {
                from,
                to,
              },
              // should not include ending punctuation
              query: tagWithoutPunctuation.replace(/^#/, ''),
              // raw text string
              text: matchedString,
            }
          }

          return null
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
    console.log(
      'renderText',
      node,
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    )
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
