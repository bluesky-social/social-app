import React from 'react'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Earth_Stroke2_Corner0_Rounded as Earth} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'

export function SelectThreadgateBtn({
  threadgate,
  onChange,
}: {
  threadgate: ThreadgateAllowUISetting[]
  onChange: (v: ThreadgateAllowUISetting[]) => void
}) {
  const {_} = useLingui()
  const {openModal} = useModalControls()

  const onPress = () => {
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
    openModal({
      name: 'threadgate',
      settings: threadgate,
      onChange,
    })
  }

  const isEverybody = threadgate.length === 0
  const isNobody = !!threadgate.find(gate => gate.type === 'nobody')
  const label = isEverybody
    ? _(msg`Everybody can reply`)
    : isNobody
    ? _(msg`Nobody can reply`)
    : _(msg`Some people can reply`)

  return (
    <Button
      variant="solid"
      color="secondary"
      size="small"
      testID="openReplyGateButton"
      onPress={onPress}
      label={label}>
      <ButtonIcon
        icon={isEverybody ? Earth : isNobody ? CircleBanSign : Group}
      />
      <ButtonText>{label}</ButtonText>
    </Button>
  )
}
