import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, ButtonColor, ButtonText} from '#/components/Button'

import * as Dialog from '#/components/Dialog'

export {useDialogControl as usePromptControl} from '#/components/Dialog'

const Context = React.createContext<{
  titleId: string
  descriptionId: string
}>({
  titleId: '',
  descriptionId: '',
})

export function Outer({
  children,
  control,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
}>) {
  const {gtMobile} = useBreakpoints()
  const titleId = React.useId()
  const descriptionId = React.useId()

  const context = React.useMemo(
    () => ({titleId, descriptionId}),
    [titleId, descriptionId],
  )

  return (
    <Dialog.Outer control={control}>
      <Context.Provider value={context}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          accessibilityLabelledBy={titleId}
          accessibilityDescribedBy={descriptionId}
          style={[gtMobile ? {width: 'auto', maxWidth: 400} : a.w_full]}>
          {children}
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function Title({children}: React.PropsWithChildren<{}>) {
  const {titleId} = React.useContext(Context)
  return (
    <Text nativeID={titleId} style={[a.text_2xl, a.font_bold, a.pb_sm]}>
      {children}
    </Text>
  )
}

export function Description({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const {descriptionId} = React.useContext(Context)
  return (
    <Text
      nativeID={descriptionId}
      style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high, a.pb_lg]}>
      {children}
    </Text>
  )
}

export function Actions({children}: React.PropsWithChildren<{}>) {
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        a.w_full,
        a.gap_sm,
        a.justify_end,
        gtMobile ? [a.flex_row] : [a.flex_col, a.pt_md, a.pb_4xl],
      ]}>
      {children}
    </View>
  )
}

export function Cancel({
  children,
  cta,
}: React.PropsWithChildren<{
  cta?: string
}>) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()
  const onPress = React.useCallback(() => {
    close()
  }, [close])

  return (
    <Button
      variant="solid"
      color="secondary"
      size={gtMobile ? 'small' : 'medium'}
      label={cta || _(msg`Cancel`)}
      onPress={onPress}>
      {children ? children : <ButtonText>{cta || _(msg`Cancel`)}</ButtonText>}
    </Button>
  )
}

export function Action({
  children,
  onPress,
  color = 'primary',
  cta,
}: React.PropsWithChildren<{
  onPress: () => void
  color?: ButtonColor
  cta?: string
}>) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()
  const handleOnPress = React.useCallback(() => {
    close()
    onPress()
  }, [close, onPress])

  return (
    <Button
      variant="solid"
      color={color}
      size={gtMobile ? 'small' : 'medium'}
      label={cta || _(msg`Confirm`)}
      onPress={handleOnPress}>
      {children ? children : <ButtonText>{cta || _(msg`Confirm`)}</ButtonText>}
    </Button>
  )
}

export function Basic({
  control,
  title,
  description,
  cancelButtonCta,
  confirmButtonCta,
  onConfirm,
  confirmButtonColor,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  title: string
  description: string
  cancelButtonCta?: string
  confirmButtonCta?: string
  onConfirm: () => void
  confirmButtonColor?: ButtonColor
}>) {
  return (
    <Outer control={control}>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <Actions>
        <Action
          cta={confirmButtonCta}
          onPress={onConfirm}
          color={confirmButtonColor}
        />
        <Cancel cta={cancelButtonCta} />
      </Actions>
    </Outer>
  )
}
