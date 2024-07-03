import React from 'react'
import {View} from 'react-native'
import * as Progress from 'react-native-progress'

import {atoms as a, useTheme} from '#/alf'
import {AnimatedCheck} from '../anim/AnimatedCheck'
import {Text} from '../Typography'

export function ProgressGuideTask({
  current,
  total,
  title,
  subtitle,
}: {
  current: number
  total: number
  title: string
  subtitle?: string
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.gap_md, !subtitle && a.align_center]}>
      {current === total ? (
        <AnimatedCheck playOnMount fill={t.palette.primary_500} width={24} />
      ) : (
        <Progress.Circle
          progress={current / total}
          color={t.palette.primary_400}
          size={24}
          thickness={2}
          borderWidth={0}
          unfilledColor={t.palette.contrast_50}
        />
      )}

      <View style={[a.flex_col, a.gap_xs]}>
        <Text style={[a.text_md, a.font_semibold]}>{title}</Text>
        {subtitle && (
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  )
}
