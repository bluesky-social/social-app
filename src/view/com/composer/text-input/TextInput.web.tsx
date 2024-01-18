import React from 'react'

import {EventEmitter} from 'eventemitter3'
import isEqual from 'lodash.isequal'

import TextareaAutosize from 'react-textarea-autosize'

import {AppBskyRichtextFacet, RichText} from '@atproto/api'

import './web/styles/style.css'
import {Emoji} from './web/EmojiPicker.web'

import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {blobToDataUri, isUriImage} from 'lib/media/util'

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

const enum Suggestion {
  MENTION,
}

interface MatchedSuggestion {
  type: Suggestion
  range: Range | undefined
  index: number
  length: number
  query: string
}

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

    const modeClass = useColorSchemeStyle('rt-editor-light', 'rt-editor-dark')

    const [cursor, setCursor] = React.useState<number>()
    const [_suggestion, setSuggestion] = React.useState<MatchedSuggestion>()

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
      if (cursor == null) {
        setSuggestion(undefined)
        return
      }

      const text = richtext.text
      const candidate = text.length === cursor ? text : text.slice(0, cursor)

      let match: RegExpExecArray | null
      let type: Suggestion

      if ((match = MENTION_AUTOCOMPLETE_RE.exec(candidate))) {
        type = Suggestion.MENTION
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
          type === Suggestion.MENTION
            ? matched.replace(TRIM_MENTION_RE, '')
            : matched,
      }

      setSuggestion(nextSuggestion)
    }, [richtext, cursor, overlayRef, setSuggestion])

    const textOverlay = React.useMemo(() => {
      return (
        <div className="rt-overlay-inner">
          {Array.from(richtext.segments(), (segment, index) => {
            const isLink = segment.facet
              ? !AppBskyRichtextFacet.isTag(segment.facet.features[0])
              : false

            return (
              <span
                key={index}
                className={
                  `rt-segment ` +
                  (!isLink ? `rt-segment-text` : `rt-segment-link`)
                }>
                {
                  // We need React to commit a text node to DOM so we can select
                  // it for `getCursorPosition` above, without it, we can't open
                  // the emoji picker on an empty input.
                  segment.text || '\u200b'
                }
              </span>
            )
          })}
        </div>
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
        }
      },
      [handleInputSelection, onPressPublish],
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
      </div>
    )
  },
)

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
