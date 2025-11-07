import {useCallback, useState} from 'react'
import {Pressable, TextInput, useWindowDimensions, View, useRef} from 'react-native'
import {
  useFocusedInputHandler,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import Animated, {
  measure,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Graphemer from 'graphemer'

import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {isIOS, isWeb} from '#/platform/detection'
import {useEmail} from '#/state/email-verification'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {type EmojiPickerPosition} from '#/view/com/composer/text-input/web/EmojiPicker'
import * as Toast from '#/view/com/util/Toast'
import {android, atoms as a, useTheme} from '#/alf'
import {useSharedInputStyles} from '#/components/forms/TextField'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'
import {useExtractEmbedFromFacets} from './MessageInputEmbed'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export function MessageInput({
  onSendMessage,
  hasEmbed,
  setEmbed,
  children,
}: {
  onSendMessage: (message: string) => void
  hasEmbed: boolean
  setEmbed: (embedUrl: string | undefined) => void
  children?: React.ReactNode
  openEmojiPicker?: (pos: EmojiPickerPosition) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const {getDraft, clearDraft} = useMessageDraft()

  // Input layout
  const {top: topInset} = useSafeAreaInsets()
  const {height: windowHeight} = useWindowDimensions()
  const {height: keyboardHeight} = useReanimatedKeyboardAnimation()
  const maxHeight = useSharedValue<undefined | number>(undefined)
  const isInputScrollable = useSharedValue(false)

  const inputStyles = useSharedInputStyles()
  const [isFocused, setIsFocused] = useState(false)
  const [message, setMessage] = useState(getDraft)
  const inputRef = useAnimatedRef<TextInput>()
  const messageRef = useRef(getDraft || '');

  const {needsEmailVerification} = useEmail()

  useSaveMessageDraft(message)
  useExtractEmbedFromFacets(message, setEmbed)

  const onSubmit = useCallback(() => {
    const currentMessage = messageRef.current;
    if (needsEmailVerification) {
      return
    }
    if (!hasEmbed && currentMessage.trim() === '') {
      return
    }
    if (new Graphemer().countGraphemes(currentMessage) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(_(msg`Message is too long`), 'xmark')
      return
    }
    clearDraft()
    onSendMessage(currentMessage)
    playHaptic()
    setEmbed(undefined)
    setMessage('')
    if (isWeb) {
      // Pressing the send button causes the text input to lose focus, so we need to
      // re-focus it after sending
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [
    needsEmailVerification,
    hasEmbed,
    message,
    clearDraft,
    onSendMessage,
    playHaptic,
    setEmbed,
    inputRef,
    _,
  ])

  useFocusedInputHandler(
    {
      onChangeText: () => {
        'worklet'
        const measurement = measure(inputRef)
        if (!measurement) return

        const max = windowHeight - -keyboardHeight.get() - topInset - 150
        const availableSpace = max - measurement.height

        maxHeight.set(max)
        isInputScrollable.set(availableSpace < 30)
      },
    },
    [windowHeight, topInset],
  )

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: maxHeight.get(),
  }))

  const animatedProps = useAnimatedProps(() => ({
    scrollEnabled: isInputScrollable.get(),
  }))

  function handleTextAreaChange(text: string) {
    messageRef.current = text;
    setMessage(text);
  }

  return (
    <View style={[a.px_md, a.pb_sm, a.pt_xs]}>
      {children}
      <View
        style={[
          a.w_full,
          a.flex_row,
          t.atoms.bg_contrast_25,
          {
            padding: a.p_sm.padding - 2,
            paddingLeft: a.p_md.padding - 2,
            borderWidth: 1,
            borderRadius: 23,
            borderColor: 'transparent',
          },
          isFocused && inputStyles.chromeFocus,
        ]}>
        <AnimatedTextInput
          accessibilityLabel={_(msg`Message input field`)}
          accessibilityHint={_(msg`Type your message here`)}
          placeholder={_(msg`Write a message`)}
          placeholderTextColor={t.palette.contrast_500}
          value={message}
          onChangeText={handleTextAreaChange}
          multiline={true}
          style={[
            a.flex_1,
            a.text_md,
            a.px_sm,
            t.atoms.text,
            android({paddingTop: 0}),
            {paddingBottom: isIOS ? 5 : 0},
            animatedStyle,
          ]}
          keyboardAppearance={t.scheme}
          submitBehavior="newline"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          ref={inputRef}
          hitSlop={HITSLOP_10}
          animatedProps={animatedProps}
          editable={!needsEmailVerification}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={_(msg`Send message`)}
          accessibilityHint=""
          hitSlop={HITSLOP_10}
          style={[
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {height: 30, width: 30, backgroundColor: t.palette.primary_500},
          ]}
          onPress={() => {
            // The React Native touch handling system treats any active touch as an "interaction."
            // This means `runAfterInteractions()` will delay execution until **all active touches** have ended or been canceled.
            //
            // **Why this matters on iOS:**
            // - When an auto-correct suggestion is visible, tapping the screen first applies the suggestion.
            // - However, iOS **also forwards** the tap event to the button (or any other UI element underneath).
            // - This creates a race condition where the message may be submitted **before** the auto-corrected text is applied.
            //
            // **Fix:**
            // - By using `InteractionManager.runAfterInteractions()` + a ref for the input value, we ensure the function runs **only after** iOS has finished processing touches.
            // - This guarantees that the latest auto-corrected text is captured before submitting the message.
            InteractionManager.runAfterInteractions(() => {
              onSubmit();
            });
          }}
          disabled={needsEmailVerification}>
          <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
        </Pressable>
      </View>
    </View>
  )
}
