import React, {useImperativeHandle} from 'react'
import {View, TouchableWithoutFeedback} from 'react-native'
import {FocusScope} from '@tamagui/focus-scope'
import Animated, {FadeInDown, FadeIn} from 'react-native-reanimated'

import {useTheme, atoms as a, useBreakpoints, web} from '#/alf'
import {Text} from '#/components/Typography'
import {Portal} from '#/components/Portal'
import {Button} from '#/components/Button'

import {DialogOuterProps, DialogInnerProps} from '#/components/Dialog/types'
import {Context, useDialogContext} from '#/components/Dialog/context'

export {useDialogControl, useDialogContext} from '#/components/Dialog/context'
export * from '#/components/Dialog/types'

const stopPropagation = (e: any) => e.stopPropagation()

export function Outer({
  control,
  onClose,
  children,
}: React.PropsWithChildren<DialogOuterProps>) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)

  const open = React.useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const close = React.useCallback(async () => {
    setIsVisible(false)
    await new Promise(resolve => setTimeout(resolve, 150))
    setIsOpen(false)
    setIsVisible(true)
    onClose?.()
  }, [onClose, setIsOpen])

  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [open, close],
  )

  React.useEffect(() => {
    if (!isOpen) return

    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('keydown', handler)

    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, close])

  const context = React.useMemo(
    () => ({
      close,
    }),
    [close],
  )

  return (
    <>
      {isOpen && (
        <Portal>
          <Context.Provider value={context}>
            <TouchableWithoutFeedback
              accessibilityRole="button"
              onPress={close}>
              <View
                style={[
                  web(a.fixed),
                  a.inset_0,
                  a.z_10,
                  a.align_center,
                  gtMobile ? a.p_lg : a.p_md,
                  {overflowY: 'auto'},
                ]}>
                {isVisible && (
                  <Animated.View
                    entering={FadeIn.duration(150)}
                    // exiting={FadeOut.duration(150)}
                    style={[
                      web(a.fixed),
                      a.inset_0,
                      t.atoms.bg_contrast_300,
                      {opacity: 0.8},
                    ]}
                  />
                )}

                <View
                  style={[
                    a.w_full,
                    a.z_20,
                    a.justify_center,
                    a.align_center,
                    {
                      minHeight: web('calc(90vh - 36px)') || undefined,
                    },
                  ]}>
                  {isVisible ? children : null}
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
  accessibilityLabelledBy,
  accessibilityDescribedBy,
}: DialogInnerProps) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <FocusScope loop enabled trapped>
      <Animated.View
        aria-labelledby={accessibilityLabelledBy}
        aria-describedby={accessibilityDescribedBy}
        aria-role="dialog"
        // @ts-ignore web only -prf
        onClick={stopPropagation}
        onStartShouldSetResponder={_ => true}
        onTouchEnd={stopPropagation}
        entering={FadeInDown.duration(100)}
        // exiting={FadeOut.duration(100)}
        style={[
          a.relative,
          a.rounded_md,
          a.w_full,
          a.border,
          gtMobile ? a.p_xl : a.p_lg,
          t.atoms.bg,
          {maxWidth: 600, borderColor: t.palette.contrast_300},
          ...(Array.isArray(style) ? style : [style || {}]),
        ]}>
        {children}
      </Animated.View>
    </FocusScope>
  )
}

export function Handle() {
  return null
}

export function Close() {
  const t = useTheme()
  const {close} = useDialogContext()
  return (
    <View
      style={[
        a.absolute,
        a.z_10,
        {
          top: a.pt_lg.paddingTop,
          right: a.pr_lg.paddingRight,
        },
      ]}>
      <Button
        onPress={close}
        accessibilityLabel="Close dialog"
        accessibilityHint="Clicking this button will close the current dialog.">
        {() => (
          <View
            style={[
              a.justify_center,
              a.align_center,
              a.rounded_full,
              t.atoms.bg_contrast_200,
              {
                pointerEvents: 'none',
                height: 32,
                width: 32,
              },
            ]}>
            <Text>X</Text>
          </View>
        )}
      </Button>
    </View>
  )
}
