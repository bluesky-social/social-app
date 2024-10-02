import React from 'react'
import {View} from 'react-native'
import {PressableEvent} from 'react-native-gesture-handler/lib/typescript/components/Pressable/PressableProps'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {BottomSheetButton} from '#/components/BottomSheetButton'
import {ButtonColor, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export {
  type DialogControlProps as PromptControlProps,
  useDialogControl as usePromptControl,
} from '#/components/Dialog'

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
  testID,
  withoutPortal,
}: React.PropsWithChildren<{
  control: Dialog.DialogControlProps
  testID?: string
  withoutPortal?: boolean
}>) {
  const {gtMobile} = useBreakpoints()
  const titleId = React.useId()
  const descriptionId = React.useId()

  const context = React.useMemo(
    () => ({titleId, descriptionId}),
    [titleId, descriptionId],
  )

  const Wrapper =
    withoutPortal && isNative ? Dialog.OuterWithoutPortal : Dialog.Outer

  return (
    <Wrapper control={control} testID={testID}>
      <Context.Provider value={context}>
        <Dialog.ScrollableInner
          accessibilityLabelledBy={titleId}
          accessibilityDescribedBy={descriptionId}
          style={[
            gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
          ]}>
          {children}
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Wrapper>
  )
}

export function TitleText({children}: React.PropsWithChildren<{}>) {
  const {titleId} = React.useContext(Context)
  return (
    <Text
      nativeID={titleId}
      style={[a.text_2xl, a.font_bold, a.pb_sm, a.leading_snug]}>
      {children}
    </Text>
  )
}

export function DescriptionText({
  children,
  selectable,
}: React.PropsWithChildren<{selectable?: boolean}>) {
  const t = useTheme()
  const {descriptionId} = React.useContext(Context)
  return (
    <Text
      nativeID={descriptionId}
      selectable={selectable}
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
  const onPress = React.useCallback(() => {
    close()
  }, [close])

  return (
    <BottomSheetButton
      variant="solid"
      color="secondary"
      size={gtMobile ? 'small' : 'large'}
      label={cta || _(msg`Cancel`)}
      onPress={onPress}>
      <ButtonText>{cta || _(msg`Cancel`)}</ButtonText>
    </BottomSheetButton>
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
  onPress: (e: PressableEvent) => void
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
  const handleOnPress = React.useCallback(
    (e: PressableEvent) => {
      close(() => onPress?.(e))
    },
    [close, onPress],
  )

  return (
    <BottomSheetButton
      variant="solid"
      color={color}
      size={gtMobile ? 'small' : 'large'}
      label={cta || _(msg`Confirm`)}
      onPress={handleOnPress}
      testID={testID}>
      <ButtonText>{cta || _(msg`Confirm`)}</ButtonText>
    </BottomSheetButton>
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
  withoutPortal,
}: React.PropsWithChildren<{
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
  onConfirm: (e: PressableEvent) => void
  confirmButtonColor?: ButtonColor
  showCancel?: boolean
  withoutPortal?: boolean
}>) {
  return (
    <Outer
      control={control}
      testID="confirmModal"
      withoutPortal={withoutPortal}>
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
