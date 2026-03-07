import {createContext, useCallback, useContext, useId, useMemo} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, type ViewStyleProp, web} from '#/alf'
import {
  Button,
  type ButtonColor,
  ButtonIcon,
  ButtonText,
} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'
import {type BottomSheetViewProps} from '../../modules/bottom-sheet'

export {
  type DialogControlProps as PromptControlProps,
  useDialogControl as usePromptControl,
} from '#/components/Dialog'

const Context = createContext<{
  titleId: string
  descriptionId: string
}>({
  titleId: '',
  descriptionId: '',
})
Context.displayName = 'PromptContext'

export function Outer({
  children,
  control,
  testID,
  nativeOptions,
  type = 'sheet',
}: React.PropsWithChildren<{
  control: Dialog.DialogControlProps
  testID?: string
  /**
   * Native-specific options for the prompt. Extends `BottomSheetViewProps`
   */
  nativeOptions?: Omit<BottomSheetViewProps, 'children'>
  /**
   * The presentation style of the prompt.
   * - `sheet` (default): Bottom sheet on native, standard modal on web.
   * - `alert`: Centered alert modal on all platforms.
   */
  type?: 'sheet' | 'alert'
}>) {
  const titleId = useId()
  const descriptionId = useId()

  const context = useMemo(
    () => ({titleId, descriptionId}),
    [titleId, descriptionId],
  )

  return (
    <Dialog.Outer
      control={control}
      testID={testID}
      type={type}
      webOptions={{alignCenter: true}}
      nativeOptions={{preventExpansion: true, ...nativeOptions}}>
      {type !== 'alert' && <Dialog.Handle />}
      <Context.Provider value={context}>
        <Dialog.ScrollableInner
          accessibilityLabelledBy={titleId}
          accessibilityDescribedBy={descriptionId}
          style={web([{maxWidth: 320, borderRadius: 36}])}>
          {children}
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function Icon({
  icon: Comp,
  color,
}: {
  icon: React.ComponentType<SVGIconProps>
  color?: ButtonColor
}) {
  const t = useTheme()

  let iconColor: string
  switch (color) {
    case 'negative':
      iconColor = t.palette.negative_500
      break
    case 'primary':
      iconColor = t.palette.primary_500
      break
    default:
      iconColor = t.atoms.text.color
      break
  }

  return (
    <View style={[a.pb_sm]}>
      <Comp size="xl" style={{color: iconColor}} />
    </View>
  )
}

export function TitleText({
  children,
  style,
}: React.PropsWithChildren<ViewStyleProp>) {
  const {titleId} = useContext(Context)
  const {type} = Dialog.useDialogContext()
  return (
    <Text
      nativeID={titleId}
      style={[
        a.flex_1,
        a.text_2xl,
        a.font_semi_bold,
        a.pb_xs,
        a.leading_snug,
        type === 'alert' && a.text_center,
        style,
      ]}>
      {children}
    </Text>
  )
}

export function DescriptionText({
  children,
  selectable,
}: React.PropsWithChildren<{selectable?: boolean}>) {
  const t = useTheme()
  const {descriptionId} = useContext(Context)
  const {type} = Dialog.useDialogContext()
  return (
    <Text
      nativeID={descriptionId}
      selectable={selectable}
      style={[
        a.text_md,
        a.leading_snug,
        t.atoms.text_contrast_high,
        a.pb_lg,
        type === 'alert' && a.text_center,
      ]}>
      {children}
    </Text>
  )
}

export function Actions({children}: {children: React.ReactNode}) {
  return <View style={[a.w_full, a.gap_sm, a.justify_end]}>{children}</View>
}

export function Content({children}: {children: React.ReactNode}) {
  return <View style={[a.pb_sm]}>{children}</View>
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
  const {close} = Dialog.useDialogContext()
  const onPress = useCallback(() => {
    close()
  }, [close])

  return (
    <Button
      variant="solid"
      color="secondary"
      size="large"
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
  disabled = false,
  icon,
  shouldCloseOnPress = true,
  testID,
}: {
  /**
   * Callback to run when the action is pressed. The method is called _after_
   * the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   */
  onPress: (e: GestureResponderEvent) => void
  color?: ButtonColor
  /**
   * Optional i18n string. If undefined, it will default to "Confirm".
   */
  cta?: string
  /**
   * If undefined, it will default to false.
   */
  disabled?: boolean
  icon?: React.ComponentType<SVGIconProps>
  /**
   * Optionally close dialog automatically on press. If undefined, it will
   * default to true.
   */
  shouldCloseOnPress?: boolean
  testID?: string
}) {
  const {_} = useLingui()
  const {close} = Dialog.useDialogContext()
  const handleOnPress = useCallback(
    (e: GestureResponderEvent) => {
      if (shouldCloseOnPress) {
        close(() => onPress?.(e))
      } else {
        onPress?.(e)
      }
    },
    [close, onPress, shouldCloseOnPress],
  )

  return (
    <Button
      color={color}
      disabled={disabled}
      size="large"
      label={cta || _(msg`Confirm`)}
      onPress={handleOnPress}
      testID={testID}>
      <ButtonText>{cta || _(msg`Confirm`)}</ButtonText>
      {icon && <ButtonIcon icon={icon} />}
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
  type,
  icon,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  title: string
  description?: string
  cancelButtonCta?: string
  confirmButtonCta?: string
  /**
   * Callback to run when the Confirm button is pressed. The method is called
   * _after_ the dialog closes.
   *
   * Note: The dialog will close automatically when the action is pressed, you
   * should NOT close the dialog as a side effect of this method.
   */
  onConfirm: (e: GestureResponderEvent) => void
  confirmButtonColor?: ButtonColor
  showCancel?: boolean
  type?: 'sheet' | 'alert'
  icon?: React.ComponentType<SVGIconProps>
}>) {
  return (
    <Outer control={control} testID="confirmModal" type={type}>
      <Content>
        {icon && <Icon icon={icon} color={confirmButtonColor} />}
        <TitleText>{title}</TitleText>
        {description && <DescriptionText>{description}</DescriptionText>}
      </Content>
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
