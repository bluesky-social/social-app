import React from 'react'
import {Keyboard, StyleProp, View, ViewStyle} from 'react-native'
import Animated, {AnimatedStyle} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import isEqual from 'lodash.isequal'

import {isNative} from '#/platform/detection'
import {useMyListsQuery} from '#/state/queries/my-lists'
import {ThreadgateSetting} from '#/state/queries/threadgate'
import {useAnalytics} from 'lib/analytics/analytics'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Earth_Stroke2_Corner0_Rounded as Earth} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ThreadgateBtn({
  threadgate,
  onChange,
  style,
}: {
  threadgate: ThreadgateSetting[]
  onChange: (v: ThreadgateSetting[]) => void
  style?: StyleProp<AnimatedStyle<ViewStyle>>
}) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const onPress = () => {
    track('Composer:ThreadgateOpened')
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    control.open()
  }

  const isEverybody = threadgate.length === 0
  const isNobody = !!threadgate.find(gate => gate.type === 'nobody')
  const label = isEverybody
    ? _(msg`Everybody can reply`)
    : isNobody
    ? _(msg`Nobody can reply`)
    : _(msg`Some people can reply`)

  return (
    <>
      <Animated.View style={[a.flex_row, a.p_sm, t.atoms.bg, style]}>
        <Button
          variant="solid"
          color="secondary"
          size="xsmall"
          testID="openReplyGateButton"
          onPress={onPress}
          label={label}
          accessibilityHint={_(
            msg`Opens a dialog to choose who can reply to this thread`,
          )}>
          <ButtonIcon
            icon={isEverybody ? Earth : isNobody ? CircleBanSign : Group}
          />
          <ButtonText>{label}</ButtonText>
        </Button>
      </Animated.View>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <DialogContent threadgate={threadgate} onChange={onChange} />
      </Dialog.Outer>
    </>
  )
}

function DialogContent({
  threadgate,
  onChange,
}: {
  threadgate: ThreadgateSetting[]
  onChange: (v: ThreadgateSetting[]) => void
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const {gtMobile} = useBreakpoints()
  const {data: lists} = useMyListsQuery('curate')

  const onPressEverybody = () => {
    onChange([])
  }

  const onPressNobody = () => {
    onChange([{type: 'nobody'}])
  }

  const onPressAudience = (setting: ThreadgateSetting) => {
    // remove nobody
    let newSelected = threadgate.filter(v => v.type !== 'nobody')
    // toggle
    const i = newSelected.findIndex(v => isEqual(v, setting))
    if (i === -1) {
      newSelected.push(setting)
    } else {
      newSelected.splice(i, 1)
    }
    onChange(newSelected)
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`Choose who can reply`)}
      style={[gtMobile ? {width: 'auto', maxWidth: 400} : a.w_full]}>
      <View style={[a.flex_1, a.gap_md]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Chose who can reply</Trans>
        </Text>
        <Text style={a.mt_xs}>
          <Trans>Either choose "Everybody" or "Nobody"</Trans>
        </Text>
        <View style={[a.flex_row, a.gap_sm]}>
          <Selectable
            label={_(msg`Everybody`)}
            isSelected={threadgate.length === 0}
            onPress={onPressEverybody}
            style={{flex: 1}}
          />
          <Selectable
            label={_(msg`Nobody`)}
            isSelected={!!threadgate.find(v => v.type === 'nobody')}
            onPress={onPressNobody}
            style={{flex: 1}}
          />
        </View>
        <Text style={a.mt_md}>
          <Trans>Or combine these options:</Trans>
        </Text>
        <View style={[a.gap_sm]}>
          <Selectable
            label={_(msg`Mentioned users`)}
            isSelected={!!threadgate.find(v => v.type === 'mention')}
            onPress={() => onPressAudience({type: 'mention'})}
          />
          <Selectable
            label={_(msg`Followed users`)}
            isSelected={!!threadgate.find(v => v.type === 'following')}
            onPress={() => onPressAudience({type: 'following'})}
          />
          {lists?.length ? (
            lists.map(list => (
              <Selectable
                key={list.uri}
                label={_(msg`Users in "${list.name}"`)}
                isSelected={
                  !!threadgate.find(
                    v => v.type === 'list' && v.list === list.uri,
                  )
                }
                onPress={() => onPressAudience({type: 'list', list: list.uri})}
              />
            ))
          ) : (
            <View style={[a.flex_1, a.py_md, a.align_center]}>
              <Loader />
            </View>
          )}
        </View>
      </View>
      <Button
        label={_(msg`Done`)}
        onPress={() => control.close()}
        onAccessibilityEscape={control.close}
        color="primary"
        size="medium"
        variant="solid"
        style={a.mt_xl}>
        <ButtonText>
          <Trans>Done</Trans>
        </ButtonText>
      </Button>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function Selectable({
  label,
  isSelected,
  onPress,
  style,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Button
      onPress={onPress}
      label={label}
      style={[a.justify_between, style]}
      accessibilityHint="Select this option"
      color="primary"
      size="medium"
      variant={isSelected ? 'solid' : 'outline'}>
      <ButtonText numberOfLines={1} style={a.text_left}>
        {label}
      </ButtonText>
      {isSelected ? <ButtonIcon icon={Check} /> : <View />}
    </Button>
  )
}
