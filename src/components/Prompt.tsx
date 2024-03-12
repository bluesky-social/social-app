import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import React from 'react'
import {PressableProps, View} from 'react-native'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

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
}: React.PropsWithChildren<{onPress?: PressableProps['onPress']}>) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()
  return (
    <Button
      variant="solid"
      color="secondary"
      size={gtMobile ? 'small' : 'medium'}
      label={_(msg`Cancel`)}
      onPress={() => close()}>
      {children}
    </Button>
  )
}

export function Action({
  children,
  onPress,
}: React.PropsWithChildren<{onPress?: () => void}>) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()
  const handleOnPress = React.useCallback(() => {
    close()
    onPress?.()
  }, [close, onPress])
  return (
    <Button
      variant="solid"
      color="primary"
      size={gtMobile ? 'small' : 'medium'}
      label={_(msg`Confirm`)}
      onPress={handleOnPress}>
      {children}
    </Button>
  )
}
