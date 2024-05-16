import React from 'react'
import {
  Dimensions,
  Keyboard,
  NativeSyntheticEvent,
  Pressable,
  TextInput,
  TextInputContentSizeChangeEventData,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Graphemer from 'graphemer'

import {HITSLOP_10, MAX_DM_GRAPHEME_LENGTH} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  useMessageDraft,
  useSaveMessageDraft,
} from '#/state/messages/message-drafts'
import {isIOS} from 'platform/detection'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'

export function MessageInput({
  onSendMessage,
  scrollToEnd,
}: {
  onSendMessage: (message: string) => void
  scrollToEnd: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const {getDraft, clearDraft} = useMessageDraft()
  const [message, setMessage] = React.useState(getDraft)
  const [maxHeight, setMaxHeight] = React.useState<number | undefined>()
  const [isInputScrollable, setIsInputScrollable] = React.useState(false)

  const {top: topInset} = useSafeAreaInsets()

  const inputRef = React.useRef<TextInput>(null)

  const onSubmit = React.useCallback(() => {
    if (message.trim() === '') {
      return
    }
    if (new Graphemer().countGraphemes(message) > MAX_DM_GRAPHEME_LENGTH) {
      Toast.show(_(msg`Message is too long`))
      return
    }
    clearDraft()
    onSendMessage(message.trimEnd())
    playHaptic()
    setMessage('')
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [message, onSendMessage, playHaptic, _, clearDraft])

  const onInputLayout = React.useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const keyboardHeight = Keyboard.metrics()?.height ?? 0
      const windowHeight = Dimensions.get('window').height

      const max = windowHeight - keyboardHeight - topInset - 150
      const availableSpace = max - e.nativeEvent.contentSize.height

      setMaxHeight(max)
      setIsInputScrollable(availableSpace < 30)

      scrollToEnd()
    },
    [scrollToEnd, topInset],
  )

  useSaveMessageDraft(message)

  return (
    <View style={a.p_md}>
      <View
        style={[
          a.w_full,
          a.flex_row,
          a.py_sm,
          a.px_sm,
          a.pl_md,
          t.atoms.bg_contrast_25,
          {borderRadius: 23},
        ]}>
        <TextInput
          accessibilityLabel={_(msg`Message input field`)}
          accessibilityHint={_(msg`Type your message here`)}
          placeholder={_(msg`Write a message`)}
          placeholderTextColor={t.palette.contrast_500}
          value={message}
          multiline={true}
          onChangeText={setMessage}
          style={[
            a.flex_1,
            a.text_md,
            a.px_sm,
            t.atoms.text,
            {maxHeight, paddingBottom: isIOS ? 5 : 0},
          ]}
          keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
          scrollEnabled={isInputScrollable}
          blurOnSubmit={false}
          onContentSizeChange={onInputLayout}
          ref={inputRef}
          hitSlop={HITSLOP_10}
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
          onPress={onSubmit}>
          <PaperPlane fill={t.palette.white} style={[a.relative, {left: 1}]} />
        </Pressable>
      </View>
    </View>
  )
}
