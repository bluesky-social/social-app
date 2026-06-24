import {useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {
  useKeyboardHandler,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {GlassContainer} from 'expo-glass-effect'
import {LinearGradient} from 'expo-linear-gradient'
import {type $Typed, type ChatBskyConvoDefs} from '@atproto/api'
import {ScrollEdgeEffect} from '@bsky.app/expo-scroll-edge-effect'
import {useLingui} from '@lingui/react/macro'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isBskyChatInviteUrl, isBskyPostUrl} from '#/lib/strings/url-helpers'
import {useEmail} from '#/state/email-verification'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {atoms as a, native, platform, tokens, useTheme, utils} from '#/alf'
import {Composer, useComposerInternalApiRef} from '#/components/Composer'
import {useMessageReplies} from '#/components/dms/MessageReplies'
import * as EmojiPicker from '#/components/EmojiPicker'
import {GlassView} from '#/components/GlassView'
import {EmojiArc_Stroke2_Corner0_Rounded as EmojiSmileIcon} from '#/components/icons/Emoji'
import {PaperPlaneVertical_Filled_Stroke2_Corner1_Rounded as PaperPlaneIcon} from '#/components/icons/PaperPlane'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {IS_ANDROID, IS_IOS, IS_LIQUID_GLASS, IS_NATIVE, IS_WEB} from '#/env'
import {type MessageEmbedState} from './MessageInputEmbed'

const MIN_HEIGHT = 40

export function MessageComposer({
  textInputId,
  onSendMessage,
  messageEmbed,
  setEmbed,
  children,
  loading = false,
}: {
  textInputId?: string
  onSendMessage: (
    message: string,
    embed?: MessageEmbedState,
    replyTo?: $Typed<ChatBskyConvoDefs.MessageView>,
  ) => void
  messageEmbed: MessageEmbedState | undefined
  setEmbed: (embedUrl: string | undefined) => void
  children?: React.ReactNode
  loading?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const {needsEmailVerification} = useEmail()
  const editable = !needsEmailVerification && !loading
  const {getDraft, clearDraft} = useMessageDraft()
  const composerInternalApiRef = useComposerInternalApiRef()
  const {replyTo, clearReply} = useMessageReplies()

  const [text, setText] = useState(getDraft)
  useSaveMessageDraft(text)

  useEffect(() => {
    if (!replyTo) return
    composerInternalApiRef.current?.input?.focus()
  }, [replyTo, composerInternalApiRef])

  // Android interactive dismiss sometimes doesn't blur the input
  const blur = useNonReactiveCallback(() => {
    composerInternalApiRef.current?.input?.blur()
  })

  useKeyboardHandler({
    onEnd: evt => {
      'worklet'
      if (IS_ANDROID && evt.progress === 0) {
        runOnJS(blur)()
      }
    },
  })

  const submitDisabled =
    !editable || (!messageEmbed && text.trim().length === 0)

  const onSubmit = (
    message: string,
    embed: MessageEmbedState | undefined,
    replyTo: ChatBskyConvoDefs.MessageView | null,
  ) => {
    if (!editable) return
    if (!embed && message.trim() === '') return
    const graphemeCount = countGraphemes(message)
    if (graphemeCount > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(
        l`Message is too long (${graphemeCount}/${MAX_DM_GRAPHEME_LENGTH})`,
        {type: 'error'},
      )
      return
    }

    clearDraft()
    playHaptic()
    setEmbed(undefined)
    clearReply()
    composerInternalApiRef.current?.clear()

    if (IS_WEB) {
      composerInternalApiRef.current?.input?.focus()
    }

    // defer send by a frame so that the textinput resizes before we send the message
    requestAnimationFrame(() => {
      onSendMessage(
        message,
        embed,
        replyTo
          ? {
              ...replyTo,
              $type: 'chat.bsky.convo.defs#messageView',
            }
          : undefined,
      )
    })
  }

  const isFlushingAutocorrectSuggestion = useRef(false)
  const handleSubmit = () => {
    if (IS_IOS) {
      // HACKFIX: If there's a pending autocomplete suggestion, iOS will prioritize
      // accepting the suggestion over any imperative `.clear()` action on the textinput.
      // This means we'll send the message with the typo while the corrected text remains
      // in the composer's textinput.
      //
      // In MessageInput, the previous iteration, we simply sent it, and if another text change
      // event came in, we'd clear it again. However, it's nicer UX to actually accept the suggestion.
      //
      // Thus the solution:
      // 1. Set a ref indicating we're flushing the autocorrect suggestion
      // 2. Watch for incoming onChange events. If something comes in, it's almost certainly the corrected text,
      // so send that
      // 3. Meanwhile, race that against a simple timeout. If the timeout fires first, send the original text.
      //
      // Hopefully, it's delaying the send by no more than a couple frames -sfn
      isFlushingAutocorrectSuggestion.current = true
      setTimeout(() => {
        if (isFlushingAutocorrectSuggestion.current) {
          isFlushingAutocorrectSuggestion.current = false
          onSubmit(text, messageEmbed, replyTo)
        }
      }, 20)
    } else {
      onSubmit(text, messageEmbed, replyTo)
    }
  }

  const handleChange = (nextText: string) => {
    if (IS_IOS && isFlushingAutocorrectSuggestion.current) {
      isFlushingAutocorrectSuggestion.current = false
      onSubmit(nextText, messageEmbed, replyTo)
    } else {
      setText(nextText)
    }
  }

  return (
    <ComposerContainer>
      <View
        collapsable={false}
        ref={native(
          (node: View) =>
            void composerInternalApiRef.current?.setAutocompleteAnchor(node),
        )}>
        <GlassContainer
          style={[a.w_full, a.flex_row, a.gap_sm, a.align_end]}
          spacing={tokens.space.sm}>
          <GlassView
            isInteractive
            glassEffectStyle="regular"
            style={[a.flex_1, a.rounded_xl, {minHeight: MIN_HEIGHT}]}
            tintColor={t.palette.contrast_50}
            fallbackStyle={[t.atoms.bg_contrast_50]}>
            {children}
            <View style={[a.flex_1]}>
              {IS_WEB && !loading ? (
                <EmojiPicker.Root
                  onEmojiSelect={emoji =>
                    composerInternalApiRef.current?.insert(emoji.native)
                  }
                  nextFocusRef={() =>
                    composerInternalApiRef.current?.input?.element
                  }>
                  <EmojiPicker.Trigger label={l`Open emoji picker`}>
                    {({props, state, control}) => (
                      <Pressable
                        {...props}
                        style={[
                          a.overflow_hidden,
                          a.absolute,
                          a.rounded_full,
                          a.align_center,
                          a.justify_center,
                          a.z_30,
                          {
                            height: 20,
                            width: 20,
                            top: 10,
                            right: 10,
                          },
                        ]}>
                        <EmojiSmileIcon
                          size="md"
                          style={
                            state.hovered ||
                            state.focused ||
                            state.pressed ||
                            control.isOpen
                              ? {color: t.palette.primary_500}
                              : t.atoms.text_contrast_high
                          }
                        />
                      </Pressable>
                    )}
                  </EmojiPicker.Trigger>
                  <EmojiPicker.Picker />
                </EmojiPicker.Root>
              ) : null}

              <Composer
                nativeID={textInputId}
                label={l`Message input field`}
                placeholder={
                  loading
                    ? l({message: 'Loading chat…', context: 'placeholder'})
                    : l({message: 'Message', context: 'action'})
                }
                autocompletePlacement="top-start"
                internalApiRef={composerInternalApiRef}
                defaultValue={text}
                editable={editable}
                autoFocus={IS_WEB}
                maxRows={12}
                outerStyle={[a.flex_1]}
                contentTextStyle={[a.text_md, a.leading_snug]}
                contentPaddingStyle={{
                  paddingLeft: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingRight: 16 + platform({web: 20, default: 0}),
                }}
                onChange={handleChange}
                onFacetCommitted={facet => {
                  if (
                    facet.type === 'url' &&
                    (isBskyPostUrl(facet.value) ||
                      isBskyChatInviteUrl(facet.value))
                  ) {
                    setEmbed(facet.value)
                  }
                }}
                onRequestSubmit={req => {
                  if (req.platform === 'web' && req.shiftKey) return
                  req.nativeEvent.preventDefault()
                  handleSubmit()
                }}
              />
            </View>
          </GlassView>
          <SubmitButton
            onPress={handleSubmit}
            disabled={submitDisabled}
            loading={loading}
          />
        </GlassContainer>
      </View>
    </ComposerContainer>
  )
}

function SubmitButton({
  onPress,
  disabled,
  loading,
}: {
  onPress: () => void
  disabled: boolean
  loading: boolean
}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <GlassView
      isInteractive
      glassEffectStyle="regular"
      style={[a.rounded_full]}
      tintColor={disabled ? t.palette.contrast_100 : t.palette.primary_500}
      fallbackStyle={{
        backgroundColor: disabled
          ? t.palette.contrast_100
          : t.palette.primary_500,
      }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={l`Send message`}
        accessibilityHint=""
        hitSlop={HITSLOP_10}
        style={[
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {height: MIN_HEIGHT, width: MIN_HEIGHT},
        ]}
        onPress={onPress}
        disabled={disabled}>
        {loading ? (
          <Loader size="md" fill={t.palette.white} style={[a.mb_2xs]} />
        ) : (
          <PaperPlaneIcon size="md" fill={t.palette.white} style={[a.mb_2xs]} />
        )}
      </Pressable>
    </GlassView>
  )
}

function ComposerContainer({children}: {children: React.ReactNode}) {
  const {bottom: bottomInset} = useSafeAreaInsets()
  const {progress} = useReanimatedKeyboardAnimation()
  const t = useTheme()

  const animatedContainerStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(
      progress.get(),
      [0, 1],
      [bottomInset, tokens.space.md],
      {
        extrapolateRight: Extrapolation.CLAMP,
        extrapolateLeft: Extrapolation.CLAMP,
      },
    ),
  }))

  if (IS_LIQUID_GLASS) {
    return (
      <ScrollEdgeEffect edge="bottom" effect="soft">
        <Animated.View style={[a.w_full, animatedContainerStyle, a.pb_lg]}>
          {children}
        </Animated.View>
      </ScrollEdgeEffect>
    )
  } else {
    return (
      <>
        <LinearGradient
          style={platform({
            native: [a.pt_sm, a.px_lg, , a.pb_lg, a.w_full],
            web: [
              a.pt_xs,
              a.pl_lg,
              a.pb_lg,
              // prevent overlap with the scrollbar, which looks ugly
              a.pr_sm, // sm + sm = lg
              {width: `calc(100% - ${tokens.space.sm}px)` as '100%'},
            ],
          })}
          key={t.name} // android does not update when you change the colors. sigh.
          start={[0.5, 0]}
          end={[0.5, 1]}
          colors={[
            utils.alpha(t.atoms.bg.backgroundColor, 0),
            utils.alpha(t.atoms.bg.backgroundColor, 0.8),
            t.atoms.bg.backgroundColor,
          ]}>
          {children}
        </LinearGradient>
        {/* covers the gap between the keyboard and the input during keyboard animation */}
        {IS_NATIVE && (
          <View
            style={[
              t.atoms.bg,
              a.absolute,
              a.left_0,
              a.right_0,
              {top: '100%', height: bottomInset + 1, marginTop: -1},
            ]}
          />
        )}
      </>
    )
  }
}
