import React, {useImperativeHandle} from 'react'
import {
  FlatList,
  FlatListProps,
  StyleProp,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {DismissableLayer} from '@radix-ui/react-dismissable-layer'
import {useFocusGuards} from '@radix-ui/react-focus-guards'
import {FocusScope} from '@radix-ui/react-focus-scope'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {logger} from '#/logger'
import {useA11y} from '#/state/a11y'
import {useDialogStateControlContext} from '#/state/dialogs'
import {atoms as a, flatten, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Context} from '#/components/Dialog/context'
import {
  DialogControlProps,
  DialogInnerProps,
  DialogOuterProps,
} from '#/components/Dialog/types'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Portal} from '#/components/Portal'

export {useDialogContext, useDialogControl} from '#/components/Dialog/context'
export * from '#/components/Dialog/shared'
export * from '#/components/Dialog/types'
export * from '#/components/Dialog/utils'
export {Input} from '#/components/forms/TextField'

const stopPropagation = (e: any) => e.stopPropagation()
const preventDefault = (e: any) => e.preventDefault()

export function Outer({
  children,
  control,
  onClose,
  webOptions,
}: React.PropsWithChildren<DialogOuterProps>) {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const [isOpen, setIsOpen] = React.useState(false)
  const {setDialogIsOpen} = useDialogStateControlContext()

  const open = React.useCallback(() => {
    setDialogIsOpen(control.id, true)
    setIsOpen(true)
  }, [setIsOpen, setDialogIsOpen, control.id])

  const close = React.useCallback<DialogControlProps['close']>(
    cb => {
      setDialogIsOpen(control.id, false)
      setIsOpen(false)

      try {
        if (cb && typeof cb === 'function') {
          // This timeout ensures that the callback runs at the same time as it would on native. I.e.
          // console.log('Step 1') -> close(() => console.log('Step 3')) -> console.log('Step 2')
          // This should always output 'Step 1', 'Step 2', 'Step 3', but without the timeout it would output
          // 'Step 1', 'Step 3', 'Step 2'.
          setTimeout(cb)
        }
      } catch (e: any) {
        logger.error(`Dialog closeCallback failed`, {
          message: e.message,
        })
      }

      onClose?.()
    },
    [control.id, onClose, setDialogIsOpen],
  )

  const handleBackgroundPress = React.useCallback(async () => {
    close()
  }, [close])

  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [close, open],
  )

  const context = React.useMemo(
    () => ({
      close,
      isNativeDialog: false,
      nativeSnapPoint: 0,
      disableDrag: false,
      setDisableDrag: () => {},
      isWithinDialog: true,
    }),
    [close],
  )

  return (
    <>
      {isOpen && (
        <Portal>
          <Context.Provider value={context}>
            <RemoveScrollBar />
            <TouchableWithoutFeedback
              accessibilityHint={undefined}
              accessibilityLabel={_(msg`Close active dialog`)}
              onPress={handleBackgroundPress}>
              <View
                style={[
                  web(a.fixed),
                  a.inset_0,
                  a.z_10,
                  a.px_xl,
                  webOptions?.alignCenter ? a.justify_center : undefined,
                  a.align_center,
                  {
                    overflowY: 'auto',
                    paddingVertical: gtMobile ? '10vh' : a.pt_xl.paddingTop,
                  },
                ]}>
                <Backdrop />
                <View
                  style={[
                    a.w_full,
                    a.z_20,
                    a.align_center,
                    web({minHeight: '60vh'}),
                  ]}>
                  {children}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Context.Provider>
        </Portal>
      )}
    </>
  )
}

export function Inner({
  children,
  style,
  label,
  accessibilityLabelledBy,
  accessibilityDescribedBy,
  header,
  contentContainerStyle,
}: DialogInnerProps) {
  const t = useTheme()
  const {close} = React.useContext(Context)
  const {gtMobile} = useBreakpoints()
  const {reduceMotionEnabled} = useA11y()
  useFocusGuards()
  return (
    <FocusScope loop asChild trapped>
      <View
        role="dialog"
        aria-role="dialog"
        aria-label={label}
        aria-labelledby={accessibilityLabelledBy}
        aria-describedby={accessibilityDescribedBy}
        // @ts-expect-error web only -prf
        onClick={stopPropagation}
        onStartShouldSetResponder={_ => true}
        onTouchEnd={stopPropagation}
        style={flatten([
          a.relative,
          a.rounded_md,
          a.w_full,
          a.border,
          t.atoms.bg,
          {
            maxWidth: 600,
            borderColor: t.palette.contrast_200,
            shadowColor: t.palette.black,
            shadowOpacity: t.name === 'light' ? 0.1 : 0.4,
            shadowRadius: 30,
          },
          !reduceMotionEnabled && a.zoom_fade_in,
          style,
        ])}>
        <DismissableLayer
          onInteractOutside={preventDefault}
          onFocusOutside={preventDefault}
          onDismiss={close}
          style={{display: 'flex', flexDirection: 'column'}}>
          {header}
          <View style={[gtMobile ? a.p_2xl : a.p_xl, contentContainerStyle]}>
            {children}
          </View>
        </DismissableLayer>
      </View>
    </FocusScope>
  )
}

export const ScrollableInner = Inner

export const InnerFlatList = React.forwardRef<
  FlatList,
  FlatListProps<any> & {label: string} & {
    webInnerStyle?: StyleProp<ViewStyle>
    webInnerContentContainerStyle?: StyleProp<ViewStyle>
  }
>(function InnerFlatList(
  {label, style, webInnerStyle, webInnerContentContainerStyle, ...props},
  ref,
) {
  const {gtMobile} = useBreakpoints()
  return (
    <Inner
      label={label}
      style={[
        a.overflow_hidden,
        a.px_0,
        // @ts-expect-error web only -sfn
        {maxHeight: 'calc(-36px + 100vh)'},
        webInnerStyle,
      ]}
      contentContainerStyle={[a.px_0, webInnerContentContainerStyle]}>
      <FlatList
        ref={ref}
        style={[gtMobile ? a.px_2xl : a.px_xl, flatten(style)]}
        {...props}
      />
    </Inner>
  )
})

export function Close() {
  const {_} = useLingui()
  const {close} = React.useContext(Context)
  return (
    <View
      style={[
        a.absolute,
        a.z_10,
        {
          top: a.pt_md.paddingTop,
          right: a.pr_md.paddingRight,
        },
      ]}>
      <Button
        size="small"
        variant="ghost"
        color="secondary"
        shape="round"
        onPress={() => close()}
        label={_(msg`Close active dialog`)}>
        <ButtonIcon icon={X} size="md" />
      </Button>
    </View>
  )
}

export function Handle() {
  return null
}

function Backdrop() {
  const t = useTheme()
  const {reduceMotionEnabled} = useA11y()
  return (
    <View style={{opacity: 0.8}}>
      <View
        style={[
          a.fixed,
          a.inset_0,
          {backgroundColor: t.palette.black},
          !reduceMotionEnabled && a.fade_in,
        ]}
      />
    </View>
  )
}
