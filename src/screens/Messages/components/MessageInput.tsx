import {useCallback, useState} from 'react'
import {Pressable, TextInput, useWindowDimensions, View} from 'react-native'
import {
  useFocusedInputHandler,
  useKeyboardHandler,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller'
import Animated, {
  interpolate,
  measure,
  runOnJS,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {GlassContainer} from 'expo-glass-effect'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useEmail} from '#/state/email-verification'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {type EmojiPickerPosition} from '#/view/com/composer/text-input/web/EmojiPicker'
import {atoms as a, platform, tokens, useTheme} from '#/alf'
import {GlassView} from '#/components/GlassView'
import {PaperPlaneVertical_Filled_Stroke2_Corner1_Rounded as PaperPlaneIcon} from '#/components/icons/PaperPlane'
import * as Toast from '#/components/Toast'
import {IS_ANDROID, IS_IOS, IS_LIQUID_GLASS, IS_WEB} from '#/env'
import {useExtractEmbedFromFacets} from './MessageInputEmbed'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const MIN_HEIGHT = 40

export function MessageInput({
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
  openEmojiPicker?: (pos: EmojiPickerPosition) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const {getDraft, clearDraft} = useMessageDraft()

  // Input layout
  const {top: topInset, bottom: bottomInset} = useSafeAreaInsets()
  const {height: windowHeight} = useWindowDimensions()
  const {height: keyboardHeight, progress} = useReanimatedKeyboardAnimation()
  const maxHeight = useSharedValue<undefined | number>(undefined)
  const isInputScrollable = useSharedValue(false)

  const [message, setMessage] = useState(getDraft)
  const inputRef = useAnimatedRef<TextInput>()
  const [shouldEnforceClear, setShouldEnforceClear] = useState(false)

  const {needsEmailVerification} = useEmail()

  useSaveMessageDraft(message)
  useExtractEmbedFromFacets(message, setEmbed)

  const onSubmit = useCallback(() => {
    if (needsEmailVerification) {
      return
    }
    if (!hasEmbed && message.trim() === '') {
      return
    }
    if (countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(_(msg`Message is too long`), {
        type: 'error',
      })
      return
    }
    clearDraft()
    onSendMessage(message)
    playHaptic()
    setEmbed(undefined)
    setMessage('')
    if (IS_IOS) {
      setShouldEnforceClear(true)
    }
    if (IS_WEB) {
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

  const animatedContainerStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(
      progress.get(),
      [0, 1],
      [bottomInset, tokens.space.sm],
    ),
  }))

  const submitDisabled = needsEmailVerification || message.trim().length === 0

  const blur = useCallback(() => {
    inputRef.current?.blur()
  }, [inputRef])

  useKeyboardHandler({
    onEnd: evt => {
      'worklet'
      // small hack: interactive dismiss on Android sometimes doesn't blur the input
      if (IS_ANDROID && evt.progress === 0) {
        runOnJS(blur)()
      }
    },
  })

  return (
    <View>
      <Animated.View
        style={[
          a.w_full,
          IS_LIQUID_GLASS
            ? [animatedContainerStyle, a.pb_lg]
            : [a.px_md, a.pt_sm, a.pb_md, t.atoms.bg],
        ]}>
        {children}
        <GlassContainer
          style={[a.flex_row, a.align_end, a.gap_sm]}
          spacing={tokens.space.xs}>
          <GlassView
            isInteractive
            glassEffectStyle="regular"
            style={[a.flex_1, a.rounded_xl, {minHeight: MIN_HEIGHT}]}
            tintColor={t.palette.contrast_50}
            fallbackStyle={[t.atoms.bg_contrast_50]}>
            <AnimatedTextInput
              nativeID={textInputId}
              accessibilityLabel={_(msg`Message input field`)}
              accessibilityHint={_(msg`Type your message here`)}
              placeholder={_(msg`Message`)}
              placeholderTextColor={t.palette.contrast_500}
              value={message}
              onChange={evt => {
                // bit of a hack: iOS automatically accepts autocomplete suggestions when you tap anywhere on the screen
                // including the button we just pressed - and this overrides clearing the input! so we watch for the
                // next change and double make sure the input is cleared. It should *always* send an onChange event after
                // clearing via setMessage('') that happens in onSubmit()
                // -sfn
                if (IS_IOS && shouldEnforceClear) {
                  setShouldEnforceClear(false)
                  setMessage('')
                  return
                }
                const text = evt.nativeEvent.text
                setMessage(text)
              }}
              multiline={true}
              style={[
                {flexBasis: 'auto', minHeight: MIN_HEIGHT},
                a.flex_shrink_0,
                a.flex_grow,
                a.text_md,
                a.px_lg,
                t.atoms.text,
                platform({
                  android: {paddingTop: 2, paddingBottom: 3},
                  ios: {paddingTop: 10, paddingBottom: 5},
                }),
                animatedStyle,
              ]}
              verticalAlign="middle"
              keyboardAppearance={t.scheme}
              submitBehavior="newline"
              ref={inputRef}
              hitSlop={HITSLOP_10}
              animatedProps={animatedProps}
              editable={!needsEmailVerification}
            />
          </GlassView>
          <GlassView
            isInteractive
            glassEffectStyle="regular"
            style={[a.rounded_full]}
            tintColor={
              submitDisabled ? t.palette.contrast_100 : t.palette.primary_500
            }
            fallbackStyle={{
              backgroundColor: submitDisabled
                ? t.palette.contrast_100
                : t.palette.primary_500,
            }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={_(msg`Send message`)}
              accessibilityHint=""
              hitSlop={HITSLOP_10}
              style={[
                a.rounded_full,
                a.align_center,
                a.justify_center,
                {
                  height: MIN_HEIGHT,
                  width: MIN_HEIGHT,
                },
              ]}
              onPress={onSubmit}
              disabled={submitDisabled}>
              <PaperPlaneIcon
                size="md"
                fill={t.palette.white}
                style={[a.mb_2xs]}
              />
            </Pressable>
          </GlassView>
        </GlassContainer>
      </Animated.View>

      {/* covers the gap between the keyboard and the input during keyboard animation on non-liquid glass */}
      {!IS_LIQUID_GLASS && (
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
    </View>
  )
}
