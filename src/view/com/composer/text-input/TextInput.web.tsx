import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'

import {Trans} from '@lingui/macro'

import {EventEmitter} from 'eventemitter3'
import isEqual from 'lodash.isequal'

import TextareaAutosize from 'react-textarea-autosize'

import {AppBskyRichtextFacet, RichText} from '@atproto/api'

import {Emoji} from './web/EmojiPicker.web'
import {
  Autocomplete,
  AutocompleteRef,
  MatchedSuggestion,
} from './web/Autocomplete'

import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {usePalette} from 'lib/hooks/usePalette'
import {blobToDataUri, isUriImage} from 'lib/media/util'

import {Portal} from '#/components/Portal'
import {Text} from '../../util/text/Text'

interface TextInputRef {
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
  onPressPublish: () => Promise<void>
  onSuggestedLinksChanged: (uris: Set<string>) => void
  onError: (err: string) => void
}

export const textInputWebEmitter = new EventEmitter()

const MENTION_AUTOCOMPLETE_RE = /(?<=^|\s)@([a-zA-Z0-9-.]+)$/
const TRIM_MENTION_RE = /[.]+$/

export const TextInput = React.forwardRef<TextInputRef, TextInputProps>(
  function TextInputImpl(
    {
      richtext,
      placeholder,
      suggestedLinks,
      setRichText,
      onPhotoPasted,
      onPressPublish,
      onSuggestedLinksChanged,
      // onError,
    },
    ref,
  ) {
    const overlayRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLTextAreaElement>(null)
    const autocompleteRef = React.useRef<AutocompleteRef>(null)

    const modeClass = useColorSchemeStyle('rt-editor-light', 'rt-editor-dark')
    const pal = usePalette('default')

    const [cursor, setCursor] = React.useState<number>()
    const [suggestion, setSuggestion] = React.useState<MatchedSuggestion>()

    const [isDropping, setIsDropping] = React.useState(false)

    React.useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        getCursorPosition: () => {
          const input = inputRef.current!
          const overlay = overlayRef.current!

          const rangeStart = findNodePosition(overlay, input.selectionStart)
          const rangeEnd = findNodePosition(overlay, input.selectionEnd)

          if (!rangeStart || !rangeEnd) {
            return undefined
          }

          const range = new Range()
          range.setStart(rangeStart.node, rangeStart.position)
          range.setEnd(rangeEnd.node, rangeEnd.position)

          return range.getBoundingClientRect()
        },
      }),
      [inputRef, overlayRef],
    )

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

    React.useEffect(() => {
      if (cursor == null) {
        setSuggestion(undefined)
        return
      }

      const text = richtext.text
      const candidate = text.length === cursor ? text : text.slice(0, cursor)

      let match: RegExpExecArray | null
      let type: MatchedSuggestion['type']

      if ((match = MENTION_AUTOCOMPLETE_RE.exec(candidate))) {
        type = 'mention'
      } else {
        setSuggestion(undefined)
        return
      }

      const overlay = overlayRef.current!

      const start = match.index!
      const length = match[0].length

      const matched = match[1].toLowerCase()

      const rangeStart = findNodePosition(overlay, start)
      const rangeEnd = findNodePosition(overlay, start + length)

      let range: Range | undefined
      if (rangeStart && rangeEnd) {
        range = new Range()
        range.setStart(rangeStart.node, rangeStart.position)
        range.setEnd(rangeEnd.node, rangeEnd.position)
      }

      const nextSuggestion: MatchedSuggestion = {
        type: type,
        range: range,
        index: start,
        length: length,
        query:
          type === 'mention' ? matched.replace(TRIM_MENTION_RE, '') : matched,
      }

      setSuggestion(nextSuggestion)
    }, [richtext, cursor, overlayRef, setSuggestion])

    const textOverlay = React.useMemo(() => {
      let html = ''

      for (const segment of richtext.segments()) {
        const isLink = segment.facet
          ? !AppBskyRichtextFacet.isTag(segment.facet.features[0])
          : false

        const klass =
          `rt-segment ` + (!isLink ? `rt-segment-text` : `rt-segment-link`)
        const text = escape(segment.text, false) || '&#x200B;'

        html += `<span class="${klass}">${text}</span>`
      }

      return (
        <div
          dangerouslySetInnerHTML={{__html: html}}
          className="rt-overlay-inner"
        />
      )
    }, [richtext])

    const handleInputSelection = React.useCallback(() => {
      const textInput = inputRef.current!

      const start = textInput.selectionStart
      const end = textInput.selectionEnd

      setCursor(start === end ? start : undefined)
    }, [inputRef])

    const handleChange = React.useCallback(
      (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = ev.target.value
        const newRt = new RichText({text: newText})
        newRt.detectFacetsWithoutResolution()

        setRichText(newRt)
        handleInputSelection()

        // Gather suggested links
        {
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
        }
      },
      [
        setRichText,
        suggestedLinks,
        onSuggestedLinksChanged,
        handleInputSelection,
      ],
    )

    const handleKeyDown = React.useCallback(
      (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const key = ev.key

        if (key === 'Backspace') {
          setTimeout(handleInputSelection, 0)
        } else if (key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
          ev.preventDefault()
          onPressPublish()
        } else {
          autocompleteRef.current?.handleKeyDown(ev)
        }
      },
      [autocompleteRef, handleInputSelection, onPressPublish],
    )

    const handlePaste = React.useCallback(
      (ev: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = ev.clipboardData?.items ?? []

        for (let idx = 0, len = items.length; idx < len; idx++) {
          const item = items[idx]

          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile()

            if (file) {
              blobToDataUri(file).then(onPhotoPasted, console.error)
            }
          }

          if (item.type === 'text/plain') {
            item.getAsString(async str => {
              if (isUriImage(str)) {
                const response = await fetch(str)
                const blob = await response.blob()

                blobToDataUri(blob).then(onPhotoPasted, console.error)
              }
            })
          }
        }
      },
      [onPhotoPasted],
    )

    const acceptSuggestion = React.useCallback(
      (match: MatchedSuggestion, res: string) => {
        let text: string

        if (match.type === 'mention') {
          text = `@${res} `
        } else {
          return
        }

        const input = inputRef.current!

        input.focus()
        input.selectionStart = match.index
        input.selectionEnd = match.index + match.length

        document.execCommand('insertText', false, text)
      },
      [inputRef],
    )

    React.useLayoutEffect(() => {
      const textInput = inputRef.current!

      const handleSelectionChange = () => {
        if (document.activeElement !== textInput) {
          return
        }

        handleInputSelection()
      }

      const handleEmojiInsert = (emoji: Emoji) => {
        // execCommand('insertText') is the only way to insert text without
        // destroying undo/redo history
        textInput.focus()
        document.execCommand('insertText', false, emoji.native)
      }

      document.addEventListener('selectionchange', handleSelectionChange)
      textInputWebEmitter.addListener('emoji-inserted', handleEmojiInsert)

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange)
        textInputWebEmitter.removeListener('emoji-inserted', handleEmojiInsert)
      }
    }, [inputRef, handleInputSelection])

    return (
      <div className={`rt-editor ` + modeClass}>
        <div ref={overlayRef} className="rt-overlay">
          {textOverlay}
        </div>

        <TextareaAutosize
          ref={inputRef}
          // value={richtext.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="rt-input"
          placeholder={placeholder}
          minRows={6}
        />

        <Autocomplete
          ref={autocompleteRef}
          match={suggestion}
          onSelect={acceptSuggestion}
        />

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
      </div>
    )
  },
)

const styles = StyleSheet.create({
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

const findNodePosition = (
  node: Node,
  position: number,
): {node: Node; position: number} | undefined => {
  if (node.nodeType === Node.TEXT_NODE) {
    return {node, position}
  }

  const children = node.childNodes
  for (let idx = 0, len = children.length; idx < len; idx++) {
    const child = children[idx]
    const textContentLength = child.textContent!.length

    if (position <= textContentLength!) {
      return findNodePosition(child, position)
    }

    position -= textContentLength!
  }

  return
}

const escape = (str: string, attr: boolean) => {
  let escaped = ''
  let last = 0

  for (let idx = 0, len = str.length; idx < len; idx++) {
    const char = str.charCodeAt(idx)

    if (char === 38 || (attr ? char === 34 : char === 60)) {
      escaped += str.substring(last, idx) + ('&#' + char + ';')
      last = idx + 1
    }
  }

  return escaped + str.substring(last)
}

function getImageFromUri(
  items: DataTransferItemList,
  callback: (uri: string) => void,
) {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    const type = item.type

    if (type === 'text/plain') {
      console.log('hit')
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
