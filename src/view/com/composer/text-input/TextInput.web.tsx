import React from 'react'
import {StyleSheet, View} from 'react-native'
import {RichText} from '@atproto/api'
import {useEditor, EditorContent, JSONContent} from '@tiptap/react'
import {Document} from '@tiptap/extension-document'
import {Link} from '@tiptap/extension-link'
import {Mention} from '@tiptap/extension-mention'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Placeholder} from '@tiptap/extension-placeholder'
import {Text} from '@tiptap/extension-text'
import isEqual from 'lodash.isequal'
import {UserAutocompleteViewModel} from 'state/models/user-autocomplete-view'
import {createSuggestion} from './web/Autocomplete'
import {Transaction} from '@tiptap/pm/state'
import {cropAndCompressFlow} from 'lib/media/picker'
import {useStores} from 'state/index'
import {
  POST_IMG_MAX_HEIGHT,
  POST_IMG_MAX_SIZE,
  POST_IMG_MAX_WIDTH,
} from 'lib/constants'
import {getImageInfoFromFile} from 'lib/media/util'

export interface TextInputRef {
  focus: () => void
  blur: () => void
}

interface TextInputProps {
  richtext: RichText
  placeholder: string
  suggestedLinks: Set<string>
  autocompleteView: UserAutocompleteViewModel
  setRichText: (v: RichText) => void
  onPhotoPasted: (uri: string) => void
  onSuggestedLinksChanged: (uris: Set<string>) => void
  onError: (err: string) => void
}

export const TextInput = React.forwardRef(
  (
    {
      richtext,
      placeholder,
      suggestedLinks,
      autocompleteView,
      setRichText,
      onPhotoPasted,
      onSuggestedLinksChanged,
    }: // onError, TODO
    TextInputProps,
    ref,
  ) => {
    const store = useStores()
    const processClipboardItemAsPhoto = async (item: DataTransferItem) => {
      const file = item.getAsFile()

      if (file && file.type && file.type.startsWith('image/')) {
        const {uri, width, height} = await getImageInfoFromFile(file)
        const croppedUri = await cropAndCompressFlow(
          store,
          uri,
          {width, height},
          {width: POST_IMG_MAX_WIDTH, height: POST_IMG_MAX_HEIGHT},
          POST_IMG_MAX_SIZE,
        )
        onPhotoPasted(croppedUri)
      }
    }
    const editor = useEditor({
      extensions: [
        Document,
        Link.configure({
          protocols: ['http', 'https'],
          autolink: true,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: 'mention',
          },
          suggestion: createSuggestion({autocompleteView}),
        }),
        Paragraph,
        Placeholder.configure({
          placeholder,
        }),
        Text,
      ],
      content: richtext.text.toString(),
      autofocus: true,
      editable: true,
      injectCSS: true,
      editorProps: {
        handlePaste(_, event) {
          // It's possible to copy a single screenshot or multiple files
          // In the case of a single screenshot (e.g. cmd+shift+4), this
          // list will be length 1. In the case of selecting multiple
          // files in a file explorer and copying/pasting, this will be
          // those list of copied files
          const items = event.clipboardData?.items

          // Let tiptap know to fallback to default paste behavior
          if (!items || items.length === 0) {
            return false
          }

          // For any pasted images, bring them through the crop and compress flow
          for (const item of Array.from(items)) {
            processClipboardItemAsPhoto(item)
          }

          // Let tiptap know that we handled the paste event
          return true
        },
      },
      onUpdate({editor: editorProp}) {
        const json = editorProp.getJSON()

        const newRt = new RichText({text: editorJsonToText(json).trim()})
        setRichText(newRt)

        const newSuggestedLinks = new Set(editorJsonToLinks(json))
        if (!isEqual(newSuggestedLinks, suggestedLinks)) {
          onSuggestedLinksChanged(newSuggestedLinks)
        }
      },
    })

    React.useImperativeHandle(ref, () => ({
      focus: () => {}, // TODO
      blur: () => {}, // TODO
    }))

    return (
      <View style={styles.container}>
        <EditorContent editor={editor} />
      </View>
    )
  },
)

function editorJsonToText(json: JSONContent): string {
  let text = ''
  if (json.type === 'doc' || json.type === 'paragraph') {
    if (json.content?.length) {
      for (const node of json.content) {
        text += editorJsonToText(node)
      }
    }
    text += '\n'
  } else if (json.type === 'text') {
    text += json.text || ''
  } else if (json.type === 'mention') {
    text += `@${json.attrs?.id || ''}`
  }
  return text
}

function editorJsonToLinks(json: JSONContent): string[] {
  let links: string[] = []
  if (json.content?.length) {
    for (const node of json.content) {
      links = links.concat(editorJsonToLinks(node))
    }
  }

  const link = json.marks?.find(m => m.type === 'link')
  if (link?.attrs?.href) {
    links.push(link.attrs.href)
  }

  return links
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
