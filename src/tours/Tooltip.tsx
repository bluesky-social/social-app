import * as React from 'react'
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  Text as RNText,
  View,
} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FocusScope} from '@tamagui/focus-scope'
import {IStep, Labels} from 'rn-tourguide'

import {useWebBodyScrollLock} from '#/lib/hooks/useWebBodyScrollLock'
import {useA11y} from '#/state/a11y'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {leading, Text} from '#/components/Typography'

const stopPropagation = (e: any) => e.stopPropagation()

export interface TooltipComponentProps {
  isFirstStep?: boolean
  isLastStep?: boolean
  currentStep: IStep
  labels?: Labels
  handleNext?: () => void
  handlePrev?: () => void
  handleStop?: () => void
}

export function TooltipComponent({
  isLastStep,
  handleNext,
  handleStop,
  currentStep,
  labels,
}: TooltipComponentProps) {
  const t = useTheme()
  const {_} = useLingui()
  const btnRef = React.useRef<View>(null)
  const textRef = React.useRef<RNText>(null)
  const {screenReaderEnabled} = useA11y()
  useWebBodyScrollLock(true)

  const focusTextNode = () => {
    const node = textRef.current ? findNodeHandle(textRef.current) : undefined
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node)
    }
  }

  // handle initial focus immediately on mount
  React.useLayoutEffect(() => {
    focusTextNode()
  }, [])

  // handle focus between steps
  const innerHandleNext = () => {
    handleNext?.()
    setTimeout(() => focusTextNode(), 200)
  }

  return (
    <FocusScope loop enabled trapped>
      <View
        role="alert"
        aria-role="alert"
        aria-label={_(msg`A help tooltip`)}
        accessibilityLiveRegion="polite"
        // iOS
        accessibilityViewIsModal
        // Android
        importantForAccessibility="yes"
        // @ts-ignore web only
        onClick={stopPropagation}
        onStartShouldSetResponder={_ => true}
        onTouchEnd={stopPropagation}
        style={[
          t.atoms.bg,
          a.px_lg,
          a.py_lg,
          a.flex_col,
          a.gap_md,
          a.rounded_sm,
          a.shadow_md,
          {maxWidth: 300},
        ]}>
        {screenReaderEnabled && (
          <Pressable
            style={[
              a.absolute,
              a.inset_0,
              a.z_10,
              {height: 10, bottom: 'auto'},
            ]}
            accessibilityLabel={_(
              msg`Start of onboarding tour window. Do not move backward. Instead, go forward for more options, or press to skip.`,
            )}
            accessibilityHint={undefined}
            onPress={handleStop}
          />
        )}

        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          <Logo width={16} style={{position: 'relative', top: 0}} />
          <Text
            accessible={false}
            style={[a.text_sm, a.font_semibold, t.atoms.text_contrast_medium]}>
            <Trans>Quick tip</Trans>
          </Text>
        </View>
        <RNText
          ref={textRef}
          testID="stepDescription"
          accessibilityLabel={_(
            msg`Onboarding tour step ${currentStep.name}: ${currentStep.text}`,
          )}
          accessibilityHint={undefined}
          style={[
            a.text_md,
            t.atoms.text,
            a.pb_sm,
            {
              lineHeight: leading(a.text_md, a.leading_snug),
            },
          ]}>
          {currentStep.text}
        </RNText>
        {!isLastStep ? (
          <Button
            ref={btnRef}
            variant="gradient"
            color="gradient_sky"
            size="medium"
            onPress={innerHandleNext}
            label={labels?.next || _(msg`Go to the next step of the tour`)}>
            <ButtonText>{labels?.next || _(msg`Next`)}</ButtonText>
          </Button>
        ) : (
          <Button
            variant="gradient"
            color="gradient_sky"
            size="medium"
            onPress={handleStop}
            label={
              labels?.finish ||
              _(msg`Finish tour and begin using the application`)
            }>
            <ButtonText>{labels?.finish || _(msg`Let's go!`)}</ButtonText>
          </Button>
        )}

        {screenReaderEnabled && (
          <Pressable
            style={[a.absolute, a.inset_0, a.z_10, {height: 10, top: 'auto'}]}
            accessibilityLabel={_(
              msg`End of onboarding tour window. Do not move forward. Instead, go backward for more options, or press to skip.`,
            )}
            accessibilityHint={undefined}
            onPress={handleStop}
          />
        )}
      </View>
    </FocusScope>
  )
}
