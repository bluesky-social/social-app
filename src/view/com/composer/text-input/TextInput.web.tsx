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
import {Text as TiptapText} from '@tiptap/extension-text'
import isEqual from 'lodash.isequal'
import {createSuggestion} from './web/Autocomplete'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {isUriImage, blobToDataUri} from 'lib/media/util'
import {Emoji} from './web/EmojiPicker.web'
import {LinkDecorator} from './web/LinkDecorator'
import {generateJSON} from '@tiptap/html'
import {useActorAutocompleteFn} from '#/state/queries/actor-autocomplete'
import {usePalette} from '#/lib/hooks/usePalette'
import {Portal} from '#/components/Portal'
import {Text} from '../../util/text/Text'
import {Trans} from '@lingui/macro'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {TagDecorator} from './web/TagDecorator'

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

  const pal = usePalette('default')
  const modeClass = useColorSchemeStyle('ProseMirror-light', 'ProseMirror-dark')

  const [isDropping, setIsDropping] = React.useState(false)

  const extensions = React.useMemo(
    () => [
      Document,
      LinkDecorator,
      TagDecorator,
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
      TiptapText,
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

  React.useEffect(() => {
    const handleDrop = (event: DragEvent) => {
      const transfer = event.dataTransfer
      if (transfer) {
        const items = transfer.items

        getImageFromUri(items, (uri: string) => {
          textInputWebEmitter.emit('photo-pasted', uri)
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
  }, [setIsDropping])

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
    <>
      <View style={styles.container}>
        <EditorContent
          editor={editor}
          style={{color: pal.text.color as string}}
        />
      </View>

      {isDropping && (
        <Portal>
          <Animated.View
            style={styles.dropContainer}
            entering={FadeIn.duration(80)}
            exiting={FadeOut.duration(80)}>
            <View style={[pal.view, pal.border, styles.dropModal]}>
              <Text
                type="lg"
                style={[pal.text, pal.borderDark, styles.dropText]}>
                <Trans>Drop to add images</Trans>
              </Text>
            </View>
          </Animated.View>
        </Portal>
      )}
    </>
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

function getImageFromUri(
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
        }
      })
    } else if (type.startsWith('image/')) {
      const file = item.getAsFile()

      if (file) {
        blobToDataUri(file).then(callback, err => console.error(err))
      }
    }
  }
}
