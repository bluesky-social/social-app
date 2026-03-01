import {useCallback, useEffect, useState} from 'react'
import React from 'react'
import {type Editor} from '@tiptap/react'

import emojis from './EmojiPickerData.json'

const emojiList = Object.values(emojis.emojis)

export function useEmojiSuggestion(editor: Editor | null) {
  const [query, setQuery] = useState('')
  const [suggestionPos, setSuggestionPos] = React.useState<{
    top: number
    left: number
  } | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (!editor || suggestionPos === null) return
      const from = editor.state.selection.$anchor.pos - (query.length + 1)
      const to = editor.state.selection.$anchor.pos
      editor
        .chain()
        .focus()
        .deleteRange({from, to})
        .insertContent(emoji + ' ')
        .run()
      setQuery('')
      setSuggestionPos(null)
      setSelectedIndex(0)
    },
    [editor, suggestionPos, query],
  )

  useEffect(() => {
    if (!editor) return

    const updateHandler = () => {
      const state = editor.state
      const pos = editor.state.selection.$anchor.pos
      const {$from} = state.selection
      const textBefore = $from.nodeBefore?.textContent ?? ''

      const fullMatch = textBefore.match(/:([\w-]+):$/)
      if (fullMatch) {
        const emojiId = fullMatch[1]
        const matchEmoji = emojiList.find(e => e.id === emojiId)
        if (matchEmoji) {
          const from = pos - (emojiId.length + 2) // +2 for surrounding colons
          const to = pos
          editor
            .chain()
            .focus()
            .deleteRange({from, to})
            .insertContent(matchEmoji.skins[0].native + ' ')
            .run()
          setQuery('')
          setSuggestionPos(null)
          setSelectedIndex(0)
          return
        }
      }

      const match = textBefore.match(/:([\w-]+)$/)
      const coords = editor.view.coordsAtPos(pos)
      if (match) {
        setQuery(match[1])
        setSuggestionPos({
          top: coords.top + window.scrollY + 20,
          left: coords.left + window.scrollX,
        })
      } else {
        setQuery('')
        setSuggestionPos(null)
        setSelectedIndex(0)
      }
    }

    editor.on('update', updateHandler)
    return () => {
      editor.off('update', updateHandler)
    }
  }, [editor])

  const matches = emojiList
    .filter(
      e =>
        e.id.toLowerCase().includes(query.toLowerCase()) ||
        e.keywords.some(kw => kw.toLowerCase().includes(query.toLowerCase())),
    )
    .slice(0, 7)

  const suggestions = matches.map(e => ({
    id: e.id,
    native: e.skins[0].native,
  }))

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!suggestions.length || suggestionPos === null) return

      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) {
        e.preventDefault()

        if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => (prev + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
          setSelectedIndex(prev =>
            prev === 0 ? suggestions.length - 1 : prev - 1,
          )
        } else if (e.key === 'Tab') {
          insertEmoji(suggestions[selectedIndex].native)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex, suggestionPos, insertEmoji])

  return {
    query,
    suggestions,
    selectedIndex,
    suggestionPos,
    insertEmoji,
  }
}
