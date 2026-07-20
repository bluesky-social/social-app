import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {type chat} from '#/lexicons'

/**
 * How long a message stays highlighted after scrolling to it, before the flash
 * fades out.
 */
export const MESSAGE_HIGHLIGHT_DURATION_MS = 1500

type HighlightedMessage = {
  id: string
  /**
   * Bumped on every highlight so that re-tapping the same reply re-triggers the
   * flash even while the previous highlight is still active.
   */
  key: number
}

type MessageRepliesContextType = {
  /**
   * The message currently staged for reply in the composer, or null.
   */
  replyTo: chat.bsky.convo.defs.MessageView | null
  setReply: (message: chat.bsky.convo.defs.MessageView) => void
  clearReply: () => void
  /**
   * Scroll the list to a message, if it's currently loaded, and flash it. No-op
   * otherwise.
   */
  scrollToMessage: (messageId: string) => void
  /**
   * The message to flash, or null. Consumers compare against their own id.
   */
  highlightedMessage: HighlightedMessage | null
}

const Context = createContext<MessageRepliesContextType | null>(null)

export function useMessageReplies() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error(
      'useMessageReplies must be used within a MessageRepliesProvider',
    )
  }
  return ctx
}

export function MessageRepliesProvider({
  children,
  scrollToMessage: scrollToMessageRaw,
}: {
  children: React.ReactNode
  /**
   * Performs the actual scroll. Returns true if the message was found and
   * scrolled to, false if it isn't currently loaded (so we know whether to
   * flash it).
   */
  scrollToMessage: (messageId: string) => boolean
}) {
  const [replyTo, setReplyTo] =
    useState<chat.bsky.convo.defs.MessageView | null>(null)
  const [highlightedMessage, setHighlightedMessage] =
    useState<HighlightedMessage | null>(null)
  const highlightKey = useRef(0)
  const clearHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const setReply = useCallback((message: chat.bsky.convo.defs.MessageView) => {
    setReplyTo(message)
  }, [])

  const clearReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const didScroll = scrollToMessageRaw(messageId)
      if (!didScroll) return

      highlightKey.current += 1
      setHighlightedMessage({id: messageId, key: highlightKey.current})
      if (clearHighlightTimeout.current) {
        clearTimeout(clearHighlightTimeout.current)
      }
      clearHighlightTimeout.current = setTimeout(() => {
        setHighlightedMessage(null)
      }, MESSAGE_HIGHLIGHT_DURATION_MS)
    },
    [scrollToMessageRaw],
  )

  useEffect(() => {
    return () => {
      if (clearHighlightTimeout.current) {
        clearTimeout(clearHighlightTimeout.current)
      }
    }
  }, [])

  const ctx = useMemo<MessageRepliesContextType>(
    () => ({
      replyTo,
      setReply,
      clearReply,
      scrollToMessage,
      highlightedMessage,
    }),
    [replyTo, setReply, clearReply, scrollToMessage, highlightedMessage],
  )

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}
