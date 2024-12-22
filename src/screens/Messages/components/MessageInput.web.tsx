import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Graphemer from 'graphemer'
import {flushSync} from 'react-dom'
import TextareaAutosize from 'react-textarea-autosize'

import {isSafari, isTouchDevice} from '#/lib/browser'
import {MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {
  Emoji,
  EmojiPickerPosition,
} from '#/view/com/composer/text-input/web/EmojiPicker.web'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useSharedInputStyles} from '#/components/forms/TextField'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile} from '#/components/icons/Emoji'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'
import {useExtractEmbedFromFacets} from './MessageInputEmbed'

export function MessageInput({
  onSendMessage,
  hasEmbed,
  setEmbed,
  children,
  openEmojiPicker,
}: {
  onSendMessage: (message: string) => void
  hasEmbed: boolean
  setEmbed: (embedUrl: string | undefined) => void
  children?: React.ReactNode
  openEmojiPicker?: (pos: EmojiPickerPosition) => void
}) {
  const {isMobile} = useWebMediaQueries()
  const {_} = useLingui()
  const t = useTheme()
  const {getDraft, clearDraft} = useMessageDraft()
  const [message, setMessage] = React.useState(getDraft)

  const inputStyles = useSharedInputStyles()
  const isComposing = React.useRef(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [textAreaHeight, setTextAreaHeight] = React.useState(38)
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null)

  const onSubmit = React.useCallback(() => {
    if (!hasEmbed && message.trim() === '') {
      return
    }
    if (new Graphemer().countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(_(msg`Message is too long`), 'xmark')
      return
    }
    clearDraft()
    onSendMessage(message)
    setMessage('')
    setEmbed(undefined)
  }, [message, onSendMessage, _, clearDraft, hasEmbed, setEmbed])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Don't submit the form when the Japanese or any other IME is composing
      if (isComposing.current) return

      // see https://github.com/bluesky-social/social-app/issues/4178
      // see https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/
      // see https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
      //
      // On Safari, the final keydown event to dismiss the IME - which is the enter key - is also "Enter" below.
      // Obviously, this causes problems because the final dismissal should _not_ submit the text, but should just
      // stop the IME editing. This is the behavior of Chrome and Firefox, but not Safari.
      //
      // Keycode is deprecated, however the alternative seems to only be to compare the timestamp from the
      // onCompositionEnd event to the timestamp of the keydown event, which is not reliable. For example, this hack
      // uses that method: https://github.com/ProseMirror/prosemirror-view/pull/44. However, from my 500ms resulted in
      // far too long of a delay, and a subsequent enter press would often just end up doing nothing. A shorter time
      // frame was also not great, since it was too short to be reliable (i.e. an older system might have a larger
      // time gap between the two events firing.
      if (isSafari && e.key === 'Enter' && e.keyCode === 229) {
        return
      }

      if (e.key === 'Enter') {
        if (e.shiftKey) return
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit],
  )

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
    },
    [],
  )

  const onEmojiInserted = React.useCallback(
    (emoji: Emoji) => {
      if (!textAreaRef.current) {
        return
      }
      const position = textAreaRef.current.selectionStart ?? 0
      textAreaRef.current.focus()
      flushSync(() => {
        setMessage(
          message =>
            message.slice(0, position) + emoji.native + message.slice(position),
        )
      })
      textAreaRef.current.selectionStart = position + emoji.native.length
      textAreaRef.current.selectionEnd = position + emoji.native.length
    },
    [setMessage],
  )
  React.useEffect(() => {
    textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted)
    return () => {
      textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted)
    }
  }, [onEmojiInserted])

  useSaveMessageDraft(message)
  useExtractEmbedFromFacets(message, setEmbed)

  return (
    <View style={a.p_sm}>
      {children}
      <View
        style={[
          a.flex_row,
          t.atoms.bg_contrast_25,
          {
            paddingRight: a.p_sm.padding - 2,
            paddingLeft: a.p_sm.padding - 2,
            borderWidth: 1,
            borderRadius: 23,
            borderColor: 'transparent',
            height: textAreaHeight + 23,
          },
          isHovered && inputStyles.chromeHover,
          isFocused && inputStyles.chromeFocus,
        ]}
        // @ts-expect-error web only
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <Button
          onPress={e => {
            e.currentTarget.measure((_fx, _fy, _width, _height, px, py) => {
              openEmojiPicker?.({
                top: py,
                left: px,
                right: px,
                bottom: py,
                nextFocusRef:
                  textAreaRef as unknown as React.MutableRefObject<HTMLElement>,
              })
            })
          }}
          style={[
            a.rounded_full,
            a.overflow_hidden,
            a.align_center,
            a.justify_center,
            {
              marginTop: 5,
              height: 30,
              width: 30,
            },
          ]}
          label={_(msg`Open emoji picker`)}>
          {state => (
            <View
              style={[
                a.absolute,
                a.inset_0,
                a.align_center,
                a.justify_center,
                {
                  backgroundColor:
                    state.hovered || state.focused || state.pressed
                      ? t.atoms.bg.backgroundColor
                      : undefined,
                },
              ]}>
              <EmojiSmile size="lg" />
            </View>
          )}
        </Button>
        <TextareaAutosize
          ref={textAreaRef}
          style={StyleSheet.flatten([
            a.flex_1,
            a.px_sm,
            a.border_0,
            t.atoms.text,
            {
              paddingTop: 10,
              backgroundColor: 'transparent',
              resize: 'none',
            },
          ])}
          maxRows={12}
          placeholder={_(msg`Write a message`)}
          defaultValue=""
          value={message}
          dirName="ltr"
          autoFocus={true}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onCompositionStart={() => {
            isComposing.current = true
          }}
          onCompositionEnd={() => {
            isComposing.current = false
          }}
          onHeightChange={height => setTextAreaHeight(height)}
          onChange={onChange}
          // On mobile web phones, we want to keep the same behavior as the native app. Do not submit the message
          // in these cases.
          onKeyDown={isTouchDevice && isMobile ? undefined : onKeyDown}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={_(msg`Send message`)}
          accessibilityHint=""
          style={[
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {
              height: 30,
              width: 30,
              marginTop: 5,
              backgroundColor: t.palette.primary_500,
            },
          ]}
          onPress={onSubmit}>
          <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
        </Pressable>
      </View>
    </View>
  )
}
