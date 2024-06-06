import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useId,
  useMemo,
} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonColor, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export {useDialogControl as usePromptControl} from '#/components/Dialog'

const Context = createContext<{
  titleId: string
  descriptionId: string
}>({
  titleId: '',
  descriptionId: '',
})

export function Outer({
  children,
  control,
  testID,
}: PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  testID?: string
}>) {
  const {gtMobile} = useBreakpoints()
  const titleId = useId()
  const descriptionId = useId()

  const context = useMemo(
    () => ({titleId, descriptionId}),
    [titleId, descriptionId],
  )

  return (
    <Dialog.Outer control={control} testID={testID}>
      <Context.Provider value={context}>
        <Dialog.Handle />

        <Dialog.ScrollableInner
          accessibilityLabelledBy={titleId}
          accessibilityDescribedBy={descriptionId}
          style={[
            gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
          ]}>
          {children}
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function TitleText({children}: PropsWithChildren<{}>) {
  const {titleId} = useContext(Context)

  return (
    <Text nativeID={titleId} style={[a.text_2xl, a.font_bold, a.pb_sm]}>
      {children}
    </Text>
  )
}

export function DescriptionText({
  children,
  selectable,
}: PropsWithChildren<{selectable?: boolean}>) {
  const t = useTheme()
  const {descriptionId} = useContext(Context)

  return (
    <Text
      nativeID={descriptionId}
      selectable={selectable}
      style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high, a.pb_lg]}>
      {children}
    </Text>
  )
}

export function Actions({children}: PropsWithChildren<{}>) {
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        a.w_full,
        a.gap_md,
        a.justify_end,
        gtMobile
          ? [a.flex_row, a.flex_row_reverse, a.justify_start]
          : [a.flex_col],
      ]}>
      {children}
    </View>
  )
}

export function Cancel({
  cta,
}: {
  /**
   * Optional i18n string. If undefined, it will default to "Cancel".
   */
  cta?: string
}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()

  const onPress = useCallback(() => {
    close()
  }, [close])

  return (
    <Button
      variant="solid"
      color="secondary"
      size={gtMobile ? 'small' : 'medium'}
      label={cta || _(msg`Cancel`)}
      onPress={onPress}>
      <ButtonText>{cta || _(msg`Cancel`)}</ButtonText>
    </Button>
  )
}

export function Action({
  onPress,
  color = 'primary',
  cta,
  testID,
}: {
  /**
   * Callback to run when the action is pressed. The method is called _after_
   * the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   */
  onPress: () => void
  color?: ButtonColor
  /**
   * Optional i18n string. If undefined, it will default to "Confirm".
   */
  cta?: string
  testID?: string
}) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()

  const handleOnPress = useCallback(() => {
    close(onPress)
  }, [close, onPress])

  return (
    <Button
      variant="solid"
      color={color}
      size={gtMobile ? 'small' : 'medium'}
      label={cta || _(msg`Confirm`)}
      onPress={handleOnPress}
      testID={testID}>
      <ButtonText>{cta || _(msg`Confirm`)}</ButtonText>
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
  showCancel = true,
}: PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  title: string
  description: string
  cancelButtonCta?: string
  confirmButtonCta?: string
  /**
   * Callback to run when the Confirm button is pressed. The method is called
   * _after_ the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   */
  onConfirm: () => void
  confirmButtonColor?: ButtonColor
  showCancel?: boolean
}>) {
  return (
    <Outer control={control} testID="confirmModal">
      <TitleText>{title}</TitleText>
      <DescriptionText>{description}</DescriptionText>
      <Actions>
        <Action
          cta={confirmButtonCta}
          onPress={onConfirm}
          color={confirmButtonColor}
          testID="confirmBtn"
        />
        {showCancel && <Cancel cta={cancelButtonCta} />}
      </Actions>
    </Outer>
  )
}
