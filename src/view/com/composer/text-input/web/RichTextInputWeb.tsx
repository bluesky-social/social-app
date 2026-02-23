import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import {AppBskyRichtextFacet, RichText} from '@atproto/api'
import {Document} from '@tiptap/extension-document'
import Hardbreak from '@tiptap/extension-hard-break'
import History from '@tiptap/extension-history'
import {Mention} from '@tiptap/extension-mention'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Placeholder} from '@tiptap/extension-placeholder'
import {Text as TiptapText} from '@tiptap/extension-text'
import {generateJSON} from '@tiptap/html'
import {Fragment, Node, Slice} from '@tiptap/pm/model'
import {EditorContent, type JSONContent, useEditor} from '@tiptap/react'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {
  type LinkFacetMatch,
  suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {atoms as a, useAlf} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'
import {type TextInputProps} from '../TextInput.types'
import {type AutocompleteRef, createSuggestion} from './Autocomplete'
import {type Emoji} from './EmojiPicker'
import {LinkDecorator} from './LinkDecorator'
import {TagDecorator} from './TagDecorator'
import {getImageOrVideoFromUri} from './uri-to-media'

export default function RichTextInputWeb({
  ref,
  richtext,
  placeholder,
  webForceMinHeight,
  isActive,
  setRichText,
  onPhotoPasted,
  onPressPublish,
  onNewLink,
  onFocus,
  autoFocus,
}: TextInputProps) {
  const {theme: t, fonts} = useAlf()
  const autocomplete = useActorAutocompleteFn()
  const modeClass = useColorSchemeStyle('ProseMirror-light', 'ProseMirror-dark')

  const autocompleteRef = useRef<AutocompleteRef>(null)

  const extensions = useMemo(
    () => [
      Document,
      LinkDecorator,
      TagDecorator,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: createSuggestion({autocomplete, autocompleteRef}),
      }),
      Paragraph,
      Placeholder.configure({
        placeholder,
      }),
      TiptapText,
      History,
      Hardbreak,
    ],
    [autocomplete, placeholder],
  )

  useEffect(() => {
    if (!isActive) {
      return
    }
    textInputWebEmitter.addListener('publish', onPressPublish)
    return () => {
      textInputWebEmitter.removeListener('publish', onPressPublish)
    }
  }, [onPressPublish, isActive])

  useEffect(() => {
    if (!isActive) {
      return
    }
    textInputWebEmitter.addListener('media-pasted', onPhotoPasted)
    return () => {
      textInputWebEmitter.removeListener('media-pasted', onPhotoPasted)
    }
  }, [isActive, onPhotoPasted])

  const pastSuggestedUris = useRef(new Set<string>())
  const prevDetectedUris = useRef(new Map<string, LinkFacetMatch>())
  const editor = useEditor(
    {
      extensions,
      coreExtensionOptions: {
        clipboardTextSerializer: {
          blockSeparator: '\n',
        },
      },
      onFocus() {
        onFocus?.()
      },
      editorProps: {
        attributes: {
          class: modeClass,
        },
        clipboardTextParser: (text, context) => {
          const blocks = text.split(/(?:\r\n?|\n)/)
          const nodes: Node[] = blocks.map(line => {
            return Node.fromJSON(
              context.doc.type.schema,
              line.length > 0
                ? {type: 'paragraph', content: [{type: 'text', text: line}]}
                : {type: 'paragraph', content: []},
            )
          })

          const fragment = Fragment.fromArray(nodes)
          return Slice.maxOpen(fragment)
        },
        handlePaste: (view, event) => {
          const clipboardData = event.clipboardData
          let preventDefault = false

          if (clipboardData) {
            if (clipboardData.types.includes('text/html')) {
              // Rich-text formatting is pasted, try retrieving plain text
              const text = clipboardData.getData('text/plain')
              // `pasteText` will invoke this handler again, but `clipboardData` will be null.
              view.pasteText(text)
              preventDefault = true
            }
            getImageOrVideoFromUri(clipboardData.items, (uri: string) => {
              textInputWebEmitter.emit('media-pasted', uri)
            })
            if (preventDefault) {
              // Return `true` to prevent ProseMirror's default paste behavior.
              return true
            }
          }
        },
        handleKeyDown: (view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.code === 'Enter') {
            textInputWebEmitter.emit('publish')
            return true
          }

          if (
            event.code === 'Backspace' &&
            !(event.metaKey || event.altKey || event.ctrlKey)
          ) {
            const isNotSelection = view.state.selection.empty
            if (isNotSelection) {
              const cursorPosition = view.state.selection.$anchor.pos
              const textBefore = view.state.doc.textBetween(
                0,
                cursorPosition,
                // important - use \n as a block separator, otherwise
                // all the lines get mushed together -sfn
                '\n',
              )
              const graphemes = [...splitGraphemes(textBefore)]

              if (graphemes.length > 0) {
                const lastGrapheme = graphemes[graphemes.length - 1]
                // deleteRange doesn't work on newlines, because tiptap
                // treats them as separate 'blocks' and we're using \n
                // as a stand-in. bail out if the last grapheme is a newline
                // to let the default behavior handle it -sfn
                if (lastGrapheme !== '\n') {
                  // otherwise, delete the last grapheme using deleteRange,
                  // so that emojis are deleted as a whole
                  const deleteFrom = cursorPosition - lastGrapheme.length
                  editor?.commands.deleteRange({
                    from: deleteFrom,
                    to: cursorPosition,
                  })
                  return true
                }
              }
            }
          }
        },
      },
      content: generateJSON(richTextToHTML(richtext), extensions, {
        preserveWhitespace: 'full',
      }),
      autofocus: autoFocus ? 'end' : null,
      editable: true,
      injectCSS: true,
      shouldRerenderOnTransaction: false,
      onUpdate({editor: editorProp}) {
        const json = editorProp.getJSON()
        const newText = editorJsonToText(json)
        const isPaste = window.event?.type === 'paste'

        const newRt = new RichText({text: newText})
        newRt.detectFacetsWithoutResolution()
        setRichText(newRt)

        const nextDetectedUris = new Map<string, LinkFacetMatch>()
        if (newRt.facets) {
          for (const facet of newRt.facets) {
            for (const feature of facet.features) {
              if (AppBskyRichtextFacet.isLink(feature)) {
                nextDetectedUris.set(feature.uri, {facet, rt: newRt})
              }
            }
          }
        }

        const suggestedUri = suggestLinkCardUri(
          isPaste,
          nextDetectedUris,
          prevDetectedUris.current,
          pastSuggestedUris.current,
        )
        prevDetectedUris.current = nextDetectedUris
        if (suggestedUri) {
          onNewLink(suggestedUri)
        }
      },
    },
    [modeClass],
  )

  const onEmojiInserted = useCallback(
    (emoji: Emoji) => {
      editor?.chain().focus().insertContent(emoji.native).run()
    },
    [editor],
  )
  useEffect(() => {
    if (!isActive) {
      return
    }
    textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted)
    return () => {
      textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted)
    }
  }, [onEmojiInserted, isActive])

  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.chain().focus()
    },
    blur: () => {
      editor?.chain().blur()
    },
    getCursorPosition: () => {
      const pos = editor?.state.selection.$anchor.pos
      return pos ? editor?.view.coordsAtPos(pos) : undefined
    },
    maybeClosePopup: () => autocompleteRef.current?.maybeClose() ?? false,
  }))

  const inputStyle = useMemo(() => {
    const style = normalizeTextStyles(
      [a.text_lg, a.leading_snug, t.atoms.text],
      {
        fontScale: fonts.scaleMultiplier,
        fontFamily: fonts.family,
        flags: {},
      },
    )
    /*
     * TipTap component isn't a RN View and while it seems to convert
     * `fontSize` to `px`, it doesn't convert `lineHeight`.
     *
     * `lineHeight` should always be defined here, this is defensive.
     */
    style.lineHeight = style.lineHeight
      ? ((style.lineHeight + 'px') as unknown as number)
      : undefined
    style.minHeight = webForceMinHeight ? 140 : undefined
    return style
  }, [t, fonts, webForceMinHeight])

  return (
    // @ts-expect-error inputStyle is fine
    <EditorContent editor={editor} style={inputStyle} />
  )
}

