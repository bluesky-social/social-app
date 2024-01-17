import React from 'react'

import {EventEmitter} from 'eventemitter3'
import isEqual from 'lodash.isequal'

import TextareaAutosize from 'react-textarea-autosize'

import {AppBskyRichtextFacet, RichText} from '@atproto/api'

import './web/styles/style.css'

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
  onPressPublish: (richtext: RichText) => Promise<void>
  onSuggestedLinksChanged: (uris: Set<string>) => void
  onError: (err: string) => void
}

export const textInputWebEmitter = new EventEmitter()

export const TextInput = React.forwardRef<TextInputRef, TextInputProps>(
  function TextInputImpl(
    {
      richtext,
      placeholder,
      suggestedLinks,
      setRichText,
      // onPhotoPasted,
      // onPressPublish,
      onSuggestedLinksChanged,
      // onError,
    },
    ref,
  ) {
    const overlayRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLTextAreaElement>(null)

    const [_cursor, setCursor] = React.useState<number>()

    React.useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      getCursorPosition: () => {
        // TODO
        return undefined
      },
    }))

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
                {segment.text}
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
      [setRichText, suggestedLinks, onSuggestedLinksChanged],
    )

    const handleKeyDown = React.useCallback(
      (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const key = ev.key

        if (key === 'Backspace') {
          setTimeout(handleInputSelection, 0)
        }
      },
      [handleInputSelection],
    )

    React.useLayoutEffect(() => {
      const textInput = inputRef.current!

      const handleSelectionChange = () => {
        if (document.activeElement !== textInput) {
          return
        }

        handleInputSelection()
      }

      document.addEventListener('selectionchange', handleSelectionChange)

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange)
      }
    }, [inputRef, handleInputSelection])

    return (
      <div className="rt-editor">
        <div ref={overlayRef} className="rt-overlay">
          {textOverlay}
        </div>

        <TextareaAutosize
          ref={inputRef}
          // value={richtext.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="rt-input"
          placeholder={placeholder}
          minRows={6}
        />
      </div>
    )
  },
)
