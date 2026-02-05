import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {StyleSheet, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {AppBskyRichtextFacet, RichText} from '@atproto/api'
import {Trans} from '@lingui/macro'
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
import {blobToDataUri, isUriImage} from '#/lib/media/util'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {
  type LinkFacetMatch,
  suggestLinkCardUri,
} from '#/view/com/composer/text-input/text-input-util'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {atoms as a, useAlf} from '#/alf'
import {normalizeTextStyles} from '#/alf/typography'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'
import {type TextInputProps} from './TextInput.types'
import {type AutocompleteRef, createSuggestion} from './web/Autocomplete'
import {type Emoji} from './web/EmojiPicker'
import {LinkDecorator} from './web/LinkDecorator'
import {TagDecorator} from './web/TagDecorator'

export function TextInput({
  ref,
  richtext,
  placeholder,
  webForceMinHeight,
  hasRightPadding,
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

  const [isDropping, setIsDropping] = useState(false)
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

  useEffect(() => {
    if (!isActive) {
      return
    }

    const handleDrop = (event: DragEvent) => {
      const transfer = event.dataTransfer
      if (transfer) {
        const items = transfer.items

        getImageOrVideoFromUri(items, (uri: string) => {
          textInputWebEmitter.emit('media-pasted', uri)
        })
      }

      event.preventDefault()
      setIsDropping(false)
    }
    const handleDragEnter = (event: DragEvent) => {
      const transfer = event.dataTransfer

      event.preventDefault()
      if (transfer && transfer.types.includes('Files')) {
        setIsDropping(true)
      }
    }
    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      setIsDropping(false)
    }

    document.body.addEventListener('drop', handleDrop)
    document.body.addEventListener('dragenter', handleDragEnter)
    document.body.addEventListener('dragover', handleDragEnter)
    document.body.addEventListener('dragleave', handleDragLeave)

    return () => {
      document.body.removeEventListener('drop', handleDrop)
      document.body.removeEventListener('dragenter', handleDragEnter)
      document.body.removeEventListener('dragover', handleDragEnter)
      document.body.removeEventListener('dragleave', handleDragLeave)
    }
  }, [setIsDropping, isActive])

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
    <>
      <View style={[styles.container, hasRightPadding && styles.rightPadding]}>
        {/* @ts-ignore inputStyle is fine */}
        <EditorContent editor={editor} style={inputStyle} />
      </View>

      {isDropping && (
        <Portal>
          <Animated.View
            style={styles.dropContainer}
            entering={FadeIn.duration(80)}
            exiting={FadeOut.duration(80)}>
            <View
              style={[
                t.atoms.bg,
                t.atoms.border_contrast_low,
                styles.dropModal,
              ]}>
              <Text
                style={[
                  a.text_lg,
                  a.font_semi_bold,
                  t.atoms.text_contrast_medium,
                  t.atoms.border_contrast_high,
                  styles.dropText,
                ]}>
                <Trans>Drop to add images</Trans>
              </Text>
            </View>
          </Animated.View>
        </Portal>
      )}
    </>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'flex-start',
    padding: 5,
    marginLeft: 8,
    marginBottom: 10,
  },
  rightPadding: {
    paddingRight: 32,
  },
  dropContainer: {
    backgroundColor: '#0007',
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore web only -prf
    position: 'fixed',
    padding: 16,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  dropModal: {
    // @ts-ignore web only
    boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
    padding: 8,
    borderWidth: 1,
    borderRadius: 16,
  },
  dropText: {
    paddingVertical: 44,
    paddingHorizontal: 36,
    borderStyle: 'dashed',
    borderRadius: 8,
    borderWidth: 2,
  },
})

function getImageOrVideoFromUri(
  items: DataTransferItemList,
  callback: (uri: string) => void,
) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const type = item.type

    if (type === 'text/plain') {
      item.getAsString(async itemString => {
        if (isUriImage(itemString)) {
          const response = await fetch(itemString)
          const blob = await response.blob()

          if (blob.type.startsWith('image/')) {
            blobToDataUri(blob).then(callback, err => console.error(err))
          }

          if (blob.type.startsWith('video/')) {
            blobToDataUri(blob).then(callback, err => console.error(err))
          }
        }
      })
    } else if (type.startsWith('image/')) {
      const file = item.getAsFile()

      if (file) {
        blobToDataUri(file).then(callback, err => console.error(err))
      }
    } else if (type.startsWith('video/')) {
      const file = item.getAsFile()

      if (file) {
        blobToDataUri(file).then(callback, err => console.error(err))
      }
    }
  }
}
