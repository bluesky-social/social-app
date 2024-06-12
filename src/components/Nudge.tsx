import React from 'react'
import {Keyboard, StyleProp, View, ViewStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {Portal} from '#/components/Portal'
import {Button} from './Button'
import {Text} from './Typography'

type Anchor = 'top_left' | 'top_center' | 'top_right'

interface NudgeProps {
  testID?: string
  isOpen: boolean
  anchor: Anchor
  onClose: () => void
  style?: StyleProp<ViewStyle>
}

export function Nudge({
  children,
  testID,
  isOpen,
  anchor,
  onClose,
  style,
}: React.PropsWithChildren<NudgeProps>) {
  const t = useTheme()
  const {_} = useLingui()
  const anchorPositioningStyle = useAnchorPositioningStyle(anchor)
  return (
    isOpen && (
      <Portal>
        <FullWindowOverlay>
          {/* Backdrop overlay */}
          <View
            style={[
              a.fixed,
              a.inset_0,
              {backgroundColor: '#000', opacity: 0.1},
              a.pointer_events_none,
            ]}
          />
          <View
            // iOS
            accessibilityViewIsModal
            // Android
            importantForAccessibility="yes"
            style={[a.fixed, a.px_lg, a.py_md, style]}
            testID={testID}
            onTouchMove={() => Keyboard.dismiss()}>
            {/* Angle pointer up */}
            <View
              style={[
                a.absolute,
                anchorPositioningStyle,
                {
                  width: 16,
                  height: 16,
                  backgroundColor: t.palette.primary_500,
                  transform: [{rotate: '45deg'}],
                },
              ]}
            />

            <LinearGradient
              colors={[t.palette.primary_500, t.palette.primary_400]}
              locations={[0, 1]}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={[a.absolute, a.inset_0, a.rounded_sm]}
            />
            <View>{children}</View>
            <Button label={_(msg`Okay`)} onPress={onClose}>
              {({hovered}) => (
                <View
                  style={[
                    a.flex_1,
                    a.px_lg,
                    a.py_md,
                    a.rounded_xs,
                    a.border,
                    {borderColor: '#fff'},
                    hovered && {backgroundColor: t.palette.primary_400},
                  ]}>
                  <Text
                    style={[
                      a.text_md,
                      a.text_center,
                      a.font_semibold,
                      {color: '#fff'},
                    ]}>
                    <Trans>Okay</Trans>
                  </Text>
                </View>
              )}
            </Button>
          </View>
        </FullWindowOverlay>
      </Portal>
    )
  )
}

function useAnchorPositioningStyle(anchor: Anchor): ViewStyle {
  if (anchor === 'top_center') {
    return {left: isWeb ? '48%' : '52%', top: -8}
  }
  if (anchor === 'top_right') {
    return {right: 20, top: -8}
  }
  return {left: 20, top: -8}
}
