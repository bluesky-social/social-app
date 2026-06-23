import {Fragment} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

const TOTAL_STEPS = 2

export function SetupHeader({
  step,
  onBack,
}: {
  step: number
  onBack: () => boolean | void
}) {
  return (
    <Layout.Header.Outer>
      <Layout.Header.BackButton
        onPress={evt => {
          // If onBack handled it, don't also navigate away.
          if (onBack()) {
            evt.preventDefault()
          }
        }}
      />
      <Layout.Header.Content align="left">
        <Layout.Header.TitleText>
          <Trans>News</Trans>
        </Layout.Header.TitleText>
      </Layout.Header.Content>
      <StepDots current={step} />
    </Layout.Header.Outer>
  )
}

function StepDots({current}: {current: number}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      {Array.from({length: TOTAL_STEPS}).map((_unused, index) => {
        const n = index + 1
        const active = n <= current
        return (
          <Fragment key={n}>
            {index > 0 && (
              <View style={[{width: 24, height: 2}, t.atoms.bg_contrast_100]} />
            )}
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.rounded_full,
                {width: 28, height: 28},
                active
                  ? {backgroundColor: t.palette.primary_500}
                  : t.atoms.bg_contrast_100,
              ]}>
              <Text
                style={[
                  a.text_sm,
                  a.font_bold,
                  {
                    color: active
                      ? t.palette.white
                      : t.atoms.text_contrast_medium.color,
                  },
                ]}>
                {n}
              </Text>
            </View>
          </Fragment>
        )
      })}
    </View>
  )
}
