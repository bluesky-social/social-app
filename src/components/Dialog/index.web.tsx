import React, {useImperativeHandle} from 'react'
import {View, TouchableWithoutFeedback} from 'react-native'
import {FocusScope} from '@tamagui/focus-scope'
import Animated, {FadeInDown, FadeIn} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTheme, atoms as a, useBreakpoints, web} from '#/alf'
import {Portal} from '#/components/Portal'

import {DialogOuterProps, DialogInnerProps} from '#/components/Dialog/types'
import {Context} from '#/components/Dialog/context'

export {useDialogControl, useDialogContext} from '#/components/Dialog/context'
export * from '#/components/Dialog/types'
export {Input} from '#/components/forms/TextField'

const stopPropagation = (e: any) => e.stopPropagation()

export function Outer({
  control,
  onClose,
  children,
}: React.PropsWithChildren<DialogOuterProps>) {
  const {_} = useLingui()
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
              accessibilityHint={undefined}
              accessibilityLabel={_(msg`Close active dialog`)}
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
                      {opacity: 0.5, backgroundColor: t.palette.black},
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
  label,
  accessibilityLabelledBy,
  accessibilityDescribedBy,
}: DialogInnerProps) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <FocusScope loop enabled trapped>
      <Animated.View
        role="dialog"
        aria-role="dialog"
        aria-label={label}
        aria-labelledby={accessibilityLabelledBy}
        aria-describedby={accessibilityDescribedBy}
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
          {
            maxWidth: 600,
            borderColor: t.palette.contrast_200,
            shadowColor: t.palette.black,
            shadowOpacity: t.name === 'light' ? 0.1 : 0.4,
            shadowRadius: 30,
          },
          ...(Array.isArray(style) ? style : [style || {}]),
        ]}>
        {children}
      </Animated.View>
    </FocusScope>
  )
}

export const ScrollableInner = Inner

export function Handle() {
  return null
}

/**
 * TODO(eric) unused rn
 */
// export function Close() {
//   const {_} = useLingui()
//   const t = useTheme()
//   const {close} = useDialogContext()
//   return (
//     <View
//       style={[
//         a.absolute,
//         a.z_10,
//         {
//           top: a.pt_lg.paddingTop,
//           right: a.pr_lg.paddingRight,
//         },
//       ]}>
//       <Button onPress={close} label={_(msg`Close active dialog`)}>
//       </Button>
//     </View>
//   )
// }