/**
 * Helper function to initialise the editor with RichText, which expects HTML
 *
 * All the extensions are able to initialise themselves from plain text, *except*
 * for the Mention extension - we need to manually convert it into a `<span>` element
 *
 * It also escapes HTML characters
 */
function richTextToHTML(richtext: RichText): string {
  let html = ''

  for (const segment of richtext.segments()) {
    if (segment.mention) {
      html += `<span data-type="mention" data-id="${escapeHTML(segment.mention.did)}"></span>`
    } else {
      html += escapeHTML(segment.text)
    }
  }

  return html
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function editorJsonToText(
  json: JSONContent,
  isLastDocumentChild: boolean = false,
): string {
  let text = ''
  if (json.type === 'doc') {
    if (json.content?.length) {
      for (let i = 0; i < json.content.length; i++) {
        const node = json.content[i]
        const isLastNode = i === json.content.length - 1
        text += editorJsonToText(node, isLastNode)
      }
    }
  } else if (json.type === 'paragraph') {
    if (json.content?.length) {
      for (let i = 0; i < json.content.length; i++) {
        const node = json.content[i]
        text += editorJsonToText(node)
      }
    }
    if (!isLastDocumentChild) {
      text += '\n'
    }
  } else if (json.type === 'hardBreak') {
    text += '\n'
  } else if (json.type === 'text') {
    text += json.text || ''
  } else if (json.type === 'mention') {
    text += `@${json.attrs?.id || ''}`
  }
  return text
}
