import {useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {isBskyPostUrl} from '#/lib/strings/url-helpers'
import {useEmail} from '#/state/email-verification'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {textInputWebEmitter} from '#/view/com/composer/text-input/textInputWebEmitter'
import {
  type Emoji,
  EmojiPicker,
  type EmojiPickerState,
} from '#/view/com/composer/text-input/web/EmojiPicker'
import {atoms as a, useTheme} from '#/alf'
import {Composer, useComposerInternalApiRef} from '#/components/Composer'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmile} from '#/components/icons/Emoji'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'
import * as Toast from '#/components/Toast'
import {IS_WEB} from '#/env'

export function MessageComposer({
  textInputId,
  onSendMessage,
  hasEmbed,
  setEmbed,
  children,
}: {
  textInputId?: string
  onSendMessage: (message: string) => void
  hasEmbed: boolean
  setEmbed: (embedUrl: string | undefined) => void
  children?: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const {needsEmailVerification} = useEmail()
  const editable = !needsEmailVerification
  const {getDraft, clearDraft} = useMessageDraft()
  const [emojiPickerState, setEmojiPickerState] = useState<EmojiPickerState>({
    isOpen: false,
    pos: {top: 0, left: 0, right: 0, bottom: 0, nextFocusRef: null},
  })
  const composerInternalApiRef = useComposerInternalApiRef()

  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  const [text, setText] = useState(getDraft)
  useSaveMessageDraft(text)

  const openEmojiPicker = (pos: any) => {
    setEmojiPickerState({isOpen: true, pos})
  }

  const onSubmit = () => {
    if (!editable) return
    if (!hasEmbed && text.trim() === '') return
    if (countGraphemes(text) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(l`Message is too long`, {
        type: 'error',
      })
      return
    }

    clearDraft()
    onSendMessage(text)
    playHaptic()
    setEmbed(undefined)
    composerInternalApiRef.current?.clear()

    if (IS_WEB) {
      composerInternalApiRef.current?.input?.focus()
    }
  }

  useEffect(() => {
    function onEmojiInserted(emoji: Emoji) {
      composerInternalApiRef.current?.insert(emoji.native)
    }
    textInputWebEmitter.addListener('emoji-inserted', onEmojiInserted)
    return () => {
      textInputWebEmitter.removeListener('emoji-inserted', onEmojiInserted)
    }
  }, [])

  return (
    <>
      <View style={[a.px_md, a.pb_sm, a.pt_xs]}>
        {children}

        <View
          collapsable={false}
          ref={
            IS_WEB
              ? undefined
              : node => {
                  composerInternalApiRef.current?.setAutocompleteAnchor(node)
                }
          }
          // @ts-expect-error web only
          onMouseEnter={onHoverIn}
          onMouseLeave={onHoverOut}
          style={[a.w_full, a.flex_row, a.gap_sm]}>
          {IS_WEB && (
            <Pressable
              onPress={e => {
                e.currentTarget.measure((_fx, _fy, _width, _height, px, py) => {
                  openEmojiPicker?.({
                    top: py,
                    left: px,
                    right: px,
                    bottom: py,
                    nextFocusRef: {
                      current: composerInternalApiRef.current?.input?.element,
                    },
                  })
                })
              }}
              style={[
                a.overflow_hidden,
                a.absolute,
                a.rounded_full,
                a.align_center,
                a.justify_center,
                a.z_30,
                {
                  height: 30,
                  width: 30,
                  top: 8,
                  left: 8,
                },
              ]}
              accessibilityLabel={l`Open emoji picker`}
              accessibilityHint="">
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
            </Pressable>
          )}

          <Composer
            nativeID={textInputId}
            label={l`Message input field`}
            placeholder={l`Write a message`}
            autocompletePlacement="top-start"
            internalApiRef={composerInternalApiRef}
            defaultValue={text}
            editable={editable}
            autoFocus={IS_WEB}
            maxRows={12}
            outerStyle={[
              a.flex_1,
              t.atoms.bg_contrast_25,
              {
                borderWidth: 1,
                borderColor: 'transparent',
                borderRadius: 22,
              },
              editable &&
                hovered && {
                  borderColor: t.atoms.border_contrast_medium.borderColor,
                },
              editable &&
                focused && {
                  borderColor: t.palette.primary_500,
                },
            ]}
            contentTextStyle={[a.text_md, a.leading_snug]}
            contentPaddingStyle={{
              paddingLeft: IS_WEB ? 30 + 12 : 12,
              paddingTop: 12,
              paddingBottom: 12,
              paddingRight: 12,
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={setText}
            onFacetCommitted={facet => {
              if (facet.type === 'url' && isBskyPostUrl(facet.value)) {
                setEmbed(facet.value)
              }
            }}
            onRequestSubmit={req => {
              if (req.platform === 'web' && req.shiftKey) return
              req.nativeEvent.preventDefault()
              onSubmit()
            }}
          />

          {focused || text.length ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={l`Send message`}
              accessibilityHint=""
              hitSlop={HITSLOP_10}
              style={[
                a.rounded_full,
                a.align_center,
                a.justify_center,
                a.self_end,
                a.z_30,
                {
                  height: 44,
                  width: 44,
                  backgroundColor: t.palette.primary_500,
                },
              ]}
              onPress={onSubmit}
              disabled={!editable}>
              <PaperPlane
                fill={t.palette.white}
                style={[a.relative, {left: 1}]}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {IS_WEB && (
        <EmojiPicker
          pinToTop
          state={emojiPickerState}
          close={() => setEmojiPickerState(prev => ({...prev, isOpen: false}))}
        />
      )}
    </>
  )
}
