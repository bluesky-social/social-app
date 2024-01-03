import React from 'react'
import {StyleSheet, View} from 'react-native'
import {RichText, AppBskyRichtextFacet} from '@atproto/api'
import EventEmitter from 'eventemitter3'
import {useEditor, EditorContent, JSONContent} from '@tiptap/react'
import {Document} from '@tiptap/extension-document'
import History from '@tiptap/extension-history'
import Hardbreak from '@tiptap/extension-hard-break'
import {Mention} from '@tiptap/extension-mention'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Placeholder} from '@tiptap/extension-placeholder'
import {Text} from '@tiptap/extension-text'
import isEqual from 'lodash.isequal'
import {createSuggestion} from './web/Autocomplete'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {isUriImage, blobToDataUri} from 'lib/media/util'
import {Emoji} from './web/EmojiPicker.web'
import {LinkDecorator} from './web/LinkDecorator'
import {generateJSON} from '@tiptap/html'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'

export interface TextInputRef {
  focus: () => void
  blur: () => void
  getCursorPosition: () => DOMRect | undefined
}

interface TextInputProps {
  richtext: RichText
  placeholder: string
  suggestedLinks: Set<string>
  setRichText: (v: RichText | ((v: RichText) => RichText)) => void
  onPhotoPasted: (uri: string) => void
  onPressPublish: (richtext: RichText) => Promise<void>
  onSuggestedLinksChanged: (uris: Set<string>) => void
  onError: (err: string) => void
}

export const textInputWebEmitter = new EventEmitter()

export const TextInput = React.forwardRef(function TextInputImpl(
  {
    richtext,
    placeholder,
    suggestedLinks,
    setRichText,
    onPhotoPasted,
    onPressPublish,
    onSuggestedLinksChanged,
  }: // onError, TODO
  TextInputProps,
  ref,
) {
  const autocomplete = useActorAutocompleteFn()

  const modeClass = useColorSchemeStyle('ProseMirror-light', 'ProseMirror-dark')
  const extensions = React.useMemo(
    () => [
      Document,
      LinkDecorator,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: createSuggestion({autocomplete}),
      }),
      Paragraph,
      Placeholder.configure({
        placeholder,
      }),
      Text,
      History,
      Hardbreak,
    ],
    [autocomplete, placeholder],
  )

  React.useEffect(() => {
    textInputWebEmitter.addListener('publish', onPressPublish)
    return () => {
      textInputWebEmitter.removeListener('publish', onPressPublish)
    }
  }, [onPressPublish])
  React.useEffect(() => {
    textInputWebEmitter.addListener('photo-pasted', onPhotoPasted)
    return () => {
      textInputWebEmitter.removeListener('photo-pasted', onPhotoPasted)
    }
  }, [onPhotoPasted])

  const editor = useEditor(
    {
      extensions,
      editorProps: {
        attributes: {
          class: modeClass,
        },
        handlePaste: (_, event) => {
          const items = event.clipboardData?.items

          if (items === undefined) {
            return
          }

          getImageFromUri(items, (uri: string) => {
            textInputWebEmitter.emit('photo-pasted', uri)
          })
        },
        handleKeyDown: (_, event) => {
          if ((event.metaKey || event.ctrlKey) && event.code === 'Enter') {
            textInputWebEmitter.emit('publish')
            return true
          }
        },
      },
      content: generateJSON(richtext.text.toString(), extensions),
      autofocus: 'end',
      editable: true,
      injectCSS: true,
      onCreate({editor: editorProp}) {
        // HACK
        // the 'enter' animation sometimes causes autofocus to fail
        // (see Composer.web.tsx in shell)
        // so we wait 200ms (the anim is 150ms) and then focus manually
        // -prf
        setTimeout(() => {
          editorProp.chain().focus('end').run()
        }, 200)
      },
      onUpdate({editor: editorProp}) {
        const json = editorProp.getJSON()

        const newRt = new RichText({text: editorJsonToText(json).trimEnd()})
        newRt.detectFacetsWithoutResolution()
        setRichText(newRt)

        const set: Set<string> = new Set()

        if (newRt.facets) {
          for (const facet of newRt.facets) {
            for (const feature of facet.features) {
              if (AppBskyRichtextFacet.isLink(feature)) {
                set.add(feature.uri)
              }
            }
          }
        }

        if (!isEqual(set, suggestedLinks)) {
          onSuggestedLinksChanged(set)
        }
      },
    },
    [modeClass],
  )

  const onEmojiInserted = React.useCallback(
    (emoji: Emoji) => {
      editor?.chain().focus().insertContent(emoji.native).run()
    },
    [editor],
  )
  React.useEffect(() => {
    textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted)
    return () => {
      textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted)
    }
  }, [onEmojiInserted])

  React.useImperativeHandle(ref, () => ({
    focus: () => {}, // TODO
    blur: () => {}, // TODO
    getCursorPosition: () => {
      const pos = editor?.state.selection.$anchor.pos
      return pos ? editor?.view.coordsAtPos(pos) : undefined
    },
  }))

  return (
    <View style={styles.container}>
      <EditorContent editor={editor} />
    </View>
  )
})

function editorJsonToText(json: JSONContent): string {
  let text = ''
  if (json.type === 'doc' || json.type === 'paragraph') {
    if (json.content?.length) {
      for (const node of json.content) {
        text += editorJsonToText(node)
      }
    }
    text += '\n'
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
})

function getImageFromUri(
  items: DataTransferItemList,
  callback: (uri: string) => void,
) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const {kind, type} = item

    if (type === 'text/plain') {
      item.getAsString(async itemString => {
        if (isUriImage(itemString)) {
          const response = await fetch(itemString)
          const blob = await response.blob()
          blobToDataUri(blob).then(callback, err => console.error(err))
        }
      })
    }

    if (kind === 'file') {
      const file = item.getAsFile()

      if (file instanceof Blob) {
        blobToDataUri(new Blob([file], {type: item.type})).then(callback, err =>
          console.error(err),
        )
      }
    }
  }
}
