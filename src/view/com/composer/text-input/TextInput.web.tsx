import React from 'react'
import {StyleSheet, View} from 'react-native'
import {RichText} from '@atproto/api'
import {useEditor, EditorContent, JSONContent} from '@tiptap/react'
import {Document} from '@tiptap/extension-document'
import History from '@tiptap/extension-history'
import {Link} from '@tiptap/extension-link'
import {Mention} from '@tiptap/extension-mention'
import {Paragraph} from '@tiptap/extension-paragraph'
import {Placeholder} from '@tiptap/extension-placeholder'
import {Text} from '@tiptap/extension-text'
import isEqual from 'lodash.isequal'
import {UserAutocompleteModel} from 'state/models/discovery/user-autocomplete'
import {createSuggestion} from './web/Autocomplete'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {isUriImage, blobToDataUri} from 'lib/media/util'

export interface TextInputRef {
  focus: () => void
  blur: () => void
}

interface TextInputProps {
  richtext: RichText
  placeholder: string
  suggestedLinks: Set<string>
  autocompleteView: UserAutocompleteModel
  setRichText: (v: RichText) => void
  onPhotoPasted: (uri: string) => void
  onPressPublish: (richtext: RichText) => Promise<false | undefined>
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
      onPressPublish,
      onSuggestedLinksChanged,
    }: // onError, TODO
    TextInputProps,
    ref,
  ) => {
    const modeClass = useColorSchemeStyle(
      'ProseMirror-light',
      'ProseMirror-dark',
    )

    const editor = useEditor(
      {
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
          History,
        ],
        editorProps: {
          attributes: {
            class: modeClass,
          },
          handlePaste: (_, event) => {
            const items = event.clipboardData?.items

            if (items === undefined) {
              return
            }

            getImageFromUri(items, onPhotoPasted)
          },
          handleKeyDown: (_, event) => {
            if (event.metaKey && event.code === 'Enter') {
              // Workaround relying on previous state from `setRichText` to
              // get the updated text content during editor initialization
              setRichText((state: RichText) => {
                onPressPublish(state)
                return state
              })
            }
          },
        },
        content: richtext.text.toString(),
        autofocus: true,
        editable: true,
        injectCSS: true,
        onUpdate({editor: editorProp}) {
          const json = editorProp.getJSON()

          const newRt = new RichText({text: editorJsonToText(json).trim()})
          setRichText(newRt)

          const newSuggestedLinks = new Set(editorJsonToLinks(json))
          if (!isEqual(newSuggestedLinks, suggestedLinks)) {
            onSuggestedLinksChanged(newSuggestedLinks)
          }
        },
      },
      [modeClass],
    )

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
