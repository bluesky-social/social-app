import {useState} from 'react'
import {Modal, Pressable, View} from 'react-native'
// @ts-expect-error internal component, not supposed to be used directly
// waiting on more customisability: https://github.com/okwasniewski/react-native-emoji-popup/issues/1#issuecomment-2737463753
import EmojiPopupView from 'react-native-emoji-popup/src/EmojiPopupViewNativeComponent'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

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
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={[a.flex_1, {backgroundColor: t.palette.white}]}>
          <View
            style={[
              t.atoms.bg,
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
              <ButtonIcon icon={TimesLarge_Stroke2_Corner0_Rounded} />
            </Button>
          </View>
          <EmojiPopupView
            onEmojiSelected={({
              nativeEvent: {emoji},
            }: {
              nativeEvent: {emoji: string}
            }) => {
              setModalVisible(false)
              onEmojiSelected(emoji)
            }}
            style={[a.flex_1, a.w_full]}
          />
        </View>
      </Modal>
    </>
  )
}
