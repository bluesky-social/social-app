import {useState} from 'react'
import {Modal, Pressable, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {EmojiPicker} from '../../../modules/expo-emoji-picker'

export function EmojiPopup({
  children,
  onEmojiSelected,
}: {
  children: React.ReactNode
  onEmojiSelected: (emoji: string) => void
}) {
  const [modalVisible, setModalVisible] = useState(false)
  const {_} = useLingui()
  const t = useTheme()

  return (
    <>
      <Pressable
        accessibilityLabel={_(msg`Open full emoji list`)}
        accessibilityHint=""
        accessibilityRole="button"
        onPress={() => setModalVisible(true)}>
        {children}
      </Pressable>

      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent
        statusBarTranslucent
        navigationBarTranslucent>
        <SafeAreaView style={[a.flex_1, t.atoms.bg]}>
          <View
            style={[
              a.pl_lg,
              a.pr_md,
              a.py_sm,
              a.w_full,
              a.align_center,
              a.flex_row,
              a.justify_between,
              a.border_b,
              t.atoms.border_contrast_low,
            ]}>
            <Text style={[a.font_bold, a.text_md]}>
              <Trans>Add Reaction</Trans>
            </Text>
            <Button
              label={_(msg`Close`)}
              onPress={() => setModalVisible(false)}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round">
              <ButtonIcon icon={CloseIcon} />
            </Button>
          </View>
          <EmojiPicker
            onEmojiSelected={emoji => {
              setModalVisible(false)
              onEmojiSelected(emoji)
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  )
}
